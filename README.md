# Poker Odds Calculator

A single-page web app that takes a live poker scenario (your hand, board, pot, etc.) and shows **percentages to hit** outcomes (flush, straight, pair, etc.) and **recommendations** based on your hand and pot odds.

## How to run

Open `index.html` in a browser (double-click or drag into Chrome/Firefox/Safari). No server required.

Or from the project folder:

```bash
npx serve .
# or: python3 -m http.server 8000
```

Then go to `http://localhost:3000` (or 8000).

## Card input format

- **Rank**: `2`–`9`, `T` (10), `J`, `Q`, `K`, `A`
- **Suit**: `H` hearts, `D` diamonds, `C` clubs, `S` spades

Examples: `9H` (9 of hearts), `AD` (ace of diamonds), `TC` (10 of clubs).

## What you can enter

- **Your hand**: two hole cards (required).
- **Board**: flop (3 cards), turn, river. Leave turn/river blank if you’re pre-flop or on the flop.
- **Game**: number of players, buy-in, current pot, amount to call.

## What you get

- **Odds**: probability (as a %) to make flush, straight, pair, two pair, set, full house, etc., with a short description (e.g. “Flush draw, 9 outs”).
- **Recommendation**: whether to bet, call, or fold based on hand strength and pot odds.

All logic runs in the browser; nothing is sent to a server.
