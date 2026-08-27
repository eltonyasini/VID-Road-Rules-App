#!/usr/bin/env python3
"""Extract VID multiple-choice questions and diagrams from the source PDF."""

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

import pdfplumber
from PIL import Image


PDF_PATH = Path(sys.argv[1])
SITE_ROOT = Path(__file__).resolve().parents[1]
IMAGE_DIR = SITE_ROOT / "public" / "question-images"
DATA_PATH = SITE_ROOT / "app" / "questions.json"


@dataclass
class LogicalRow:
    fragments: list[dict] = field(default_factory=list)

    @property
    def height(self) -> float:
        return sum(fragment["height"] for fragment in self.fragments)


def clean_text(text: str) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    return text.replace(" ’ ", "’")


def words_in(page, x0: float, x1: float, top: float, bottom: float):
    return [
        word
        for word in page.extract_words(extra_attrs=["fontname", "size"])
        if word["x0"] >= x0 - 1
        and word["x1"] <= x1 + 1
        and word["top"] >= top - 1
        and word["bottom"] <= bottom + 1
    ]


def group_lines(words: list[dict]) -> list[tuple[float, list[dict]]]:
    lines: list[tuple[float, list[dict]]] = []
    for word in sorted(words, key=lambda item: (item["top"], item["x0"])):
        for index, (top, line_words) in enumerate(lines):
            if abs(top - word["top"]) <= 2:
                line_words.append(word)
                lines[index] = (min(top, word["top"]), line_words)
                break
        else:
            lines.append((word["top"], [word]))
    return sorted(lines, key=lambda item: item[0])


def get_column_cell(row, target_x0: float):
    for cell in row.cells:
        if cell and abs(cell[0] - target_x0) < 2:
            return cell
    return None


def find_fragments(pdf) -> list[LogicalRow]:
    logical_rows: list[LogicalRow] = []

    for page_index, page in enumerate(pdf.pages):
        tables = page.find_tables()
        if not tables:
            continue

        page_rows = []
        for row_index, row in enumerate(tables[0].rows):
            question_cell = get_column_cell(row, 86.45)
            image_cell = get_column_cell(row, 296.03)
            answer_cell = get_column_cell(row, 404.75)
            if not (question_cell and image_cell and answer_cell):
                continue

            y0, y1 = question_cell[1], question_cell[3]
            if page_index == 0 and y1 <= 76:
                continue
            fragment_words = words_in(page, 88, 614, y0, y1)
            if not fragment_words:
                continue
            page_rows.append(
                {
                    "page_index": page_index,
                    "page": page,
                    "question_cell": question_cell,
                    "image_cell": image_cell,
                    "answer_cell": answer_cell,
                    "top": y0,
                    "bottom": y1,
                    "height": y1 - y0,
                    "has_question_text": any(word["x0"] < 296 for word in fragment_words),
                    "is_first": False,
                    "is_last": False,
                }
            )

        for index, fragment in enumerate(page_rows):
            fragment["is_first"] = index == 0
            fragment["is_last"] = index == len(page_rows) - 1

            if fragment["has_question_text"] or not logical_rows:
                logical_rows.append(LogicalRow([fragment]))
            else:
                # Excel page breaks and wrapped cells can split the final
                # answer choice into a separate table fragment. A fragment
                # without question text belongs to the preceding question.
                logical_rows[-1].fragments.append(fragment)

    return logical_rows


def extract_image(image_info: dict, output_path: Path) -> None:
    stream = image_info["stream"]
    attrs = stream.attrs
    width = int(attrs["Width"])
    height = int(attrs["Height"])
    colorspace = str(attrs.get("ColorSpace", "DeviceRGB"))
    mode = "L" if "Gray" in colorspace else "RGB"
    data = stream.get_data()

    try:
        image = Image.frombytes(mode, (width, height), data)
    except ValueError:
        # JPEG streams can be opened directly when their decoded byte count is
        # not a raw pixel buffer.
        from io import BytesIO

        image = Image.open(BytesIO(data)).convert(mode)

    smask = attrs.get("SMask")
    if smask is not None:
        mask_stream = smask.resolve()
        mask = Image.frombytes(
            "L",
            (int(mask_stream.attrs["Width"]), int(mask_stream.attrs["Height"])),
            mask_stream.get_data(),
        )
        image = image.convert("RGBA")
        image.putalpha(mask)

    image.save(output_path, "PNG", optimize=True)


def extract_question(row: LogicalRow, question_number: int) -> dict:
    question_lines: list[str] = []
    answer_lines: list[dict] = []
    images: list[dict] = []
    accumulated_height = 0.0

    for fragment in row.fragments:
        page = fragment["page"]
        y0, y1 = fragment["top"], fragment["bottom"]
        q_words = words_in(page, 88, 296, y0, y1)
        a_words = words_in(page, 406, 614, y0, y1)

        for _, line_words in group_lines(q_words):
            question_lines.append(" ".join(word["text"] for word in line_words))

        for line_top, line_words in group_lines(a_words):
            answer_lines.append(
                {
                    "top": accumulated_height + (line_top - y0),
                    "text": " ".join(word["text"] for word in line_words),
                    "bold": any("Bold" in word["fontname"] for word in line_words),
                }
            )

        for image in page.images:
            overlaps_row = image["bottom"] > y0 and image["top"] < y1
            in_image_column = image["x0"] >= 295 and image["x1"] <= 406
            if overlaps_row and in_image_column:
                images.append(image)

        accumulated_height += fragment["height"]

    options: list[dict] = []
    if row.height < 75:
        # A few test-boundary rows are vertically compressed. Their three
        # choices are still evenly distributed within the shortened row.
        option_gap = row.height / 3
        options = [{"parts": [], "bold": False} for _ in range(3)]
        for line in answer_lines:
            option_index = max(
                0,
                min(2, int((line["top"] + option_gap * 0.15) // option_gap)),
            )
            options[option_index]["parts"].append(line["text"])
            options[option_index]["bold"] = options[option_index]["bold"] or line["bold"]
    else:
        # Normal rows place each new option about 28 points apart; wrapped
        # lines within an option are about 12 points apart. This also retains
        # the occasional two-choice or four-choice question in the source.
        previous_top = None
        for line in sorted(answer_lines, key=lambda item: item["top"]):
            if previous_top is None or line["top"] - previous_top >= 14.5:
                options.append({"parts": [], "bold": False})
            options[-1]["parts"].append(line["text"])
            options[-1]["bold"] = options[-1]["bold"] or line["bold"]
            previous_top = line["top"]

    option_texts = [clean_text(" ".join(option["parts"])) for option in options]
    while option_texts and not option_texts[-1]:
        option_texts.pop()
        options.pop()
    option_texts = [
        re.sub(rf"^{chr(65 + index)}[.)]\s*", "", text, flags=re.IGNORECASE)
        for index, text in enumerate(option_texts)
    ]
    correct_indexes = [index for index, option in enumerate(options) if option["bold"]]

    question = clean_text(" ".join(question_lines))
    if not question or len(option_texts) < 2 or not all(option_texts) or len(correct_indexes) != 1:
        raise ValueError(
            f"Question {question_number} extraction failed: "
            f"question={question!r}, options={option_texts!r}, correct={correct_indexes!r}, "
            f"fragments={[(f['page_index'] + 1, f['top'], f['bottom']) for f in row.fragments]!r}"
        )

    image_path = None
    if images:
        # Split rows can expose the same source image on two pages. The source
        # stream is complete in either fragment, so save only the first copy.
        image_name = f"q-{question_number:03d}.png"
        extract_image(images[0], IMAGE_DIR / image_name)
        image_path = f"/question-images/{image_name}"

    return {
        "id": question_number,
        "question": question,
        "options": option_texts,
        "correct": correct_indexes[0],
        "image": image_path,
    }


def main() -> None:
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    for old_image in IMAGE_DIR.glob("q-*.png"):
        old_image.unlink()

    with pdfplumber.open(PDF_PATH) as pdf:
        rows = find_fragments(pdf)
        questions = [
            extract_question(row, index)
            for index, row in enumerate(rows, start=1)
        ]

    DATA_PATH.write_text(
        json.dumps(questions, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "questions": len(questions),
                "with_images": sum(bool(question["image"]) for question in questions),
                "without_images": sum(not question["image"] for question in questions),
                "data": str(DATA_PATH),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
