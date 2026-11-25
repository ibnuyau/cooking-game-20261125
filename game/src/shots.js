// Sizzle & Serve — screenshot scenes.
// One file, one job: stage a named scene by playing the real rules forward
// from a fresh world with a simple autopilot, so every screenshot is what
// a short game really looks like, and the same seed always gives the same
// frame. Nothing here is faked: the autopilot only presses the same
// buttons a player can press. Each scene stops the moment it looks right
// instead of at a fixed time, so the frame always shows what it promises.
// The rush scene's pilot is deliberately slow — it thinks once every
// 1.5 seconds and chases the newest order first, like a hurried player —
// so the board fills up and the timers run low, as a real rush does.
// The served scene trails a second past the serve so the next order has
// spawned and the coin popup is still on screen.

import { DISHES, STEP } from './config.js';
import {
  EVENT_SERVED, SCREEN_OVER, SCREEN_PLAY, createWorld, matchingOrder,
  pressServe, pressStation, startShift, stepFixed,
} from './world.js';

/**
 * The autopilot's move for this moment: cook the oldest (or, when
 * `pickLast`, the newest) order's missing ingredient, pick a ready one
 * up, or serve when the plate matches.
 */
function autopilotMove(world, pickLast) {
  if (world.plate.length > 0 && matchingOrder(world)) return { kind: 'serve' };
  const order = pickLast ? world.orders[world.orders.length - 1] : world.orders[0];
  if (!order) return null;
  const dish = DISHES.find((item) => item.id === order.dish);
  const missing = dish.needs.find((item) => !world.plate.includes(item));
  if (!missing) return { kind: 'serve' };
  const stationFor = { patty: 'grill', fries: 'fryer', salad: 'salad', pasta: 'pasta' };
  const stationId = stationFor[missing];
  const slot = world.stations.find((item) => item.id === stationId);
  if (slot.ready) return { kind: 'station', id: stationId };
  if (!slot.cooking) return { kind: 'station', id: stationId };
  return null;
}

/**
 * One autopilot step: press a button (only on a thinking step), then
 * advance the clock. Returns the events of the step, including a serve.
 */
function autopilotStep(world, dt, stepCount, thinkEvery, pickLast) {
  let events = 0;
  if (stepCount % thinkEvery === 0) {
    const move = autopilotMove(world, pickLast);
    if (move && move.kind === 'station') pressStation(world, move.id);
    if (move && move.kind === 'serve') events |= pressServe(world);
  }
  events |= stepFixed(world, dt);
  return events;
}

/**
 * Play forward until `stop` says the scene is ready, then keep playing
 * `trail` more steps (so a just-served dish's popup and the next order
 * both show), or until `maxSeconds` pass.
 */
function playUntil(world, stop, maxSeconds, thinkEvery, pickLast, trail) {
  const limit = Math.round(maxSeconds / STEP);
  let trailLeft = -1;
  for (let i = 0; i < limit; i += 1) {
    const events = autopilotStep(world, STEP, i, thinkEvery || 1, !!pickLast);
    if (world.screen === SCREEN_OVER) break;
    if (trailLeft < 0 && stop(world, events)) trailLeft = trail || 0;
    if (trailLeft === 0) break;
    if (trailLeft > 0) trailLeft -= 1;
  }
}

/**
 * Set `world` to the named scene and return the screen to draw.
 * cover: mid-shift, two or more orders up, a dish half-built on the plate.
 * assembly: a plate holding two ingredients, one station still cooking.
 * rush: late shift, the board full, a timer nearly out, one heart left.
 * served: the instant after a dish is served, coins popping.
 */
export function stageShot(name, seed) {
  const world = createWorld(seed);
  startShift(world);
  if (name === 'assembly') {
    playUntil(world, (w) => w.plate.length >= 2 && w.stations.some((s) => s.cooking), 40, 1, false, 0);
    return { world, screen: SCREEN_PLAY };
  }
  if (name === 'rush') {
    playUntil(world, (w) => w.elapsed > 50 && w.orders.length >= 3 && w.orders.some((o) => o.left < 12) && w.hearts >= 1, 78, 90, true, 0);
    return { world, screen: SCREEN_PLAY };
  }
  if (name === 'served') {
    playUntil(world, (w, events) => w.elapsed > 12 && (events & EVENT_SERVED) !== 0, 60, 1, false, 90);
    return { world, screen: SCREEN_PLAY };
  }
  playUntil(world, (w) => w.orders.length >= 2 && w.plate.length >= 1, 30, 1, false, 0);
  return { world, screen: SCREEN_PLAY };
}
