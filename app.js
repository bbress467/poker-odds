(function () {
  const hole1 = document.getElementById('hole1');
  const hole2 = document.getElementById('hole2');
  const flop1 = document.getElementById('flop1');
  const flop2 = document.getElementById('flop2');
  const flop3 = document.getElementById('flop3');
  const turn = document.getElementById('turn');
  const river = document.getElementById('river');
  const players = document.getElementById('players');
  const buyin = document.getElementById('buyin');
  const pot = document.getElementById('pot');
  const toCall = document.getElementById('toCall');
  const results = document.getElementById('results');
  const oddsGrid = document.getElementById('oddsGrid');
  const recommendation = document.getElementById('recommendation');
  const errors = document.getElementById('errors');
  const errorList = document.getElementById('errorList');

  function getHole() {
    return [hole1.value, hole2.value].filter(Boolean);
  }

  function getBoard() {
    const f = [flop1.value, flop2.value, flop3.value].filter(Boolean);
    const t = turn.value.trim() ? [turn.value] : [];
    const r = river.value.trim() ? [river.value] : [];
    return [...f, ...t, ...r];
  }

  function validate() {
    const errs = [];
    const hole = getHole();
    const board = getBoard();

    if (hole.length !== 2) {
      errs.push('Enter exactly two hole cards (e.g. 9H AD).');
      return errs;
    }

    const c1 = Poker.parseCard(hole[0]);
    const c2 = Poker.parseCard(hole[1]);
    if (!c1) errs.push(`Invalid card: "${hole[0]}". Use rank + suit, e.g. 9H, TC, AD.`);
    if (!c2) errs.push(`Invalid card: "${hole[1]}". Use rank + suit, e.g. 9H, TC, AD.`);
    if (c1 && c2 && c1.code === c2.code) errs.push('Hole cards must be different.');

    const allInputs = [...hole, ...board];
    const seen = new Set();
    for (const raw of allInputs) {
      const c = Poker.parseCard(raw);
      if (!c) errs.push(`Invalid card: "${raw}". Use rank + suit, e.g. 9H, TC, AD.`);
      else if (seen.has(c.code)) errs.push(`Duplicate card: ${c.code}.`);
      else seen.add(c.code);
    }

    return errs;
  }

  function renderOutcome(o) {
    const pct = (o.prob * 100).toFixed(1);
    const made = o.made ? 'made' : 'draw';
    const outs = o.outs != null ? ` (${o.outs} outs)` : '';
    return `
      <div class="outcome ${made}">
        <div class="outcome-name">${o.name}</div>
        <div class="outcome-bar"><span class="outcome-fill" style="width: ${pct}%"></span></div>
        <div class="outcome-pct">${pct}%</div>
        <div class="outcome-desc">${o.desc}</div>
      </div>
    `;
  }

  function renderRecommendation(tips) {
    if (!tips.length) return '';
    return `<div class="tips"><h3>Recommendation</h3><ul>${tips.map(t => `<li><strong>${t.action}</strong> — ${t.reason}</li>`).join('')}</ul></div>`;
  }

  function runCalculate() {
    const errs = validate();
    errors.hidden = errs.length === 0;
    if (errs.length > 0) {
      errorList.innerHTML = errs.map(e => `<li>${e}</li>`).join('');
      results.hidden = true;
      return;
    }

    const holeRaw = getHole();
    const boardRaw = getBoard();
    const hole = Poker.parseCards(holeRaw);
    const board = Poker.parseCards(boardRaw);
    const analysis = Poker.analyzeHand(hole, board);
    const potVal = Number(pot.value) || 0;
    const toCallVal = Number(toCall.value) || 0;
    const tips = Poker.getRecommendation(analysis, potVal, toCallVal);

    oddsGrid.innerHTML = analysis.outcomes.map(renderOutcome).join('');
    recommendation.innerHTML = renderRecommendation(tips);
    results.hidden = false;
  }

  function clearAll() {
    [hole1, hole2, flop1, flop2, flop3, turn, river].forEach(i => { i.value = ''; });
    pot.value = '50';
    toCall.value = '10';
    players.value = '6';
    buyin.value = '100';
    results.hidden = true;
    errors.hidden = true;
  }

  document.getElementById('calculate').addEventListener('click', runCalculate);
  document.getElementById('clear').addEventListener('click', clearAll);
})();
