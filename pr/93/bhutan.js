/* UI for the standalone Bhutan scoring test page. Scoring lives in bhutan_score.js. */
(function () {
  const B = window.BhutanScore;
  const KEY = 'scoretool.bhutan.test.v1';
  const $ = (s, el) => (el || document).querySelector(s);
  const app = $('#app');
  const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  let setup = loadSetup();
  let match = null;
  let lastNotes = [];
  let flash = '';

  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && saved.match) {
      match = saved.match;
      match.history = match.history || [];
      lastNotes = saved.lastNotes || [];
    }
  } catch (e) { match = null; }

  function loadSetup() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY + '.setup') || 'null');
      if (s) return B.defaultSettings(s);
    } catch (e) {}
    return B.defaultSettings({ names: { a: 'Team A', b: 'Team B' } });
  }

  function persist() {
    try {
      localStorage.setItem(KEY + '.setup', JSON.stringify(setup));
      if (match) localStorage.setItem(KEY, JSON.stringify({ match: { ...match, history: match.history }, lastNotes }));
      else localStorage.removeItem(KEY);
    } catch (e) {}
  }

  function readSetupFromForm() {
    const mode = $('[data-mode].on').dataset.mode;
    const sizeKey = $('[data-size].on').dataset.size;
    let teamSize = 11, substitutes = 2;
    if (sizeKey === '6') { teamSize = 6; substitutes = 0; }
    else if (sizeKey === 'custom') {
      teamSize = Math.max(1, Math.min(20, parseInt($('#csize').value, 10) || 1));
      substitutes = Math.max(0, Math.min(10, parseInt($('#csub').value, 10) || 0));
    }
    let winType = 'first_to', winPoints = 25, winRounds = 11;
    if (mode === 'khuru' || mode === 'degor') {
      winType = 'first_to'; winPoints = 15;
    } else {
      const w = $('[data-win].on').dataset.win;
      if (w === 'rounds') { winType = 'rounds'; winRounds = 11; }
      else if (w === '25') { winType = 'first_to'; winPoints = 25; }
      else {
        winType = 'first_to';
        winPoints = parseInt($('#cpts').value, 10) || 21;
      }
    }
    const setsBestOf = (mode === 'khuru' || mode === 'degor')
      ? 3
      : parseInt($('[data-sets].on').dataset.sets, 10) || 3;
    setup = B.defaultSettings({
      mode,
      teamSize,
      substitutes,
      winType,
      winPoints,
      winRounds,
      setsBestOf,
      names: { a: ($('#na').value || 'Team A').trim(), b: ($('#nb').value || 'Team B').trim() }
    });
    persist();
  }

  function startMatch() {
    readSetupFromForm();
    match = B.createMatch(setup);
    lastNotes = [];
    flash = '';
    persist();
    render();
  }

  function newMatch() {
    match = null;
    lastNotes = [];
    flash = '';
    persist();
    render();
  }

  function unit() {
    if (setup.mode === 'khuru') return 'Khuru';
    if (setup.mode === 'degor') return 'stone';
    return 'arrow';
  }

  function shotButtons() {
    if (B.isDatse(setup.mode)) {
      return [
        ['karey', 'Karey', '2 Kuu', 'royal'],
        ['bull', 'Bullseye', '3 Kuu', 'neon'],
        ['sa_karey', 'Sa-Karey', '1, cancels 1', 'ghost'],
        ['bounce', 'Bounce-off', '2, or cancels 1', 'ghost'],
        ['daya', 'Daya', '1 if closer', 'ghost'],
        ['miss', 'Miss', 'No score', 'ghost']
      ];
    }
    if (setup.mode === 'khuru') {
      return [
        ['hit', 'Hit', '2 Kuu', 'royal'],
        ['bull', 'Bullseye', '3 Kuu', 'neon'],
        ['near', 'Near-miss', '1, within a stick', 'ghost'],
        ['miss', 'Miss', 'No score', 'ghost']
      ];
    }
    return [
      ['in', 'In range', 'May score if closest', 'royal'],
      ['out', 'Out', 'No score', 'ghost']
    ];
  }

  function shot(type) {
    if (!match || match.matchWinner) return;
    const res = B.recordShot(match, type);
    if (!res.ok) return;
    applyScored(res.scored);
  }

  function liveNotes(scored) {
    if (scored && scored.round && scored.round.notes) return scored.round.notes;
    if (scored && scored.pendingCloser && scored.preview && scored.preview.notes) return scored.preview.notes;
    if (match) return B.liveTotals(match).notes || [];
    return [];
  }

  function applyScored(scored) {
    lastNotes = liveNotes(scored);
    if (!scored || scored.pendingCloser) {
      flash = '';
      persist(); render();
      return;
    }
    if (scored.matchJustWon) {
      const n = match.settings.names[scored.matchJustWon];
      flash = n + ' win the match';
    } else if (scored.setJustWon) {
      const n = match.settings.names[scored.setJustWon];
      const kind = setup.mode === 'degor' ? 'game' : 'set';
      flash = n + ' win the ' + kind;
    } else {
      flash = '';
    }
    persist(); render();
  }

  function doUndo() {
    if (!match || !B.undo(match)) return;
    lastNotes = B.liveTotals(match).notes || [];
    flash = '';
    persist(); render();
  }

  function pickCloser(who, count) {
    const res = B.setCloser(match, who, count);
    if (res && res.ok) applyScored(res.scored);
  }

  function header() {
    return `<div class="top"><a href="./">‹ ScoreTool</a><h1>Bhutan scoring</h1><span class="badge">Test</span></div>`;
  }

  function setupView() {
    const s = setup;
    const modeBtn = (id, title, sub) =>
      `<button type="button" class="mode${s.mode === id ? ' on' : ''}" data-mode="${id}">${esc(title)}<small>${esc(sub)}</small></button>`;
    const datse = B.isDatse(s.mode);
    const size = s.teamSize === 11 && s.substitutes === 2 ? '11' : s.teamSize === 6 && s.substitutes === 0 ? '6' : 'custom';
    const win = s.winType === 'rounds' ? 'rounds' : s.winPoints === 25 ? '25' : 'custom';
    return `${header()}
<div class="card">
  <span class="kicker">Game</span>
  <div class="modes">
    ${modeBtn('datse_bamboo', 'Datse · bamboo', 'Traditional bows, same scoring')}
    ${modeBtn('datse_compound', 'Datse · compound', 'Finger release only')}
    ${modeBtn('khuru', 'Khuru', 'Outdoor darts')}
    ${modeBtn('degor', 'Degor', 'Flat stone pitching')}
  </div>
  ${s.mode === 'datse_compound' ? `<p class="note">Compound in this game is the same long-range team scoring as bamboo. Shot with a <b>finger release</b>. No magnifier and no release aid.</p>` : ''}
  <div class="row2">
    <div><label class="fld" for="na">Team A</label><input id="na" type="text" maxlength="24" value="${esc(s.names.a)}"></div>
    <div><label class="fld" for="nb">Team B</label><input id="nb" type="text" maxlength="24" value="${esc(s.names.b)}"></div>
  </div>
  <label class="fld">Team size (each side)</label>
  <div class="segs" id="sizes">
    <button type="button" class="seg${size === '11' ? ' on' : ''}" data-size="11">11 + 2 subs</button>
    <button type="button" class="seg${size === '6' ? ' on' : ''}" data-size="6">6 (Yangphel style)</button>
    <button type="button" class="seg${size === 'custom' ? ' on' : ''}" data-size="custom" style="grid-column:1/-1">Custom</button>
  </div>
  <div id="customsize" class="row2" style="${size === 'custom' ? '' : 'display:none'}">
    <div><label class="fld" for="csize">Shooting</label><input id="csize" type="number" min="1" max="20" value="${esc(s.teamSize)}"></div>
    <div><label class="fld" for="csub">Subs</label><input id="csub" type="number" min="0" max="10" value="${esc(s.substitutes)}"></div>
  </div>
  ${datse ? `
  <label class="fld">Win a set by</label>
  <div class="segs" id="wins">
    <button type="button" class="seg${win === '25' ? ' on' : ''}" data-win="25">First to 25</button>
    <button type="button" class="seg${win === 'rounds' ? ' on' : ''}" data-win="rounds">11 rounds</button>
    <button type="button" class="seg${win === 'custom' ? ' on' : ''}" data-win="custom">Custom (21, 23…)</button>
  </div>
  <div id="custompts" style="${win === 'custom' ? '' : 'display:none'}">
    <label class="fld" for="cpts">Points to win a set</label>
    <input id="cpts" type="number" min="1" max="99" value="${esc(s.winType === 'first_to' && s.winPoints !== 25 ? s.winPoints : 21)}">
  </div>
  <label class="fld">Match</label>
  <div class="segs">
    <button type="button" class="seg${s.setsBestOf === 3 ? ' on' : ''}" data-sets="3">Best of 3 sets</button>
    <button type="button" class="seg${s.setsBestOf === 5 ? ' on' : ''}" data-sets="5">Best of 5 sets</button>
  </div>` : `<p class="note">${s.mode === 'khuru' ? 'Khuru: hit 2, bullseye 3, near-miss within a stick length 1. Best of 3 sets to 15.' : 'Degor: the closest stone (or stones closer than the other side’s closest) scores. Best of 3 games to 15.'}</p>`}
  <p class="small muted">Two teams, shooting end to end. Each player has two ${unit() === 'stone' ? 'stones' : unit() === 'Khuru' ? 'Khuru' : 'arrows'} a turn. Scores update as you tap. Cancels are shown straight away. The set total is confirmed at the end of the round.</p>
  <button type="button" class="start" id="go">Start match</button>
</div>
<p class="small muted">This is a test page. It is not live on the main ScoreTool app. Scores stay on this phone only.</p>`;
  }

  function bindSetup() {
    app.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { readSetupFromForm(); setup.mode = b.dataset.mode; if (setup.mode === 'khuru' || setup.mode === 'degor') { setup.winType = 'first_to'; setup.winPoints = 15; setup.setsBestOf = 3; } persist(); render(); });
    app.querySelectorAll('[data-size]').forEach(b => b.onclick = () => {
      app.querySelectorAll('[data-size]').forEach(x => x.classList.toggle('on', x === b));
      const box = $('#customsize');
      if (box) box.style.display = b.dataset.size === 'custom' ? '' : 'none';
    });
    app.querySelectorAll('[data-win]').forEach(b => b.onclick = () => {
      app.querySelectorAll('[data-win]').forEach(x => x.classList.toggle('on', x === b));
      const box = $('#custompts');
      if (box) box.style.display = b.dataset.win === 'custom' ? '' : 'none';
    });
    app.querySelectorAll('[data-sets]').forEach(b => b.onclick = () => {
      app.querySelectorAll('[data-sets]').forEach(x => x.classList.toggle('on', x === b));
    });
    $('#go').onclick = startMatch;
  }

  function currentSet() { return match.sets[match.sets.length - 1]; }

  function pendingCloser() {
    if (!match || match.matchWinner) return null;
    const set = currentSet();
    if (!B.shotsInRound(match)) return null;
    const r = B.scoreCurrentRound(match);
    return r.dayaReady ? null : r;
  }

  function matchView() {
    const s = match.settings;
    setup = s;
    const set = currentSet();
    const names = s.names;
    const setNo = match.sets.length;
    const roundNo = set.rounds.length + (set.winner ? 0 : 1);
    const pending = pendingCloser();
    const turnTeam = pending ? null : match.turn.team;
    const aOn = turnTeam === 'a';
    const bOn = turnTeam === 'b';
    const kind = s.mode === 'degor' ? 'Game' : 'Set';
    const need = B.setsNeeded(s.setsBestOf);
    const winLine = s.mode === 'khuru' || s.mode === 'degor'
      ? 'First to 15, best of 3'
      : (s.winType === 'rounds' ? ('Set of ' + s.winRounds + ' rounds') : ('First to ' + s.winPoints)) + ', best of ' + s.setsBestOf;
    const thing = s.mode === 'degor' ? 'stone' : s.mode === 'khuru' ? 'Khuru' : 'arrow';
    const archerN = match.turn.archer + 1;
    const arrowN = match.turn.arrow + 1;
    const way = B.directionLabel(roundNo);
    const who = turnTeam ? names[turnTeam] : '';

    const closerThing = s.mode === 'degor' ? 'stone' : s.mode === 'khuru' ? 'near-miss' : 'Daya';
    const closerTitle = s.mode === 'degor'
      ? 'Which was closest?'
      : s.mode === 'khuru'
        ? 'Which was closest?'
        : 'Which was closest?';
    const closerHint = s.mode === 'degor'
      ? 'A stone only scores if no opponent stone is closer to the peg. Count how many of the closer side are nearer than the other side’s closest stone.'
      : s.mode === 'khuru'
        ? 'Only the single closest near-miss scores 1, and only if it is within a stick length of the target.'
        : 'Only the single closest Daya in a round scores 1.';

    let closerBox = '';
    if (pending) {
      const aShots = set.current.aShots, bShots = set.current.bShots;
      const aIn = s.mode === 'degor' ? aShots.filter(x => x === 'in').length : 0;
      const bIn = s.mode === 'degor' ? bShots.filter(x => x === 'in').length : 0;
      closerBox = `<div class="card" id="closerbox">
        <span class="kicker">Measure</span>
        <h2 style="margin:0 0 8px">${esc(closerTitle)}</h2>
        <p class="small muted">${esc(closerHint)}</p>
        <div class="acts">
          <button type="button" class="act royal" data-closer="a">${esc(names.a)} closer</button>
          <button type="button" class="act royal" data-closer="b">${esc(names.b)} closer</button>
        </div>
        <button type="button" class="ghost" data-closer="equal">Equal — neither scores</button>
        ${s.mode === 'degor' ? `<div id="degorcount" class="row2" style="display:none;margin-top:8px">
          <div><label class="fld" for="ccount">How many stones score?</label>
          <input id="ccount" type="number" min="1" max="20" value="1"></div>
        </div>` : ''}
      </div>`;
      /* stash counts for degor bind */
      closerBox = closerBox.replace('data-closer="a"', 'data-closer="a" data-in="' + aIn + '"');
    }

    const buttons = shotButtons().map(([id, label, sub, style]) =>
      `<button type="button" class="act ${style}" data-shot="${id}" ${pending || match.matchWinner || set.winner ? 'disabled' : ''}>${esc(label)}<small>${esc(sub)}</small></button>`
    ).join('');

    const live = B.liveTotals(match);
    const notesList = (lastNotes && lastNotes.length) ? lastNotes : live.notes;
    const notes = notesList.length
      ? `<div class="note cancels" id="roundnotes"><b>${live.roundOpen ? 'This round, live' : 'Last round'}</b><ul>${notesList.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>`
      : '';

    const hist = set.rounds.length
      ? `<div class="hist">${set.rounds.map((r, i) => `<div><b>Round ${i + 1}</b> ${esc(names.a)} ${r.a} · ${esc(names.b)} ${r.b}${r.notes && r.notes.length ? `<div class="small">${r.notes.map(esc).join(' · ')}</div>` : ''}</div>`).join('')}</div>`
      : '';

    const winCard = match.matchWinner
      ? `<div class="winner" id="wincard"><h2>${esc(names[match.matchWinner])} win</h2><p class="neon">${esc(B.modeLabel(s.mode))} · ${esc(winLine)}</p><p>Sets ${match.setWins.a}–${match.setWins.b}</p></div>`
      : (flash ? `<div class="winner"><h2>${esc(flash)}</h2></div>` : '');

    function teamCard(side, on) {
      const total = side === 'a' ? live.totalA : live.totalB;
      const round = side === 'a' ? live.roundA : live.roundB;
      const setPts = side === 'a' ? live.setA : live.setB;
      const tally = side === 'a' ? live.tallyA : live.tallyB;
      const wins = match.setWins[side];
      const tallyLine = tally.length ? tally.join(' · ') : 'No taps yet this round';
      return `<div class="team${on ? ' on' : ''}" id="team${side}">
        <div class="nm">${esc(names[side])}</div>
        <div class="sc" id="score${side}">${total}</div>
        <div class="sub" id="split${side}">This round ${round} · ${kind} ${setPts}</div>
        <div class="tally" id="tally${side}">${esc(tallyLine)}</div>
        <div class="sets">${kind}s won ${wins}</div>
      </div>`;
    }

    return `${header()}
${winCard}
<div class="card">
  <span class="kicker">${esc(B.modeLabel(s.mode))} · ${esc(winLine)}</span>
  <div class="board">
    ${teamCard('a', aOn)}
    <div class="vs">vs</div>
    ${teamCard('b', bOn)}
  </div>
  <p class="postnote">Big number is this ${kind.toLowerCase()} so far, including this round. ${kind} winners are confirmed at the end of the round.</p>
  <p class="small muted" style="text-align:center;margin:8px 0 0">${kind} ${setNo} of ${s.setsBestOf} · first to ${need} ${kind.toLowerCase()}s · ${esc(s.teamSize)} a side</p>
</div>
${closerBox}
${match.matchWinner ? '' : `<div class="status">
  <div class="way">Round ${roundNo} · shooting ${esc(way)}</div>
  ${pending ? `<p>Round complete. Pick the closer ${closerThing} above.</p>` : `<p><b>${esc(who)}</b> · player ${archerN} of ${s.teamSize} · ${thing} ${arrowN} of 2</p>`}
</div>
<div class="acts">${buttons}</div>
<button type="button" class="undo" id="undo" ${match.history.length ? '' : 'disabled'}>Undo last tap</button>`}
${notes}
${hist ? `<div class="card"><span class="kicker">Rounds this ${kind.toLowerCase()}</span>${hist}</div>` : ''}
<button type="button" class="ghost" id="fresh">New match</button>
${s.mode === 'datse_compound' ? `<p class="small muted">Compound reminder: finger release only, no magnifier or release aid.</p>` : ''}
`;
  }

  function bindMatch() {
    app.querySelectorAll('[data-shot]').forEach(b => b.onclick = () => shot(b.dataset.shot));
    const u = $('#undo'); if (u) u.onclick = doUndo;
    const n = $('#fresh'); if (n) n.onclick = newMatch;
    let picked = null;
    app.querySelectorAll('[data-closer]').forEach(b => b.onclick = () => {
      const who = b.dataset.closer;
      if (match.settings.mode === 'degor' && (who === 'a' || who === 'b')) {
        const cap = who === 'a'
          ? currentSet().current.aShots.filter(x => x === 'in').length
          : currentSet().current.bShots.filter(x => x === 'in').length;
        const box = $('#degorcount');
        const inp = $('#ccount');
        if (box && inp && cap > 1) {
          if (picked !== who) {
            picked = who;
            box.style.display = '';
            inp.max = String(cap);
            inp.value = String(cap);
            b.textContent = 'Confirm ' + match.settings.names[who] + ' · ' + cap + ' stone' + (cap === 1 ? '' : 's');
            return;
          }
          pickCloser(who, parseInt(inp.value, 10) || cap);
          return;
        }
        pickCloser(who, cap);
        return;
      }
      pickCloser(who);
    });
  }

  function render() {
    if (!match) {
      app.innerHTML = setupView();
      bindSetup();
    } else {
      app.innerHTML = matchView();
      bindMatch();
    }
  }

  render();
})();
