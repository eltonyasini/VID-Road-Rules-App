import { useEffect, useRef } from "react";

export type Question = {
  id: number;
  question: string;
  options: string[];
  correct: number;
  image: string | null;
};

type QuestionCardProps = {
  question: Question;
  questionNumber: number;
  total: number;
  onSelectOption: (index: number) => void;
};

export default function QuestionCard(props: QuestionCardProps) {
  const question = props.question;
  const heading = useRef<HTMLHeadingElement>(null);

  // Move keyboard focus to the new question, not an answer in the same position.
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [question.id]);

  return (
    <article className="question-card" aria-labelledby="question-heading">
      <div className="card-topline">
        <span>Question {props.questionNumber} of {props.total}</span>
        <span>{question.image ? "Visual question" : "Road rule"} · Source {question.id}</span>
      </div>
      {question.image && (
        <div className="image-stage">
          <img src={`${import.meta.env.BASE_URL}${question.image.replace(/^\/+/, "")}`} alt={`Road diagram for question ${question.id}`} />
        </div>
      )}
      <div className="question-content">
        <p className="question-kicker">Choose an answer to continue</p>
        <h2 id="question-heading" ref={heading} tabIndex={-1}>{question.question}</h2>
        <div className="options" role="group" aria-labelledby="question-heading">
          {question.options.map((option, index) => (
            <button className="option" key={`${question.id}-${index}`} type="button"
              onClick={(event) => {
                // Ignore the second click of a double-click.
                if (event.detail > 1) return;
                props.onSelectOption(index);
              }}>
              <span className="option-letter">{String.fromCharCode(65 + index)}</span>
              <span className="option-text">{option}</span>
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}
