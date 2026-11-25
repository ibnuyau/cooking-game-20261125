// Sizzle & Serve — the world: state and rules.
// One file, one job: everything that changes as the shift runs. Rendering
// never lives here; input never lives here. Only this file decides whether
// a serve pays, an order walks out, or the shift ends.

import {
  DISHES, MAX_HEARTS, MAX_ORDERS, PATIENCE_END, PATIENCE_START,
  PLATE_SLOTS, SHIFT_SECONDS, SPAWN_END, SPAWN_START, STATIONS, STEP,
} from './config.js';
import { makeRandom, pick } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

export const EVENT_NONE = 0;
export const EVENT_SERVED = 1;
export const EVENT_LOST = 2;
export const EVENT_OVER = 4;

let orderCounter = 0;

function dishById(id) {
  return DISHES.find((dish) => dish.id === id);
}

function stationById(id) {
  return STATIONS.find((station) => station.id === id);
}

/** A fresh order ticket: a dish, a patience clock, and a serial number. */
function makeOrder(rand, elapsed) {
  const progress = Math.min(1, elapsed / SHIFT_SECONDS);
  const patience = PATIENCE_START + (PATIENCE_END - PATIENCE_START) * progress;
  orderCounter += 1;
  return {
    id: orderCounter,
    dish: pick(rand, DISHES).id,
    patience,
    left: patience,
    bornAt: elapsed,
  };
}

/** A fresh world for a seed. Nothing has happened yet. */
export function createWorld(seed) {
  orderCounter = 0;
  return {
    seed,
    rand: makeRandom(seed),
    screen: SCREEN_TITLE,
    elapsed: 0,
    timeLeft: SHIFT_SECONDS,
    coins: 0,
    served: 0,
    lost: 0,
    hearts: MAX_HEARTS,
    combo: 0,
    bestCombo: 0,
    orders: [],
    spawnIn: 2,
    stations: STATIONS.map((station) => ({
      id: station.id,
      cooking: null,
      progress: 0,
      ready: null,
    })),
    plate: [],
    popups: [],
    message: '',
    messageAt: -99,
    servedFlash: 0,
  };
}

/** Start the shift: the title screen gives way to the first orders. */
export function startShift(world) {
  world.screen = SCREEN_PLAY;
  world.elapsed = 0;
  world.timeLeft = SHIFT_SECONDS;
  world.orders = [makeOrder(world.rand, 0), makeOrder(world.rand, 0)];
  world.spawnIn = SPAWN_START;
}

/** How long before the next order, given how far into the shift we are. */
function spawnGap(elapsed) {
  const progress = Math.min(1, elapsed / SHIFT_SECONDS);
  return SPAWN_START + (SPAWN_END - SPAWN_START) * progress;
}

/** Does the plate hold exactly the ingredients `dishId` needs? */
function plateMatches(plate, dishId) {
  const needs = dishById(dishId).needs.slice().sort();
  const has = plate.slice().sort();
  if (needs.length !== has.length) return false;
  for (let i = 0; i < needs.length; i += 1) {
    if (needs[i] !== has[i]) return false;
  }
  return true;
}

/** The oldest order the current plate completes, or null. */
export function matchingOrder(world) {
  if (world.plate.length === 0) return null;
  for (let i = 0; i < world.orders.length; i += 1) {
    if (plateMatches(world.plate, world.orders[i].dish)) return world.orders[i];
  }
  return null;
}

/** A small floating note over the kitchen, e.g. "+24". */
function addPopup(world, text, kind) {
  world.popups.push({ text, kind, age: 0 });
  if (world.popups.length > 6) world.popups.shift();
}

/** Show a one-line message under the board for a couple of seconds. */
function say(world, text) {
  world.message = text;
  world.messageAt = world.elapsed;
}

/**
 * Press a station: start cooking when it is idle, pick the cooked item up
 * when it is ready (it lands on the plate when there is room).
 */
export function pressStation(world, stationId) {
  if (world.screen !== SCREEN_PLAY) return EVENT_NONE;
  const slot = world.stations.find((item) => item.id === stationId);
  const station = stationById(stationId);
  if (!slot || !station) return EVENT_NONE;
  if (slot.ready) {
    if (world.plate.length >= PLATE_SLOTS) {
      say(world, 'Plate is full — serve or clear it first!');
      return EVENT_NONE;
    }
    world.plate.push(slot.ready);
    slot.ready = null;
    return EVENT_NONE;
  }
  if (slot.cooking) return EVENT_NONE;
  slot.cooking = station.item;
  slot.progress = 0;
  return EVENT_NONE;
}

/** Empty the plate back onto the counter. */
export function clearPlate(world) {
  if (world.screen !== SCREEN_PLAY || world.plate.length === 0) return;
  world.plate = [];
  say(world, 'Plate cleared.');
}

/**
 * Serve the oldest order the plate completes. Pays the dish price plus a
 * tip for the patience left, times the combo. No match: a shake and a hint.
 */
export function pressServe(world) {
  if (world.screen !== SCREEN_PLAY) return EVENT_NONE;
  const order = matchingOrder(world);
  if (!order) {
    say(world, world.plate.length === 0
      ? 'The plate is empty — cook something first!'
      : 'No order matches this plate yet.');
    return EVENT_NONE;
  }
  const dish = dishById(order.dish);
  const patienceLeft = Math.max(0, order.left / order.patience);
  world.combo += 1;
  world.bestCombo = Math.max(world.bestCombo, world.combo);
  const multiplier = 1 + 0.25 * (world.combo - 1);
  const earned = Math.round((dish.coins + dish.tip * patienceLeft) * multiplier);
  world.coins += earned;
  world.served += 1;
  world.plate = [];
  world.orders = world.orders.filter((item) => item.id !== order.id);
  world.servedFlash = 1;
  addPopup(world, `+${earned} coins`, 'good');
  return EVENT_SERVED;
}

/** Advance the world by `dt` seconds. Returns an event bitmask. */
export function stepWorld(world, dt) {
  let events = EVENT_NONE;
  for (const popup of world.popups) popup.age += dt;
  world.popups = world.popups.filter((popup) => popup.age < 2.2);
  if (world.servedFlash > 0) world.servedFlash = Math.max(0, world.servedFlash - dt * 2);
  if (world.screen !== SCREEN_PLAY) return events;

  world.elapsed += dt;
  world.timeLeft = Math.max(0, SHIFT_SECONDS - world.elapsed);

  for (const slot of world.stations) {
    if (!slot.cooking) continue;
    const station = stationById(slot.id);
    slot.progress += dt / station.cookSeconds;
    if (slot.progress >= 1) {
      slot.ready = slot.cooking;
      slot.cooking = null;
      slot.progress = 0;
    }
  }

  world.spawnIn -= dt;
  if (world.spawnIn <= 0 && world.orders.length < MAX_ORDERS) {
    world.orders.push(makeOrder(world.rand, world.elapsed));
    world.spawnIn = spawnGap(world.elapsed);
  }

  for (const order of world.orders) order.left -= dt;
  const expired = world.orders.filter((order) => order.left <= 0);
  if (expired.length > 0) {
    world.orders = world.orders.filter((order) => order.left > 0);
    world.lost += expired.length;
    world.hearts = Math.max(0, world.hearts - expired.length);
    world.combo = 0;
    addPopup(world, 'Order walked out!', 'bad');
    events |= EVENT_LOST;
  }

  if (world.timeLeft <= 0 || world.hearts <= 0) {
    world.screen = SCREEN_OVER;
    events |= EVENT_OVER;
  }
  return events;
}

/** Fixed-step wrapper so the loop and the shot stager share one clock. */
export function stepFixed(world, dt) {
  let events = EVENT_NONE;
  let left = dt;
  while (left > 0) {
    const chunk = Math.min(left, STEP);
    events |= stepWorld(world, chunk);
    left -= chunk;
    if (world.screen !== SCREEN_PLAY) break;
  }
  return events;
}

/** The dish an order ticket shows, for rendering. */
export function dishOf(order) {
  return dishById(order.dish);
}

/** The station definition for a station slot, for rendering. */
export function stationOf(slot) {
  return stationById(slot.id);
}
