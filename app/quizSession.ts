import type { Question } from "./components/QuestionCard";

export type QuizKind = "set" | "random" | "ultimate";
export type Answer = { questionId: number; selectedAnswer: number };
export type SavedSession = {
  phase: "menu" | "quiz" | "results";
  kind: QuizKind | null;
  setNumber: number | null;
  questionIds: number[];
  answers: Answer[];
};

export const emptySession: SavedSession = {
  phase: "menu",
  kind: null,
  setNumber: null,
  questionIds: [],
  answers: [],
};

// Keep each choice. The number of saved answers tells us which question is next.
export function recordAnswer(session: SavedSession, questionId: number, selectedAnswer: number): SavedSession {
  if (session.phase !== "quiz" || session.questionIds[session.answers.length] !== questionId) {
    return session;
  }

  const answers = [...session.answers, { questionId, selectedAnswer }];
  let phase: SavedSession["phase"] = "quiz";
  if (answers.length === session.questionIds.length) {
    phase = "results";
  }
  return { ...session, answers, phase };
}

export function finishQuiz(session: SavedSession): SavedSession {
  // Only Ultimate 400 can finish early, after at least one answer.
  if (session.phase !== "quiz" || session.kind !== "ultimate" || session.answers.length === 0) {
    return session;
  }
  return { ...session, phase: "results" };
}

export function countCorrectAnswers(answers: Answer[], questions: Question[]) {
  let score = 0;
  for (const answer of answers) {
    const question = questions.find((item) => item.id === answer.questionId);
    if (question && answer.selectedAnswer === question.correct) {
      score = score + 1;
    }
  }
  return score;
}

// Check browser data before restoring it. Answers must follow the quiz order.
export function isValidSavedSession(value: unknown, questions: Question[]): value is SavedSession {
  if (!value || typeof value !== "object") return false;
  const saved = value as Partial<SavedSession>;
  if (saved.phase !== "menu" && saved.phase !== "quiz" && saved.phase !== "results") return false;
  if (!Array.isArray(saved.questionIds) || !Array.isArray(saved.answers)) return false;

  if (saved.phase === "menu") {
    return saved.kind === null && saved.setNumber === null && saved.questionIds.length === 0 && saved.answers.length === 0;
  }
  if (saved.kind !== "set" && saved.kind !== "random" && saved.kind !== "ultimate") return false;
  if (saved.questionIds.length === 0 || new Set(saved.questionIds).size !== saved.questionIds.length) return false;
  for (const id of saved.questionIds) {
    if (!Number.isInteger(id) || !questions.some((question) => question.id === id)) return false;
  }

  if (saved.kind === "set") {
    if (typeof saved.setNumber !== "number" || !Number.isInteger(saved.setNumber)) return false;
    if (saved.setNumber < 1 || saved.setNumber > Math.ceil(questions.length / 25)) return false;
    const expectedIds = questions.slice((saved.setNumber - 1) * 25, saved.setNumber * 25).map((question) => question.id);
    if (saved.questionIds.join(",") !== expectedIds.join(",")) return false;
  } else {
    if (saved.setNumber !== null) return false;
    if (saved.kind === "random" && saved.questionIds.length !== Math.min(25, questions.length)) return false;
    if (saved.kind === "ultimate" && saved.questionIds.join(",") !== questions.map((question) => question.id).join(",")) return false;
  }

  if (saved.answers.length > saved.questionIds.length) return false;
  for (let index = 0; index < saved.answers.length; index = index + 1) {
    const answer = saved.answers[index];
    if (!answer || typeof answer !== "object" || answer.questionId !== saved.questionIds[index]) return false;
    const question = questions.find((item) => item.id === answer.questionId);
    if (!question || !Number.isInteger(answer.selectedAnswer)) return false;
    if (answer.selectedAnswer < 0 || answer.selectedAnswer >= question.options.length) return false;
  }
  if (saved.phase === "quiz") return saved.answers.length < saved.questionIds.length;
  if (saved.answers.length === 0) return false;
  return saved.kind === "ultimate" || saved.answers.length === saved.questionIds.length;
}
