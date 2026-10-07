import { useEffect, useRef, useState } from "react";
import type { Question } from "./QuestionCard";
import { countCorrectAnswers, type Answer } from "../quizSession";

type QuizResultsProps = {
  modeTitle: string;
  answers: Answer[];
  questions: Question[];
  total: number;
  isRandom: boolean;
  onRetry: () => void;
  onGoToMenu: () => void;
};

export default function QuizResults(props: QuizResultsProps) {
  const [review, setReview] = useState<"none" | "all" | "mistakes">("none");
  const heading = useRef<HTMLHeadingElement>(null);
  const answeredCount = props.answers.length;
  const score = countCorrectAnswers(props.answers, props.questions);
  let percentage = 0;
  if (answeredCount > 0) percentage = Math.round((score / answeredCount) * 100);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);

  function toggleReview(choice: "all" | "mistakes") {
    if (review === choice) setReview("none");
    else setReview(choice);
  }

  return (
    <>
      <section className="result-card" aria-labelledby="result-heading">
        <div className="result-mark">✓</div>
        <p className="eyebrow">{props.modeTitle.toUpperCase()} RESULTS</p>
        <h2 id="result-heading" ref={heading} tabIndex={-1}>
          {answeredCount === props.total ? `You finished all ${props.total} questions.` : `You answered ${answeredCount} of ${props.total} questions.`}
        </h2>
        <p className="result-score">{score} / {answeredCount}</p>
        <p className="result-percentage">Correct answers: {percentage}%</p>
        {answeredCount < props.total && <p>Unanswered questions are not counted as wrong.</p>}
        <div className="review-actions">
          <button className="secondary-button" type="button" aria-expanded={review === "all"} aria-controls="answer-review" onClick={() => toggleReview("all")}>Review answers</button>
          <button className="secondary-button" type="button" aria-expanded={review === "mistakes"} aria-controls="answer-review" onClick={() => toggleReview("mistakes")}>Review mistakes ({answeredCount - score})</button>
        </div>
        <div className="result-actions">
          <button className="secondary-button" type="button" onClick={props.onGoToMenu}>Choose another mode</button>
          <button className="primary-button restart-button" type="button" onClick={props.onRetry}>{props.isRandom ? "New random 25" : "Try again"}</button>
        </div>
      </section>
      <section id="answer-review" className="answer-review" hidden={review === "none"} aria-labelledby="review-heading">
        <h2 id="review-heading">{review === "mistakes" ? "Your mistakes" : "Your answers"}</h2>
        {review === "mistakes" && score === answeredCount && <p>No mistakes—you got every answered question right.</p>}
        {review !== "none" && props.answers.map((answer, index) => {
          const question = props.questions.find((item) => item.id === answer.questionId);
          if (!question) return null;
          const isCorrect = answer.selectedAnswer === question.correct;
          if (review === "mistakes" && isCorrect) return null;
          let answerClass = "review-answer incorrect";
          if (isCorrect) answerClass = "review-answer correct";
          return (
            <article className="review-card" key={question.id}>
              <p className="question-kicker">Question {index + 1} · {isCorrect ? "Correct" : "Incorrect"}</p>
              <h3>{question.question}</h3>
              {question.image && <img loading="lazy" src={`${import.meta.env.BASE_URL}${question.image.replace(/^\/+/, "")}`} alt={`Road diagram for question ${question.id}`} />}
              <p className={answerClass}><strong>Your answer: </strong>{question.options[answer.selectedAnswer]}</p>
              {!isCorrect && <p className="review-answer correct"><strong>Correct answer: </strong>{question.options[question.correct]}</p>}
            </article>
          );
        })}
      </section>
    </>
  );
}
