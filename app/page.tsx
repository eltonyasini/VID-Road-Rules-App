"use client";

import { useEffect, useMemo, useState } from "react";
import questionsData from "./questions.json";

type Question = {
  id: number;
  question: string;
  options: string[];
  correct: number;
  image: string | null;
};

type QuizKind = "set" | "random" | "ultimate";
type Phase = "menu" | "quiz" | "results";

type SavedSession = {
  phase: Phase;
  kind: QuizKind | null;
  setNumber: number | null;
  questionIds: number[];
  current: number;
  selected: number | null;
  checked: boolean;
  score: number;
};

const questions = questionsData as Question[];
const storageKey = "vid-question-cards-session-v2";
const setSize = 25;
const setCount = Math.ceil(questions.length / setSize);

const emptySession: SavedSession = {
  phase: "menu",
  kind: null,
  setNumber: null,
  questionIds: [],
  current: 0,
  selected: null,
  checked: false,
  score: 0,
};

function shuffleIds(ids: number[]) {
  const shuffled = [...ids];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}

function isValidSavedSession(value: unknown): value is SavedSession {
  if (!value || typeof value !== "object") return false;
  const saved = value as Partial<SavedSession>;
  return (
    ["menu", "quiz", "results"].includes(saved.phase ?? "") &&
    Array.isArray(saved.questionIds) &&
    saved.questionIds.every(
      (id) => Number.isInteger(id) && id >= 1 && id <= questions.length,
    ) &&
    Number.isInteger(saved.current) &&
    (saved.current ?? -1) >= 0 &&
    (saved.phase === "menu" || (saved.current ?? 0) < saved.questionIds.length)
  );
}

export default function Home() {
  const [session, setSession] = useState<SavedSession>(emptySession);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as unknown;
        if (isValidSavedSession(parsed)) setSession(parsed);
      }
    } catch {
      // A blocked or malformed local session should never stop practice.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(storageKey, JSON.stringify(session));
  }, [ready, session]);

  const activeQuestions = useMemo(
    () =>
      session.questionIds
        .map((id) => questions[id - 1])
        .filter((question): question is Question => Boolean(question)),
    [session.questionIds],
  );

  const question = activeQuestions[session.current] ?? questions[0];
  const total = activeQuestions.length;
  const progress =
    session.phase === "results"
      ? 100
      : total
        ? ((session.current + (session.checked ? 1 : 0)) / total) * 100
        : 0;
  const percentage = total ? Math.round((session.score / total) * 100) : 0;

  const modeTitle =
    session.kind === "set"
      ? `Set ${session.setNumber}`
      : session.kind === "random"
        ? "Random 25"
        : "Ultimate 400";

  function beginQuiz(
    kind: QuizKind,
    questionIds: number[],
    setNumber: number | null = null,
  ) {
    setSession({
      phase: "quiz",
      kind,
      setNumber,
      questionIds,
      current: 0,
      selected: null,
      checked: false,
      score: 0,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startSet(setIndex: number) {
    const first = setIndex * setSize;
    const questionIds = questions
      .slice(first, first + setSize)
      .map((item) => item.id);
    beginQuiz("set", questionIds, setIndex + 1);
  }

  function startRandom() {
    const questionIds = shuffleIds(questions.map((item) => item.id)).slice(
      0,
      setSize,
    );
    beginQuiz("random", questionIds);
  }

  function startUltimate() {
    beginQuiz(
      "ultimate",
      questions.map((item) => item.id),
    );
  }

  function selectOption(index: number) {
    if (session.checked) return;
    setSession((current) => ({ ...current, selected: index }));
  }

  function checkAnswer() {
    if (session.selected === null || session.checked) return;
    setSession((current) => ({
      ...current,
      checked: true,
      score:
        current.score + (current.selected === question.correct ? 1 : 0),
    }));
  }

  function nextQuestion() {
    if (!session.checked) return;
    if (session.current === total - 1) {
      setSession((current) => ({ ...current, phase: "results" }));
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSession((current) => ({
      ...current,
      current: current.current + 1,
      selected: null,
      checked: false,
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function retryQuiz() {
    if (session.kind === "random") {
      startRandom();
      return;
    }
    setSession((current) => ({
      ...current,
      phase: "quiz",
      current: 0,
      selected: null,
      checked: false,
      score: 0,
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToMenu() {
    setSession(emptySession);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!ready) {
    return (
      <main className="app-shell loading-shell" aria-live="polite">
        <div className="loading-dot" />
        <p>Opening your practice cards…</p>
      </main>
    );
  }

  if (session.phase === "menu") {
    return (
      <main className="app-shell menu-shell">
        <header className="menu-header">
          <p className="eyebrow">VID PRACTICE</p>
          <h1>How do you want to practise?</h1>
          <p className="menu-intro">
            Work through the questions in smaller sets, create a random test,
            or take on every question from the PDF.
          </p>
        </header>

        <section className="sets-panel" aria-labelledby="sets-heading">
          <div className="section-heading">
            <div>
              <p className="section-number">01</p>
              <h2 id="sets-heading">25-question sets</h2>
            </div>
            <p>16 focused sets</p>
          </div>

          <div className="set-grid">
            {Array.from({ length: setCount }, (_, index) => {
              const start = index * setSize + 1;
              const end = Math.min((index + 1) * setSize, questions.length);
              return (
                <button
                  className="set-button"
                  key={index}
                  onClick={() => startSet(index)}
                  type="button"
                >
                  <span>Set {index + 1}</span>
                  <small>
                    Questions {start}–{end}
                  </small>
                  <span className="set-arrow" aria-hidden="true">
                    →
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="challenge-grid" aria-label="Challenge modes">
          <article className="mode-card random-card">
            <div className="mode-number">02</div>
            <div>
              <p className="mode-tag">MIX IT UP</p>
              <h2>Random 25</h2>
              <p>
                Generate a fresh mix of 25 questions from anywhere in the PDF.
              </p>
            </div>
            <button className="mode-button random-button" onClick={startRandom}>
              Randomise 25 <span aria-hidden="true">↻</span>
            </button>
          </article>

          <article className="mode-card ultimate-card">
            <div className="mode-number">03</div>
            <div>
              <p className="mode-tag">THE FULL TEST</p>
              <h2>Ultimate 400</h2>
              <p>
                Take every question in the original order and really test
                yourself.
              </p>
            </div>
            <button className="mode-button ultimate-button" onClick={startUltimate}>
              Start 400 questions <span aria-hidden="true">→</span>
            </button>
          </article>
        </section>

        <p className="footer-note">Choose a mode to begin your practice.</p>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar quiz-topbar">
        <div>
          <p className="eyebrow">VID PRACTICE · {modeTitle.toUpperCase()}</p>
          <h1>Road Rules</h1>
        </div>
        <button className="text-button" onClick={goToMenu} type="button">
          Exit quiz
        </button>
      </header>

      <section className="progress-section" aria-label="Quiz progress">
        <div className="progress-copy">
          <span>
            {session.phase === "results"
              ? "Complete"
              : `Question ${session.current + 1} of ${total}`}
          </span>
          <span>{session.score} correct</span>
        </div>
        <div className="progress-track" aria-hidden="true">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </section>

      {session.phase === "results" ? (
        <section className="result-card" aria-labelledby="result-heading">
          <div className="result-mark">✓</div>
          <p className="eyebrow">{modeTitle.toUpperCase()} COMPLETE</p>
          <h2 id="result-heading">You finished all {total} questions.</h2>
          <p className="result-score">
            {session.score} / {total}
          </p>
          <p className="result-percentage">Final score: {percentage}%</p>
          <div className="result-actions">
            <button className="secondary-button" onClick={goToMenu}>
              Choose another mode
            </button>
            <button className="primary-button restart-button" onClick={retryQuiz}>
              {session.kind === "random" ? "New random 25" : "Try again"}
            </button>
          </div>
        </section>
      ) : (
        <article className="question-card" aria-labelledby="question-heading">
          <div className="card-topline">
            <span>Question {session.current + 1}</span>
            <span>
              {question.image ? "Visual question" : "Road rule"} · Source {question.id}
            </span>
          </div>

          {question.image && (
            <div className="image-stage">
              <img
                src={question.image}
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
                const isSelected = session.selected === index;
                const isCorrect = session.checked && question.correct === index;
                const isIncorrect =
                  session.checked && isSelected && question.correct !== index;
                const optionClass = [
                  "option",
                  isSelected ? "selected" : "",
                  isCorrect ? "correct" : "",
                  isIncorrect ? "incorrect" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <button
                    aria-checked={isSelected}
                    className={optionClass}
                    key={`${question.id}-${index}`}
                    onClick={() => selectOption(index)}
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

            {session.checked && (
              <div
                className={`feedback ${
                  session.selected === question.correct ? "success" : "retry"
                }`}
                role="status"
              >
                <strong>
                  {session.selected === question.correct
                    ? "Correct!"
                    : "Not quite."}
                </strong>
                <span>
                  {session.selected === question.correct
                    ? " You chose the right answer."
                    : ` The correct answer is ${String.fromCharCode(
                        65 + question.correct,
                      )}.`}
                </span>
              </div>
            )}

            <div className="actions">
              <button
                className="secondary-button"
                disabled={session.selected === null || session.checked}
                onClick={checkAnswer}
                type="button"
              >
                Check answer
              </button>
              <button
                className="primary-button"
                disabled={!session.checked}
                onClick={nextQuestion}
                type="button"
              >
                {session.current === total - 1 ? "See results" : "Next card"}
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </article>
      )}

      <p className="footer-note">Your current quiz is saved on this device.</p>
    </main>
  );
}
