"use client";

import { useEffect, useMemo, useState } from "react";
import questionsData from "./questions.json";
import QuestionCard, { type Question } from "./components/QuestionCard";
import usePreloadImages from "./hooks/usePreloadImages";

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

// Saved browser data can be old or damaged, so check it before using it.
function isValidSavedSession(value: unknown): value is SavedSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const saved = value as Partial<SavedSession>;

  if (saved.phase !== "menu" && saved.phase !== "quiz" && saved.phase !== "results") {
    return false;
  }

  if (saved.kind !== null && saved.kind !== "set" && saved.kind !== "random" && saved.kind !== "ultimate") {
    return false;
  }

  if (saved.kind === "set") {
    if (typeof saved.setNumber !== "number" || !Number.isInteger(saved.setNumber)) {
      return false;
    }
    if (saved.setNumber < 1 || saved.setNumber > setCount) {
      return false;
    }
  } else if (saved.setNumber !== null) {
    return false;
  }

  if (!Array.isArray(saved.questionIds)) {
    return false;
  }

  // The current app uses IDs 1 to 400 in the same order as the question list.
  for (const id of saved.questionIds) {
    if (!Number.isInteger(id) || !questions[id - 1] || questions[id - 1].id !== id) {
      return false;
    }
  }

  if (new Set(saved.questionIds).size !== saved.questionIds.length) {
    return false;
  }

  if (typeof saved.current !== "number" || !Number.isInteger(saved.current) || saved.current < 0) {
    return false;
  }

  if (typeof saved.checked !== "boolean") {
    return false;
  }

  if (typeof saved.score !== "number" || !Number.isInteger(saved.score) || saved.score < 0) {
    return false;
  }

  // A menu session should not contain an unfinished quiz.
  if (saved.phase === "menu") {
    return saved.kind === null &&
      saved.questionIds.length === 0 &&
      saved.current === 0 &&
      saved.selected === null &&
      saved.checked === false &&
      saved.score === 0;
  }

  if (saved.kind === null || saved.current >= saved.questionIds.length) {
    return false;
  }

  const savedQuestion = questions[saved.questionIds[saved.current] - 1];

  if (saved.selected !== null) {
    if (typeof saved.selected !== "number" || !Number.isInteger(saved.selected)) {
      return false;
    }
    if (saved.selected < 0 || saved.selected >= savedQuestion.options.length) {
      return false;
    }
  }

  if (saved.checked && saved.selected === null) {
    return false;
  }

  let answeredCount = saved.current;
  if (saved.checked) {
    answeredCount = answeredCount + 1;
  }
  if (saved.score > answeredCount) {
    return false;
  }

  if (saved.phase === "results") {
    if (!saved.checked || saved.current !== saved.questionIds.length - 1) {
      return false;
    }
  }

  return true;
}

export default function Home() {
  const [session, setSession] = useState<SavedSession>(emptySession);
  const [ready, setReady] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  // Load the previous quiz once when the app opens.
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

  // Save after each change, but only after the previous session has loaded.
  useEffect(() => {
    if (!ready) {
      return;
    }

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(session));
      setSaveFailed(false);
    } catch {
      // Practice can continue even if the browser cannot save progress.
      setSaveFailed(true);
    }
  }, [ready, session]);

  const activeQuestions = useMemo(
    () =>
      session.questionIds
        .map((id) => questions[id - 1])
        .filter((question): question is Question => Boolean(question)),
    [session.questionIds],
  );

  // Keep image-loading behaviour in its own file.
  usePreloadImages(activeQuestions, session.current, ready && session.phase === "quiz");

  const question = activeQuestions[session.current] ?? questions[0];
  const total = activeQuestions.length;
  // "current" is a zero-based index: index 4 means question 5.
  let answeredCount = session.current;
  if (session.checked) {
    answeredCount = answeredCount + 1;
  }

  let progress = 0;
  let percentage = 0;

  if (total > 0) {
    progress = (answeredCount / total) * 100;
    percentage = Math.round((session.score / total) * 100);
  }

  if (session.phase === "results") {
    progress = 100;
  }

  // Choose the heading for the current quiz mode.
  let modeTitle = "Ultimate 400";

  if (session.kind === "set") {
    modeTitle = `Set ${session.setNumber}`;
  } else if (session.kind === "random") {
    modeTitle = "Random 25";
  }

  // Every quiz mode starts with a fresh score and the chosen question IDs.
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

  function checkAnswer(selectedAnswer: number) {
    return selectedAnswer === question.correct;
  }

  // React gives this update function the latest session.
  // Returning a new session tells React to refresh the display.
  function selectOption(index: number) {
    const isCorrect = checkAnswer(index);

    setSession((previousSession) => {
      // Don't mark the same question more than once.
      if (previousSession.checked) {
        return previousSession;
      }

      let newScore = previousSession.score;

      if (isCorrect) {
        newScore = newScore + 1;
      }

      return {
        ...previousSession,
        selected: index,
        checked: true,
        score: newScore,
      };
    });
  }

  // Clear the previous answer when moving on, or show the final results.
  function nextQuestion() {
    if (!session.checked) return;
    if (session.current === total - 1) {
      setSession((previousSession) => ({ ...previousSession, phase: "results" }));
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSession((previousSession) => ({
      ...previousSession,
      current: previousSession.current + 1,
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
    setSession((previousSession) => ({
      ...previousSession,
      phase: "quiz",
      current: 0,
      selected: null,
      checked: false,
      score: 0,
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function confirmExit() {
    // A finished quiz can return to the menu without a warning.
    if (session.phase === "results") {
      goToMenu();
      return;
    }

    const wantsToExit = window.confirm(
      "Are you sure you want to exit? Your current quiz progress will be lost.",
    );

    if (wantsToExit) {
      goToMenu();
    }
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
        <button className="text-button" onClick={confirmExit} type="button">
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
        <QuestionCard
          question={question}
          questionNumber={session.current + 1}
          total={total}
          selected={session.selected}
          checked={session.checked}
          isUltimate={session.kind === "ultimate"}
          onSelectOption={selectOption}
          onNextQuestion={nextQuestion}
        />
      )}

      <p className="footer-note" role="status">
        {saveFailed
          ? "Progress could not be saved. You can keep practising, but reloading may lose your latest answers."
          : "Your current quiz is saved on this device."}
      </p>
    </main>
  );
}
