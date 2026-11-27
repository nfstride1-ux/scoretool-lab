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

tes('Only the single closest Daya scores 1, even if that side has two', () => {
  const r = B.scoreDatseRound(['daya', 'daya'], ['daya'], 'a', A);
  assert.strictEqual(r.a, 1);
  assert.strictEqual(r.b, 0);
  const alone = B.scoreDatseRound(['daya', 'daya'], ['miss', 'miss'], null, A);
  assert.strictEqual(alone.a, 1);
  assert.strictEqual(alone.b, 0);
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


tes('Live totals: a Karey shows 2 on that tap, before the round ends', () => {
  const m = B.createMatch({ mode: 'datse_bamboo', teamSize: 11, names: A, winPoints: 25, setsBestOf: 3 });
  const res = B.recordShot(m, 'karey');
  assert.strictEqual(res.scored, null); // round is still open (11 a side)
  const live = B.liveTotals(m);
  assert.strictEqual(live.totalA, 2);
  assert.strictEqual(live.roundA, 2);
  assert.strictEqual(live.setA, 0);
  assert.strictEqual(live.totalB, 0);
  assert.strictEqual(m.sets[0].a, 0);
  assert.deepStrictEqual(live.tallyA, ['Karey']);
  assert.strictEqual(live.roundOpen, true);
});

tes('Live totals: Sa-Karey cancel is applied and noted before the round ends', () => {
  const m = B.createMatch({ mode: 'datse_bamboo', teamSize: 1, names: A });
  B.recordShot(m, 'karey');
  B.recordShot(m, 'miss');
  B.recordShot(m, 'sa_karey');
  const live = B.liveTotals(m);
  assert.strictEqual(live.totalA, 1); // 2 then cancel 1
  assert.strictEqual(live.totalB, 1);
  assert.strictEqual(m.sets[0].a, 0);
  assert.strictEqual(m.sets[0].b, 0);
  assert.ok(live.notes.some(t => /cancelled 1 Kuu from Blue's Karey/.test(t)));
  assert.deepStrictEqual(live.tallyA, ['Karey', 'Miss']);
  assert.deepStrictEqual(live.tallyB, ['Sa-Karey']);
});

tes('Live totals: bounce-off cancel shows immediately; extra bounce does not add 2', () => {
  const m = B.createMatch({ mode: 'datse_bamboo', teamSize: 2, names: A });
  B.recordShot(m, 'karey'); // A player 1, arrow 1
  B.recordShot(m, 'miss');  // A player 1, arrow 2
  B.recordShot(m, 'bounce'); // B player 1, arrow 1 — cancel 1
  let live = B.liveTotals(m);
  assert.strictEqual(live.totalA, 1);
  assert.strictEqual(live.totalB, 0);
  assert.ok(live.notes.some(t => /bounce-off cancelled 1 Kuu/.test(t)));
  assert.strictEqual(m.sets[0].a, 0);
  B.recordShot(m, 'bounce'); // B player 1, arrow 2 — takes the remaining 1 Kuu; bounce itself still 0
  live = B.liveTotals(m);
  assert.strictEqual(live.totalA, 0);
  assert.strictEqual(live.totalB, 0);
  assert.strictEqual(m.sets[0].rounds.length, 0);
});

tes('Live totals: Khuru hit shows 2 on the first tap', () => {
  const m = B.createMatch({ mode: 'khuru', teamSize: 6, names: A });
  B.recordShot(m, 'hit');
  const live = B.liveTotals(m);
  assert.strictEqual(live.totalA, 2);
  assert.strictEqual(m.sets[0].a, 0);
  assert.deepStrictEqual(live.tallyA, ['Hit']);
});

tes('Live totals: Degor in-range stone shows 1 on the first tap', () => {
  const m = B.createMatch({ mode: 'degor', teamSize: 6, names: A });
  B.recordShot(m, 'in');
  const live = B.liveTotals(m);
  assert.strictEqual(live.totalA, 1);
  assert.strictEqual(m.sets[0].a, 0);
  assert.deepStrictEqual(live.tallyA, ['In range']);
});

tes('Both sides passing the target in the same round: higher total wins; a level score continues', () => {
  const m = B.createMatch({ mode: 'datse_bamboo', teamSize: 1, names: A, winPoints: 3, setsBestOf: 1 });
  function play(a1, a2, b1, b2) {
    B.recordShot(m, a1); B.recordShot(m, a2); B.recordShot(m, b1); return B.recordShot(m, b2);
  }
  play('karey', 'miss', 'miss', 'miss'); // 2-0, not yet
  assert.strictEqual(m.sets[0].winner, null);
  const both = play('karey', 'miss', 'bull', 'miss'); // 4-3, both reached 3, Blue higher
  assert.strictEqual(both.scored.round.a, 2);
  assert.strictEqual(both.scored.round.b, 3);
  assert.strictEqual(m.sets[0].a, 4);
  assert.strictEqual(m.sets[0].b, 3);
  assert.strictEqual(both.scored.setJustWon, 'a');

  const t = B.createMatch({ mode: 'datse_bamboo', teamSize: 1, names: A, winPoints: 3, setsBestOf: 1 });
  function play2(a1, a2, b1, b2) {
    B.recordShot(t, a1); B.recordShot(t, a2); B.recordShot(t, b1); return B.recordShot(t, b2);
  }
  play2('karey', 'miss', 'karey', 'miss'); // 2-2
  const level = play2('karey', 'miss', 'karey', 'miss'); // 4-4, both passed, level
  assert.strictEqual(t.sets[0].a, 4);
  assert.strictEqual(t.sets[0].b, 4);
  assert.strictEqual(level.scored.setJustWon, null);
  assert.strictEqual(t.sets[0].winner, null);
  const win = play2('karey', 'miss', 'miss', 'miss'); // 6-4
  assert.strictEqual(win.scored.setJustWon, 'a');
});

tes('Khuru: only the single closest near-miss scores 1', () => {
  const r = B.scoreKhuruRound(['near', 'near'], ['miss', 'miss'], null, A);
  assert.strictEqual(r.a, 1);
  assert.strictEqual(r.b, 0);
});

console.log('bhutan_score: ' + n + ' cases ok');
