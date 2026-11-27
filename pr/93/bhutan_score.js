/* Bhutan traditional scoring for the ScoreTool test page.
   School scoring follows the Ministry of Education DYS booklets (June 2017 / listed 2020):
   Traditional Archery, Khuru, and Degor. Adult win totals and team size of 6 follow
   the research note; compound is the same scoring table with a finger-release tag.
   This file is the only scoring source of truth. Do not invent extra bonuses. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BhutanScore = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var DATSE_SHOTS = {
    karey: { label: 'Karey', pts: 2 },
    bull: { label: 'Bullseye', pts: 3 },
    sa_karey: { label: 'Sa-Karey', pts: 1 },
    bounce: { label: 'Bounce-off', pts: 2 },
    daya: { label: 'Daya', pts: 1 },
    miss: { label: 'Miss', pts: 0 }
  };

  var KHURU_SHOTS = {
    hit: { label: 'Hit', pts: 2 },
    bull: { label: 'Bullseye', pts: 3 },
    near: { label: 'Near-miss', pts: 1 },
    miss: { label: 'Miss', pts: 0 }
  };

  var DEGOR_SHOTS = {
    in: { label: 'In range', pts: 0 },
    out: { label: 'Out', pts: 0 }
  };

  function kareyPool(shots) {
    var n = 0;
    for (var i = 0; i < shots.length; i++) {
      if (shots[i] === 'karey') n += 2;
      else if (shots[i] === 'bull') n += 3;
    }
    return n;
  }

  function hadKarey(shots) {
    return shots.some(function (s) { return s === 'karey' || s === 'bull'; });
  }

  function count(shots, type) {
    return shots.filter(function (s) { return s === type; }).length;
  }

  /* Score one Datse (bamboo or compound) round after both teams have shot.
     dayaCloser is 'a', 'b', or 'equal'. Needed only when both sides have at least one Daya.
     Cancels are applied after the round. "Opponent has a Karey" is a yes/no for that
     round (any Karey or bullseye). Each cancel deducts at most 1 Kuu, and never takes
     the opponent's Karey pool below 0. Extra bounce-offs still do not score 2 once
     the opponent had a Karey this round. */
  function scoreDatseRound(aShots, bShots, dayaCloser, names) {
    names = names || { a: 'Team A', b: 'Team B' };
    var notes = [];
    var aK = kareyPool(aShots);
    var bK = kareyPool(bShots);
    var aHad = hadKarey(aShots);
    var bHad = hadKarey(bShots);
    var a = aK;
    var b = bK;

    function applySide(shots, teamName, otherName, otherHad, deductOther) {
      for (var i = 0; i < shots.length; i++) {
        var s = shots[i];
        if (s === 'sa_karey') {
          if (teamName === names.a) a += 1;
          else b += 1;
          if (otherHad && deductOther()) {
            notes.push(teamName + ' Sa-Karey scored 1 Kuu and cancelled 1 Kuu from ' + otherName + "'s Karey");
          } else if (otherHad) {
            notes.push(teamName + ' Sa-Karey scored 1 Kuu; no Karey Kuu left to cancel from ' + otherName);
          } else {
            notes.push(teamName + ' Sa-Karey scored 1 Kuu (no ' + otherName + ' Karey to cancel)');
          }
        } else if (s === 'bounce') {
          if (otherHad) {
            if (deductOther()) {
              notes.push(teamName + ' bounce-off cancelled 1 Kuu from ' + otherName + "'s Karey (bounce-off itself scores 0)");
            } else {
              notes.push(teamName + ' bounce-off scored 0; ' + otherName + ' already had no Karey Kuu left to cancel');
            }
          } else {
            if (teamName === names.a) a += 2;
            else b += 2;
            notes.push(teamName + ' bounce-off scored 2 Kuu (no ' + otherName + ' Karey)');
          }
        }
      }
    }

    applySide(aShots, names.a, names.b, bHad, function () {
      if (bK <= 0) return false;
      bK -= 1; b -= 1; return true;
    });
    applySide(bShots, names.b, names.a, aHad, function () {
      if (aK <= 0) return false;
      aK -= 1; a -= 1; return true;
    });

    var aD = count(aShots, 'daya');
    var bD = count(bShots, 'daya');
    var needsDayaCloser = aD > 0 && bD > 0;
    var dayaA = 0;
    var dayaB = 0;
    if (needsDayaCloser) {
      if (dayaCloser === 'a') {
        dayaA = aD; a += dayaA;
        notes.push(names.a + ' Daya scored ' + dayaA + ' Kuu (closer than ' + names.b + ')');
      } else if (dayaCloser === 'b') {
        dayaB = bD; b += dayaB;
        notes.push(names.b + ' Daya scored ' + dayaB + ' Kuu (closer than ' + names.a + ')');
      } else if (dayaCloser === 'equal') {
        notes.push('Dayas measured equal: neither side scores Daya');
      } else {
        notes.push('Both sides have Daya: pick which is closer before the round is counted');
      }
    } else if (aD) {
      dayaA = aD; a += dayaA;
      notes.push(names.a + ' Daya scored ' + dayaA + ' Kuu (no ' + names.b + ' Daya)');
    } else if (bD) {
      dayaB = bD; b += dayaB;
      notes.push(names.b + ' Daya scored ' + dayaB + ' Kuu (no ' + names.a + ' Daya)');
    }

    return {
      a: a,
      b: b,
      notes: notes,
      aKareyLeft: aK,
      bKareyLeft: bK,
      needsDayaCloser: needsDayaCloser,
      dayaReady: !needsDayaCloser || dayaCloser === 'a' || dayaCloser === 'b' || dayaCloser === 'equal',
      dayaA: dayaA,
      dayaB: dayaB
    };
  }

  function scoreKhuruRound(aShots, bShots, nearCloser, names) {
    names = names || { a: 'Team A', b: 'Team B' };
    var notes = [];
    function base(shots) {
      var t = 0;
      for (var i = 0; i < shots.length; i++) {
        if (shots[i] === 'hit') t += 2;
        else if (shots[i] === 'bull') t += 3;
      }
      return t;
    }
    var a = base(aShots);
    var b = base(bShots);
    var aN = count(aShots, 'near');
    var bN = count(bShots, 'near');
    var needsNearCloser = aN > 0 && bN > 0;
    if (needsNearCloser) {
      if (nearCloser === 'a') {
        a += aN;
        notes.push(names.a + ' near-miss scored ' + aN + ' (closer than ' + names.b + ', within a stick length)');
      } else if (nearCloser === 'b') {
        b += bN;
        notes.push(names.b + ' near-miss scored ' + bN + ' (closer than ' + names.a + ', within a stick length)');
      } else if (nearCloser === 'equal') {
        notes.push('Near-misses measured equal: neither side scores the stick-length point');
      } else {
        notes.push('Both sides have a near-miss: pick which is closer before the round is counted');
      }
    } else if (aN) {
      a += aN;
      notes.push(names.a + ' near-miss scored ' + aN + ' (within a stick length)');
    } else if (bN) {
      b += bN;
      notes.push(names.b + ' near-miss scored ' + bN + ' (within a stick length)');
    }
    var ready = !needsNearCloser || nearCloser === 'a' || nearCloser === 'b' || nearCloser === 'equal';
    return { a: a, b: b, notes: notes, needsDayaCloser: needsNearCloser, dayaReady: ready };
  }

  /* closerCount is how many of the closer team's in-range stones score (default: all). */
  function scoreDegorRound(aIn, bIn, closer, closerCount, names) {
    names = names || { a: 'Team A', b: 'Team B' };
    aIn = Math.max(0, aIn | 0);
    bIn = Math.max(0, bIn | 0);
    var notes = [];
    var needsCloser = aIn > 0 && bIn > 0;
    var a = 0, b = 0;
    if (needsCloser) {
      if (closer === 'a' || closer === 'b') {
        var cap = closer === 'a' ? aIn : bIn;
        var n = closerCount == null ? cap : Math.max(1, Math.min(cap, closerCount | 0));
        if (closer === 'a') a = n;
        else b = n;
        var who = closer === 'a' ? names.a : names.b;
        var other = closer === 'a' ? names.b : names.a;
        notes.push(who + ' closest stone scored ' + n + ' Kuu (closer than ' + other + ')');
      } else if (closer === 'equal') {
        notes.push('Closest stones measured equal: neither side scores this end');
      } else {
        notes.push('Both sides have a stone in range: pick which is closer');
      }
    } else if (aIn) {
      a = aIn;
      notes.push(names.a + ' scored ' + a + ' Kuu (no ' + names.b + ' stone in range)');
    } else if (bIn) {
      b = bIn;
      notes.push(names.b + ' scored ' + b + ' Kuu (no ' + names.a + ' stone in range)');
    } else {
      notes.push('No stones in range: no score this end');
    }
    var ready = !needsCloser || closer === 'a' || closer === 'b' || closer === 'equal';
    return { a: a, b: b, notes: notes, needsDayaCloser: needsCloser, dayaReady: ready };
  }

  function defaultSettings(partial) {
    var s = {
      mode: 'datse_bamboo',
      teamSize: 11,
      substitutes: 2,
      winType: 'first_to', /* first_to | rounds */
      winPoints: 25,
      winRounds: 11,
      setsBestOf: 3,
      names: { a: 'Team A', b: 'Team B' }
    };
    if (partial) {
      Object.keys(partial).forEach(function (k) {
        if (k === 'names' && partial.names) {
          s.names = { a: partial.names.a || s.names.a, b: partial.names.b || s.names.b };
        } else if (partial[k] != null) s[k] = partial[k];
      });
    }
    if (s.mode === 'khuru' || s.mode === 'degor') {
      if (!partial || partial.winType == null) s.winType = 'first_to';
      if (!partial || partial.winPoints == null) s.winPoints = 15;
      if (!partial || partial.setsBestOf == null) s.setsBestOf = 3;
    }
    s.teamSize = Math.max(1, Math.min(20, s.teamSize | 0));
    s.substitutes = Math.max(0, Math.min(10, s.substitutes | 0));
    s.setsBestOf = s.setsBestOf === 5 ? 5 : s.setsBestOf === 1 ? 1 : 3;
    s.winPoints = Math.max(1, s.winPoints | 0);
    s.winRounds = Math.max(1, s.winRounds | 0);
    return s;
  }

  function setsNeeded(bestOf) {
    return Math.floor((bestOf || 3) / 2) + 1;
  }

  function emptyRound() {
    return { aShots: [], bShots: [], closer: null, closerCount: null };
  }

  function newSet() {
    return { a: 0, b: 0, rounds: [], current: emptyRound(), winner: null };
  }

  function createMatch(settings) {
    return {
      settings: defaultSettings(settings),
      sets: [newSet()],
      setWins: { a: 0, b: 0 },
      matchWinner: null,
      turn: { team: 'a', archer: 0, arrow: 0 },
      history: []
    };
  }

  function isDatse(mode) {
    return mode === 'datse_bamboo' || mode === 'datse_compound';
  }

  function modeLabel(mode) {
    return {
      datse_bamboo: 'Datse · bamboo',
      datse_compound: 'Datse · compound',
      khuru: 'Khuru',
      degor: 'Degor'
    }[mode] || mode;
  }

  function scoreCurrentRound(match) {
    var set = match.sets[match.sets.length - 1];
    var r = set.current;
    var names = match.settings.names;
    if (isDatse(match.settings.mode)) {
      return scoreDatseRound(r.aShots, r.bShots, r.closer, names);
    }
    if (match.settings.mode === 'khuru') {
      return scoreKhuruRound(r.aShots, r.bShots, r.closer, names);
    }
    var aIn = count(r.aShots, 'in');
    var bIn = count(r.bShots, 'in');
    return scoreDegorRound(aIn, bIn, r.closer, r.closerCount, names);
  }

  function arrowsPerPlayer(mode) {
    return 2;
  }

  function shotsInRound(match) {
    var n = match.settings.teamSize * arrowsPerPlayer(match.settings.mode);
    return match.sets[match.sets.length - 1].current.aShots.length +
      match.sets[match.sets.length - 1].current.bShots.length === n * 2;
  }

  function setWinner(settings, set) {
    if (settings.winType === 'rounds') {
      if (set.rounds.length < settings.winRounds) return null;
      if (set.a > set.b) return 'a';
      if (set.b > set.a) return 'b';
      return null; /* tied after the listed rounds: keep playing until one leads */
    }
    if (set.a >= settings.winPoints && set.a > set.b) return 'a';
    if (set.b >= settings.winPoints && set.b > set.a) return 'b';
    return null;
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function snapshot(match) {
    return clone({
      sets: match.sets,
      setWins: match.setWins,
      matchWinner: match.matchWinner,
      turn: match.turn
    });
  }

  function restore(match, snap) {
    match.sets = snap.sets;
    match.setWins = snap.setWins;
    match.matchWinner = snap.matchWinner;
    match.turn = snap.turn;
  }

  function pushHistory(match) {
    match.history.push(snapshot(match));
    if (match.history.length > 400) match.history.shift();
  }

  function undo(match) {
    if (!match.history.length) return false;
    restore(match, match.history.pop());
    return true;
  }

  function recordShot(match, type) {
    if (match.matchWinner) return { ok: false, reason: 'match-over' };
    var set = match.sets[match.sets.length - 1];
    if (set.winner) return { ok: false, reason: 'set-over' };
    pushHistory(match);
    var team = match.turn.team;
    set.current[team === 'a' ? 'aShots' : 'bShots'].push(type);
    advanceTurn(match);
    return { ok: true, scored: tryCloseRound(match) };
  }

  function advanceTurn(match) {
    var arrows = arrowsPerPlayer(match.settings.mode);
    match.turn.arrow += 1;
    if (match.turn.arrow >= arrows) {
      match.turn.arrow = 0;
      if (match.turn.team === 'a') {
        match.turn.team = 'b';
      } else {
        match.turn.team = 'a';
        match.turn.archer += 1;
        if (match.turn.archer >= match.settings.teamSize) {
          match.turn.archer = 0;
        }
      }
    }
  }

  function tryCloseRound(match) {
    if (!shotsInRound(match)) return null;
    var result = scoreCurrentRound(match);
    if (!result.dayaReady) return { pendingCloser: true, preview: result };
    return closeRound(match, result);
  }

  function setCloser(match, closer, closerCount) {
    if (match.matchWinner) return { ok: false };
    var set = match.sets[match.sets.length - 1];
    if (!shotsInRound(match)) return { ok: false, reason: 'round-open' };
    pushHistory(match);
    set.current.closer = closer;
    if (closerCount != null) set.current.closerCount = closerCount;
    var result = scoreCurrentRound(match);
    if (!result.dayaReady) return { ok: true, scored: { pendingCloser: true, preview: result } };
    return { ok: true, scored: closeRound(match, result) };
  }

  function closeRound(match, result) {
    var set = match.sets[match.sets.length - 1];
    var rec = {
      a: result.a,
      b: result.b,
      aShots: set.current.aShots.slice(),
      bShots: set.current.bShots.slice(),
      closer: set.current.closer,
      closerCount: set.current.closerCount,
      notes: result.notes.slice()
    };
    set.rounds.push(rec);
    set.a += result.a;
    set.b += result.b;
    set.current = emptyRound();
    match.turn = { team: 'a', archer: 0, arrow: 0 };
    var w = setWinner(match.settings, set);
    var setJustWon = null;
    var matchJustWon = null;
    if (w) {
      set.winner = w;
      match.setWins[w] += 1;
      setJustWon = w;
      if (match.setWins[w] >= setsNeeded(match.settings.setsBestOf)) {
        match.matchWinner = w;
        matchJustWon = w;
      } else {
        match.sets.push(newSet());
      }
    }
    return { round: rec, setJustWon: setJustWon, matchJustWon: matchJustWon, preview: null, pendingCloser: false };
  }

  function directionLabel(roundNumber) {
    /* End-to-end: odd rounds shoot one way, even rounds the other. */
    return (roundNumber % 2 === 1) ? 'this way' : 'the other way';
  }

  return {
    DATSE_SHOTS: DATSE_SHOTS,
    KHURU_SHOTS: KHURU_SHOTS,
    DEGOR_SHOTS: DEGOR_SHOTS,
    scoreDatseRound: scoreDatseRound,
    scoreKhuruRound: scoreKhuruRound,
    scoreDegorRound: scoreDegorRound,
    defaultSettings: defaultSettings,
    createMatch: createMatch,
    scoreCurrentRound: scoreCurrentRound,
    recordShot: recordShot,
    setCloser: setCloser,
    undo: undo,
    shotsInRound: shotsInRound,
    setWinner: setWinner,
    setsNeeded: setsNeeded,
    isDatse: isDatse,
    modeLabel: modeLabel,
    directionLabel: directionLabel,
    kareyPool: kareyPool,
    hadKarey: hadKarey
  };
});
