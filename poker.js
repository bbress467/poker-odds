/**
 * Poker odds calculator – card parsing, hand detection, outs, and probabilities.
 * Card format: rank (2-9, T, J, Q, K, A) + suit (H, D, C, S). e.g. 9H, AD, TC.
 */

const RANKS = '23456789TJQKA';
const SUITS = 'HDCS';
const RANK_VALUES = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };

function parseCard(str) {
  if (!str || typeof str !== 'string') return null;
  const s = str.trim().toUpperCase();
  if (s.length < 2 || s.length > 3) return null;
  const rank = s.slice(0, -1);
  const suit = s.slice(-1);
  if (!RANKS.includes(rank) || !SUITS.includes(suit)) return null;
  return { rank, suit, value: RANK_VALUES[rank], code: s };
}

function parseCards(inputs) {
  const cards = [];
  const seen = new Set();
  for (const raw of inputs) {
    const c = parseCard(raw);
    if (!c) continue;
    const key = c.code;
    if (seen.has(key)) continue;
    seen.add(key);
    cards.push(c);
  }
  return cards;
}

function allCards(hole, board) {
  return [...hole, ...board];
}

function countSuit(cards, suit) {
  return cards.filter(c => c.suit === suit).length;
}

function rankCounts(cards) {
  const counts = {};
  for (const c of cards) {
    counts[c.value] = (counts[c.value] || 0) + 1;
  }
  return counts;
}

function getValuesSorted(cards) {
  return [...new Set(cards.map(c => c.value))].sort((a, b) => b - a);
}

/** Cards to come: 2 = turn+river, 1 = river only */
function cardsToCome(board) {
  const n = board.length;
  if (n <= 3) return 2;
  if (n === 4) return 1;
  return 0;
}

/** Probability to hit with `outs` and `toCome` cards (2 or 1). Uses exact unseen count. */
function probHit(outs, toCome, knownCount) {
  const unseen = 52 - (knownCount || (2 + (toCome === 2 ? 3 : 4)));
  if (unseen <= 0 || outs <= 0) return 0;
  if (toCome === 1) return Math.min(1, outs / unseen);
  if (toCome === 2) {
    const p1 = outs / unseen;
    const p2 = outs / (unseen - 1);
    return Math.min(1, p1 + (1 - p1) * p2);
  }
  return 0;
}

/** Flush: need 5 of same suit. Returns max suit count and whether we have a draw. */
function flushInfo(cards) {
  const suits = {};
  for (const c of cards) suits[c.suit] = (suits[c.suit] || 0) + 1;
  const max = Math.max(...Object.values(suits));
  const need = 5 - max;
  const outs = need <= 0 ? 0 : 13 - max;
  return { max, need, outs, isDraw: need === 1, isMade: need <= 0 };
}

/** Straight: check for sequences. Uses all values including A=1 for wheel. */
function straightInfo(cards) {
  const values = cards.map(c => c.value);
  const withAceLow = [...new Set([...values, ...values.filter(v => v === 14).map(() => 1)])];
  const valueSet = new Set(withAceLow);

  let bestLength = 0;
  let bestGap = 5;
  let openEnded = false;
  for (let start = 14; start >= 5; start--) {
    let length = 0;
    let gapAt = -1;
    for (let i = 0; i <= 4; i++) {
      const v = start - i;
      if (valueSet.has(v)) length++;
      else gapAt = i;
    }
    const gap = gapAt >= 0 ? 1 : 0;
    if (length >= 4 && gap <= 1) {
      if (length > bestLength || (length === bestLength && gap < bestGap)) {
        bestLength = length;
        bestGap = gap;
        openEnded = length === 4 && gap === 1 && (gapAt === 0 || gapAt === 4);
      }
    }
  }

  const isDraw = bestLength === 4 && bestGap === 1;
  const isMade = bestLength >= 5;
  const outs = isDraw ? (openEnded ? 8 : 4) : isMade ? 0 : 0;
  return { length: bestLength, gap: bestGap, isDraw, isMade, outs };
}

/** Pair / two pair / set / boat etc. */
function pairInfo(cards) {
  const counts = rankCounts(cards);
  const vals = Object.values(counts).sort((a, b) => b - a);
  const maxSame = vals[0] || 0;
  const second = vals[1] || 0;

  let outs = 0;
  if (maxSame === 1) {
    outs = 6;
  } else if (maxSame === 2) {
    outs = 5;
  } else if (maxSame === 3 && second < 2) {
    outs = 7;
  }

  return {
    isPair: maxSame >= 2,
    isTwoPair: maxSame >= 2 && second >= 2,
    isSet: maxSame >= 3,
    isBoat: maxSame >= 3 && second >= 2,
    isQuads: maxSame >= 4,
    outsToImprove: outs
  };
}

function analyzeHand(hole, board) {
  const all = allCards(hole, board);
  const toCome = cardsToCome(board);
  const knownCount = hole.length + board.length;
  const flush = flushInfo(all);
  const straight = straightInfo(all);
  const pair = pairInfo(all);

  const outcomes = [];

  if (flush.isMade) {
    outcomes.push({ name: 'Flush', made: true, prob: 1, desc: 'You have a flush.' });
  } else if (flush.isDraw) {
    const p = probHit(flush.outs, toCome, knownCount);
    outcomes.push({ name: 'Flush', made: false, prob: p, outs: flush.outs, desc: `Flush draw (${flush.outs} outs).` });
  }

  if (straight.isMade) {
    outcomes.push({ name: 'Straight', made: true, prob: 1, desc: 'You have a straight.' });
  } else if (straight.isDraw) {
    const p = probHit(straight.outs, toCome, knownCount);
    outcomes.push({ name: 'Straight', made: false, prob: p, outs: straight.outs, desc: `Straight draw (${straight.outs} outs).` });
  }

  if (pair.isQuads) {
    outcomes.push({ name: 'Four of a kind', made: true, prob: 1, desc: 'You have quads.' });
  } else if (pair.isBoat) {
    outcomes.push({ name: 'Full house', made: true, prob: 1, desc: 'You have a full house.' });
  } else if (pair.isSet) {
    const p = probHit(pair.outsToImprove, toCome, knownCount);
    outcomes.push({ name: 'Full house / quads', made: false, prob: p, outs: pair.outsToImprove, desc: `Set – improve to boat/quads (${pair.outsToImprove} outs).` });
  } else if (pair.isTwoPair) {
    const p = probHit(4, toCome, knownCount);
    outcomes.push({ name: 'Full house', made: false, prob: p, outs: 4, desc: 'Two pair – full house (4 outs).' });
  } else if (pair.isPair) {
    const p = probHit(pair.outsToImprove, toCome, knownCount);
    outcomes.push({ name: 'Two pair / set', made: false, prob: p, outs: pair.outsToImprove, desc: `Pair – two pair or set (${pair.outsToImprove} outs).` });
  } else {
    const p = probHit(6, toCome, knownCount);
    outcomes.push({ name: 'Pair', made: false, prob: p, outs: 6, desc: 'No pair – hit a pair (6 outs).' });
  }

  return { outcomes, toCome, flush, straight, pair };
}

function getRecommendation(analysis, pot, toCall) {
  const { outcomes, pair, flush, straight } = analysis;
  const hasMadeHand = outcomes.some(o => o.made);
  const bestDraw = outcomes.filter(o => !o.made && o.prob > 0).sort((a, b) => b.prob - a.prob)[0];
  const potOdds = toCall > 0 ? pot / toCall : 0;
  const needEquity = toCall > 0 && pot > 0 ? toCall / (pot + toCall) : 0;

  const tips = [];

  if (hasMadeHand) {
    if (pair.isBoat || pair.isQuads || flush.isMade || straight.isMade) {
      tips.push({ action: 'Bet / Raise', reason: 'Strong made hand. Build the pot.' });
    } else if (pair.isSet || pair.isTwoPair) {
      tips.push({ action: 'Bet / Call', reason: 'Good hand. Value bet or call reasonable bets.' });
    } else if (pair.isPair) {
      tips.push({ action: 'Consider pot odds', reason: 'One pair. Check pot size and opponent action.' });
    }
  } else if (bestDraw && bestDraw.prob >= needEquity - 0.05) {
    const pct = (bestDraw.prob * 100).toFixed(0);
    tips.push({ action: 'Call is OK', reason: `Your draw has ~${pct}% to hit. Pot odds ${(needEquity * 100).toFixed(0)}% needed.` });
  } else if (bestDraw) {
    tips.push({ action: 'Fold or bluff', reason: `Draw alone doesn’t justify calling; pot odds may be thin.` });
  } else {
    tips.push({ action: 'Fold', reason: 'No pair and no strong draw. Save your chips.' });
  }

  if (potOdds > 0 && needEquity > 0) {
    tips.push({ action: 'Pot odds', reason: `You need ~${(needEquity * 100).toFixed(0)}% equity to call $${toCall} into $${pot} pot.` });
  }

  return tips;
}

window.Poker = {
  parseCard,
  parseCards,
  analyzeHand,
  getRecommendation,
  RANKS,
  SUITS,
  RANK_VALUES
};
