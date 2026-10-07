import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { emptySession, recordAnswer, finishQuiz, countCorrectAnswers, isValidSavedSession } from '../app/quizSession.ts';

const questions = JSON.parse(readFileSync(new URL('../app/questions.json', import.meta.url)));
function start(kind = 'set') {
  let ids = questions.slice(0, 25).map(q => q.id);
  if (kind === 'ultimate') ids = questions.map(q => q.id);
  if (kind === 'random') ids.reverse();
  return { phase: 'quiz', kind, setNumber: kind === 'set' ? 1 : null, questionIds: ids, answers: [] };
}

test('each mode records its own question order and finishes on the final answer', () => {
  for (const kind of ['set', 'random', 'ultimate']) {
    let session = start(kind);
    for (const id of session.questionIds) {
      assert.equal(session.phase, 'quiz');
      session = recordAnswer(session, id, questions[id - 1].correct);
    }
    assert.equal(session.phase, 'results');
    assert.equal(countCorrectAnswers(session.answers, questions), session.questionIds.length);
    assert.ok(isValidSavedSession(JSON.parse(JSON.stringify(session)), questions));
  }
});

test('early Ultimate results count only answered questions', () => {
  let session = start('ultimate');
  assert.equal(finishQuiz(session), session);
  session = recordAnswer(session, 1, questions[0].correct);
  session = recordAnswer(session, 2, (questions[1].correct + 1) % questions[1].options.length);
  session = finishQuiz(session);
  assert.equal(session.phase, 'results');
  assert.equal(session.answers.length, 2);
  assert.equal(countCorrectAnswers(session.answers, questions), 1);
  assert.ok(isValidSavedSession(session, questions));
  const set = start();
  assert.equal(finishQuiz(set), set);
});

test('stale clicks cannot record a question twice or alter finished results', () => {
  let session = recordAnswer(start('ultimate'), 1, 0);
  assert.equal(recordAnswer(session, 1, 1), session);
  session = finishQuiz(session);
  assert.equal(recordAnswer(session, 2, 0), session);
});

test('saved answer history restores and invalid data is rejected', () => {
  const session = recordAnswer(start(), 1, 0);
  assert.ok(isValidSavedSession(emptySession, questions));
  assert.ok(isValidSavedSession(JSON.parse(JSON.stringify(session)), questions));
  assert.equal(isValidSavedSession({ ...session, answers: [{ questionId: 2, selectedAnswer: 0 }] }, questions), false);
  assert.equal(isValidSavedSession({ ...session, answers: [{ questionId: 1, selectedAnswer: 100 }] }, questions), false);
  assert.equal(isValidSavedSession({ ...session, answers: [null] }, questions), false);
  assert.equal(isValidSavedSession({ ...session, phase: 'results' }, questions), false);
  assert.equal(isValidSavedSession({ ...session, answers: undefined }, questions), false);
});
