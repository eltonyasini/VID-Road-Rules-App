import { useEffect, useMemo, useRef, useState } from "react";
import questionsData from "./questions.json";
import QuestionCard, { type Question } from "./components/QuestionCard";
import usePreloadImages from "./hooks/usePreloadImages";
import QuizResults from "./components/QuizResults";
import { emptySession, isValidSavedSession, recordAnswer, finishQuiz, type QuizKind, type SavedSession } from "./quizSession";

const questions = questionsData as Question[];
const storageKey = "vid-question-cards-session-v3";
const setSize = 25;
const setCount = Math.ceil(questions.length / setSize);

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

export default function Home() {
  const [session, setSession] = useState<SavedSession>(emptySession);
  const [ready, setReady] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [formatNotice, setFormatNotice] = useState(false);
  const lastAnswerTime = useRef(0);

  // Load the previous quiz once when the app opens.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as unknown;
        if (isValidSavedSession(parsed, questions)) setSession(parsed);
      } else {
        // The old format did not save answer history, so it cannot be reviewed.
        const oldSaved = window.localStorage.getItem("vid-question-cards-session-v2");
        if (oldSaved && JSON.parse(oldSaved).phase !== "menu") setFormatNotice(true);
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

  const answeredCount = session.answers.length;
  const total = activeQuestions.length;
  const question = activeQuestions[answeredCount] ?? questions[0];
  usePreloadImages(activeQuestions, answeredCount, ready && session.phase === "quiz");

  let progress = 0;
  if (total > 0) progress = (answeredCount / total) * 100;

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
    setFormatNotice(false);
    lastAnswerTime.current = 0;
    setSession({
      phase: "quiz",
      kind,
      setNumber,
      questionIds,
      answers: [],
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
    // A quick double-click must not answer the following question by accident.
    const now = Date.now();
    if (now - lastAnswerTime.current < 300) return;
    lastAnswerTime.current = now;

    setSession((previousSession) => recordAnswer(previousSession, question.id, index));
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function doneQuiz() {
    setSession((previousSession) => finishQuiz(previousSession));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function retryQuiz() {
    if (session.kind === "random") {
      startRandom();
      return;
    }
    if (session.kind) beginQuiz(session.kind, session.questionIds, session.setNumber);
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
            or take on all 400 questions.
          </p>
        </header>

        {formatNotice && <p role="status">The quiz format has changed. Please start a new quiz so all your answers can be saved for review.</p>}

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
                Test yourself with a fresh mix of 25 randomly selected questions.
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
        <div className="quiz-controls">
          {session.phase === "quiz" && session.kind === "ultimate" && (
            <button className="primary-button done-button" onClick={doneQuiz} disabled={answeredCount === 0} type="button">Done</button>
          )}
          <button className="text-button" onClick={confirmExit} type="button">
            {session.phase === "results" ? "Back to menu" : "Exit quiz"}
          </button>
        </div>
      </header>

      <section className="progress-section" aria-label="Quiz progress">
        <div className="progress-copy">
          <span>
            {session.phase === "results"
              ? "Finished"
              : `Question ${answeredCount + 1} of ${total}`}
          </span>
          <span>{answeredCount} answered</span>
        </div>
        <div className="progress-track" aria-hidden="true">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </section>

      {session.phase === "results" ? (
        <QuizResults
          modeTitle={modeTitle}
          answers={session.answers}
          questions={activeQuestions}
          total={total}
          isRandom={session.kind === "random"}
          onRetry={retryQuiz}
          onGoToMenu={goToMenu}
        />
      ) : (
        <QuestionCard
          question={question}
          questionNumber={answeredCount + 1}
          total={total}
          onSelectOption={selectOption}
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
