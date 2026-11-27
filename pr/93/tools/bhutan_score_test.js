#!/usr/bin/env node
/* Scoring and cancel cases for the Bhutan test page. Run: node tools/bhutan_score_test.js */
const assert = require('assert');
const B = require('../bhutan_score.js');

const A = { a: 'Blue', b: 'Red' };
let n = 0;
function tes(name, fn) {
  fn();
  n += 1;
  console.log('PASS ' + name);
}

tes('Karey is 2, bullseye is 3, miss is 0', () => {
  const r = B.scoreDatseRound(['karey', 'bull'], ['miss', 'miss'], null, A);
  assert.strictEqual(r.a, 5);
  assert.strictEqual(r.b, 0);
  assert.strictEqual(r.dayaReady, true);
});

tes('Sa-Karey scores 1 and cancels 1 Kuu from an opponent Karey', () => {
  const r = B.scoreDatseRound(['sa_karey'], ['karey'], null, A);
  assert.strictEqual(r.a, 1);
  assert.strictEqual(r.b, 1); // 2 - 1
  assert.ok(r.notes.some(t => /cancelled 1 Kuu from Red's Karey/.test(t)));
});

tes('Sa-Karey scores 1 only when the opponent has no Karey', () => {
  const r = B.scoreDatseRound(['sa_karey'], ['miss'], null, A);
  assert.strictEqual(r.a, 1);
  assert.strictEqual(r.b, 0);
  assert.ok(r.notes.some(t => /no Red Karey to cancel/.test(t)));
});

tes('Bounce-off scores 2 when the opponent has no Karey', () => {
  const r = B.scoreDatseRound(['bounce'], ['miss'], null, A);
  assert.strictEqual(r.a, 2);
  assert.strictEqual(r.b, 0);
});

tes('Bounce-off cancels 1 opponent Karey Kuu and scores 0', () => {
  const r = B.scoreDatseRound(['bounce'], ['karey'], null, A);
  assert.strictEqual(r.a, 0);
  assert.strictEqual(r.b, 1);
  assert.ok(r.notes.some(t => /bounce-off cancelled 1 Kuu/.test(t)));
});

tes('Bullseye counts as a Karey for cancel', () => {
  const r = B.scoreDatseRound(['sa_karey'], ['bull'], null, A);
  assert.strictEqual(r.a, 1);
  assert.strictEqual(r.b, 2); // 3 - 1
});

tes('Two Sa-Kareys against one Karey deduct 2 Kuu and do not go negative', () => {
  const r = B.scoreDatseRound(['sa_karey', 'sa_karey'], ['karey'], null, A);
  assert.strictEqual(r.a, 2);
  assert.strictEqual(r.b, 0);
});

tes('Extra bounce-off does not score 2 after the opponent already had a Karey', () => {
  const r = B.scoreDatseRound(['bounce', 'bounce', 'bounce'], ['karey'], null, A);
  assert.strictEqual(r.a, 0);
  assert.strictEqual(r.b, 0);
});

tes('Both sides Karey plus both sides Sa-Karey cancel one each', () => {
  const r = B.scoreDatseRound(['karey', 'sa_karey'], ['karey', 'sa_karey'], null, A);
  assert.strictEqual(r.a, 2); // 2+1-1
  assert.strictEqual(r.b, 2);
});

tes('Daya scores 1 only when the other side has no Daya', () => {
  const r = B.scoreDatseRound(['daya'], ['miss'], null, A);
  assert.strictEqual(r.a, 1);
  assert.strictEqual(r.b, 0);
  assert.strictEqual(r.needsDayaCloser, false);
});

tes('Daya is pending when both sides have one until closer is picked', () => {
  const pending = B.scoreDatseRound(['daya'], ['daya'], null, A);
  assert.strictEqual(pending.a, 0);
  assert.strictEqual(pending.b, 0);
  assert.strictEqual(pending.dayaReady, false);
  const blue = B.scoreDatseRound(['daya'], ['daya'], 'a', A);
  assert.strictEqual(blue.a, 1);
  assert.strictEqual(blue.b, 0);
  const eq = B.scoreDatseRound(['daya'], ['daya'], 'equal', A);
  assert.strictEqual(eq.a, 0);
  assert.strictEqual(eq.b, 0);
});

tes('Closer team scores each of its Dayas', () => {
  const r = B.scoreDatseRound(['daya', 'daya'], ['daya'], 'a', A);
  assert.strictEqual(r.a, 2);
  assert.strictEqual(r.b, 0);
});

tes('Karey plus closer Daya in the same round', () => {
  const r = B.scoreDatseRound(['karey', 'daya'], ['daya', 'miss'], 'a', A);
  assert.strictEqual(r.a, 3);
  assert.strictEqual(r.b, 0);
});

tes('Khuru hit 2, bull 3, near-miss 1, miss 0', () => {
  const r = B.scoreKhuruRound(['hit', 'bull'], ['near', 'miss'], null, A);
  assert.strictEqual(r.a, 5);
  assert.strictEqual(r.b, 1);
});

tes('Khuru near-miss only scores for the closer side when both have one', () => {
  const pending = B.scoreKhuruRound(['near'], ['near'], null, A);
  assert.strictEqual(pending.dayaReady, false);
  const r = B.scoreKhuruRound(['near', 'hit'], ['near'], 'b', A);
  assert.strictEqual(r.a, 2);
  assert.strictEqual(r.b, 1);
});

tes('Degor: only the closer side scores, count of closest stones', () => {
  const r = B.scoreDegorRound(3, 2, 'a', 2, A);
  assert.strictEqual(r.a, 2);
  assert.strictEqual(r.b, 0);
});

tes('Degor: if only one side is in range, each in-range stone scores', () => {
  const r = B.scoreDegorRound(2, 0, null, null, A);
  assert.strictEqual(r.a, 2);
  assert.strictEqual(r.b, 0);
  assert.strictEqual(r.dayaReady, true);
});

tes('Match: first to 25, bounce cancel, undo last tap', () => {
  const m = B.createMatch({
    mode: 'datse_bamboo',
    teamSize: 1,
    winType: 'first_to',
    winPoints: 25,
    setsBestOf: 3,
    names: A
  });
  // One archer a side, two arrows each, so a round is 4 shots.
  B.recordShot(m, 'karey');
  B.recordShot(m, 'karey');
  B.recordShot(m, 'miss');
  const last = B.recordShot(m, 'miss');
  assert.strictEqual(last.scored.round.a, 4);
  assert.strictEqual(m.sets[0].a, 4);
  assert.ok(B.undo(m));
  assert.strictEqual(m.sets[0].rounds.length, 0);
  assert.strictEqual(m.sets[0].current.aShots.length, 2);
});

tes('Match: Sa-Karey cancel is applied when the round closes', () => {
  const m = B.createMatch({ mode: 'datse_bamboo', teamSize: 1, names: A, setsBestOf: 1, winPoints: 25 });
  B.recordShot(m, 'sa_karey');
  B.recordShot(m, 'miss');
  B.recordShot(m, 'karey');
  const done = B.recordShot(m, 'miss');
  assert.strictEqual(done.scored.round.a, 1);
  assert.strictEqual(done.scored.round.b, 1);
  assert.ok(done.scored.round.notes.some(t => /cancelled 1 Kuu/.test(t)));
});

tes('Match: Daya waits for the closer tap, then counts', () => {
  const m = B.createMatch({ mode: 'datse_bamboo', teamSize: 1, names: A, setsBestOf: 1 });
  B.recordShot(m, 'daya');
  B.recordShot(m, 'miss');
  B.recordShot(m, 'daya');
  const pending = B.recordShot(m, 'miss');
  assert.ok(pending.scored.pendingCloser);
  assert.strictEqual(m.sets[0].rounds.length, 0);
  const closed = B.setCloser(m, 'b');
  assert.strictEqual(closed.scored.round.b, 1);
  assert.strictEqual(closed.scored.round.a, 0);
});

tes('First to 3, best of 3: two set wins ends the match', () => {
  const m = B.createMatch({
    mode: 'khuru',
    teamSize: 1,
    winType: 'first_to',
    winPoints: 3,
    setsBestOf: 3,
    names: A
  });
  function bullRound() {
    B.recordShot(m, 'bull');
    B.recordShot(m, 'miss');
    B.recordShot(m, 'miss');
    return B.recordShot(m, 'miss');
  }
  const s1 = bullRound();
  assert.strictEqual(s1.scored.setJustWon, 'a');
  const s2 = bullRound();
  assert.strictEqual(s2.scored.matchJustWon, 'a');
  assert.strictEqual(m.matchWinner, 'a');
  assert.strictEqual(m.setWins.a, 2);
});

tes('11-round set: higher score wins after 11, tie keeps going', () => {
  const set = { a: 10, b: 10, rounds: new Array(10), winner: null };
  const settings = B.defaultSettings({ winType: 'rounds', winRounds: 11 });
  assert.strictEqual(B.setWinner(settings, { a: 10, b: 8, rounds: new Array(11) }), 'a');
  assert.strictEqual(B.setWinner(settings, set), null);
  assert.strictEqual(B.setWinner(settings, { a: 12, b: 12, rounds: new Array(11) }), null);
  assert.strictEqual(B.setWinner(settings, { a: 13, b: 12, rounds: new Array(12) }), 'a');
});

tes('Compound uses the same Datse table', () => {
  const m = B.createMatch({ mode: 'datse_compound', teamSize: 1, names: A });
  assert.ok(B.isDatse(m.settings.mode));
  B.recordShot(m, 'bull');
  B.recordShot(m, 'bounce');
  B.recordShot(m, 'miss');
  const done = B.recordShot(m, 'miss');
  assert.strictEqual(done.scored.round.a, 5); // 3 + bounce 2, no opponent Karey
});

console.log('bhutan_score: ' + n + ' cases ok');
