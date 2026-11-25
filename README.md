[![Make the best cooking game](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![Rank](https://make.fun/badge/best-cooking-game-20261125-0137/ibnuyau/cooking-game-20261125/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![Reward](https://make.fun/badge/best-cooking-game-20261125-0137/ibnuyau/cooking-game-20261125/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

# Sizzle & Serve — Dapur Kilat

A one-chef kitchen rush, built for the [Make the best cooking game bounty](https://make.fun/bounty/best-cooking-game-20261125-0137) on make.fun. Everything in it is original: the kitchen, the dishes, the art and the sounds — nothing from any commercial game.

## The game

You are the only chef in Dapur Kilat, a tiny kitchen with a big lunch rush. Orders fly onto the board: Crispy Fries, Garden Salad, Pasta Marinara, Sizzle Burger, Burger Combo and the Chef Feast. Cook each ingredient at its station — grill the patty, fry the fries, chop the salad, boil the pasta — build the dish on the plate, and serve it before the customer's patience runs out. Fast serves earn tips, back-to-back serves build a combo multiplier, and a walked-out order costs a heart. One 120-second shift. Three hearts. How many coins can you take home?

## How to play

Serve `game/` with any static server (`node serve.ts`, then open http://localhost:8080) and play in desktop Chrome. No network needed — the game runs entirely from its own files.

| Key | Action |
| --- | --- |
| 1–4 | Cook / pick up at Grill, Fryer, Salad Bar, Pasta Pot |
| Click | Same as the keys, on stations, plate and Serve |
| Space | Serve the matching order |
| C | Clear the plate |
| P | Pause |
| R | Restart the shift |
| M | Mute the sound |

## How it is built

Plain static files under `game/`: one `index.html`, one canvas, ES modules split by job — `config.js` holds every number and name, `random.js` the seeded dice, `world.js` the rules, `input.js` the clicks and keys, `render.js` the drawing, `sound.js` a tiny WebAudio synth, `shots.js` the autopilot that stages the screenshots, `main.js` the boot and the loop. No library, no build step, no network request. The screenshots are real renders of the game's own code, staged by `?shot=` scenes that play the real rules forward with the autopilot.

## Hand-in

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the vendored make.fun library. Run it with `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`.
