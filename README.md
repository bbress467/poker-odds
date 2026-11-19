# Poker Odds Calculator

A single-page web app that takes a live Texas Hold'em scenario (your hand, the board, pot and bet size) and shows the probability of improving to key hands, plus a simple recommendation based on pot odds.

![Poker Odds screenshot](docs/screenshot.png)

## Features

- Enter two hole cards and any of the flop, turn and river (leave the board blank for pre-flop).
- Input validation with clear messages for malformed or duplicate cards.
- Detects made hands (pair, two pair, set, straight, flush, full house, quads) and draws (flush, open-ended and gutshot straights).
- Outs-based probability of hitting on the turn and river, computed exactly from the number of unseen cards.
- Recommendation (bet, call, fold) using your equity against the pot odds for the amount to call.
- Runs entirely in the browser. Nothing is sent to a server.

## Card format

Rank `2`-`9`, `T`, `J`, `Q`, `K`, `A` followed by suit `H`, `D`, `C`, `S`. Examples: `9H`, `AD`, `TC`.

## Tech stack

Vanilla HTML, CSS and JavaScript. No dependencies and no build step.

- `poker.js`: card parsing, hand detection, outs, probabilities, recommendation
- `app.js`: DOM wiring, validation and rendering
- `index.html`, `styles.css`: UI

## Running locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# or: npx serve .
```

Then visit http://localhost:8000.

## Limitations

- Probabilities are standard outs-based estimates, not a simulation, and they don't model opponent hands or ranges.
- The "players" and "buy-in" fields are collected but not yet used in the calculation.
- The recommendation is a simple heuristic, not solver-grade advice.
