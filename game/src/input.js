// Sizzle & Serve — input: mouse and keyboard.
// One file, one job: turn a click or a key press into a named action the
// game loop understands. No game rules live here, only hit-testing.

import { STATIONS } from './config.js';

/** The clickable regions the renderer lays out; main.js keeps them current. */
export const regions = {
  stations: [],
  plate: null,
  serve: null,
  start: null,
  restart: null,
};

/** Remember where the renderer put each button this frame. */
export function setRegions(next) {
  regions.stations = next.stations || [];
  regions.plate = next.plate || null;
  regions.serve = next.serve || null;
  regions.start = next.start || null;
  regions.restart = next.restart || null;
}

function inside(x, y, box) {
  return box && x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
}

/**
 * What a click at canvas coordinates (x, y) means, or null when it hit
 * nothing clickable. Returns { kind: 'station', id } or
 * { kind: 'serve' | 'plate' | 'start' | 'restart' }.
 */
export function clickAt(x, y) {
  for (const station of regions.stations) {
    if (inside(x, y, station)) return { kind: 'station', id: station.id };
  }
  if (inside(x, y, regions.plate)) return { kind: 'plate' };
  if (inside(x, y, regions.serve)) return { kind: 'serve' };
  if (inside(x, y, regions.start)) return { kind: 'start' };
  if (inside(x, y, regions.restart)) return { kind: 'restart' };
  return null;
}

/**
 * What a key press means, or null. Station keys 1-4 cook or pick up,
 * Space serves, C clears the plate, P pauses, R restarts, M mutes.
 */
export function keyAction(code, key) {
  const station = STATIONS.find((item) => item.key === key);
  if (station) return { kind: 'station', id: station.id };
  if (code === 'Space') return { kind: 'serve' };
  if (key === 'c' || key === 'C') return { kind: 'clear' };
  if (key === 'p' || key === 'P') return { kind: 'pause' };
  if (key === 'r' || key === 'R') return { kind: 'restart' };
  if (key === 'm' || key === 'M') return { kind: 'mute' };
  if (code === 'Enter') return { kind: 'start' };
  return null;
}
