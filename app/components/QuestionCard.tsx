"use client";

export type Question = {
  id: number;
  question: string;
  options: string[];
  correct: number;
  image: string | null;
};

// These are the inputs that the page gives to the question card.
type QuestionCardProps = {
  question: Question;
  questionNumber: number;
  total: number;
  selected: number | null;
  checked: boolean;
  isUltimate: boolean;
  onSelectOption: (index: number) => void;
  onNextQuestion: () => void;
};

export default function QuestionCard(props: QuestionCardProps) {
  // The page owns the quiz state; this component displays the supplied values.
  const question = props.question;

  return (
    <article className="question-card" aria-labelledby="question-heading">
      <div className="card-topline">
        <span>Question {props.questionNumber}</span>
        <span>
          {question.image ? "Visual question" : "Road rule"} · Source {question.id}
        </span>
      </div>

      {question.image && (
        <div className="image-stage">
          <img
            src={`${import.meta.env.BASE_URL}${question.image?.replace(/^\/+/, "")}`}
            alt={`Road diagram for question ${question.id}`}
          />
        </div>
      )}

      <div className="question-content">
        <p className="question-kicker">Choose the correct answer</p>
        <h2 id="question-heading">{question.question}</h2>

        <div
          className="options"
          role="radiogroup"
          aria-labelledby="question-heading"
        >
          {question.options.map((option, index) => {
            const isSelected = props.selected === index;
            const isCorrect = props.checked && question.correct === index;
            const isIncorrect =
              props.checked && isSelected && question.correct !== index;
            // Keep "option" for the base style, then add the answer colours.
            let optionClass = "option";

            if (isSelected) {
              optionClass = optionClass + " selected";
            }
            if (isCorrect) {
              optionClass = optionClass + " correct";
            }
            if (isIncorrect) {
              optionClass = optionClass + " incorrect";
            }

            return (
              <button
                aria-checked={isSelected}
                className={optionClass}
                key={`${question.id}-${index}`}
                onClick={() => props.onSelectOption(index)}
                role="radio"
                type="button"
              >
                <span className="option-letter">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="option-text">{option}</span>
                {isCorrect && <span className="answer-mark">✓</span>}
                {isIncorrect && <span className="answer-mark">×</span>}
              </button>
            );
          })}
        </div>

        {props.checked && (
          <div
            className={`feedback ${
              props.selected === question.correct ? "success" : "retry"
            }`}
            role="status"
          >
            <strong>
              {props.selected === question.correct
                ? "Correct!"
                : "Not quite."}
            </strong>
            <span>
              {props.selected === question.correct
                ? " You chose the right answer."
                : ` The correct answer is ${String.fromCharCode(
                    65 + question.correct,
                  )}.`}
            </span>
          </div>
        )}

        <div className="actions">
          <button
            className="primary-button"
            style={props.isUltimate ? { marginInline: "auto", width: "100%", maxWidth: "360px" } : undefined}
            disabled={!props.checked}
            onClick={props.onNextQuestion}
            type="button"
          >
            {props.questionNumber === props.total ? "See results" : "Next card"}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </article>
  );
}
