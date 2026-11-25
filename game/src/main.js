// Sizzle & Serve — boot and game loop.
// One file, one job: wire the canvas, the input and the world together,
// run the clock, and stage screenshot scenes from the URL (?shot=cover
// and friends) so the screenshots are real renders of the real rules.

import { CANVAS, STEP } from './config.js';
import { clickAt, keyAction } from './input.js';
import { render } from './render.js';
import { isMuted, playBuzz, playDing, playFanfare, playPop, playSizzle, toggleMute } from './sound.js';
import { stageShot } from './shots.js';
import {
  EVENT_LOST, EVENT_OVER, EVENT_SERVED, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE,
  clearPlate, createWorld, pressServe, pressStation, startShift, stepFixed,
} from './world.js';

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '7') || 7;

const canvas = document.getElementById('game');
canvas.width = CANVAS.width;
canvas.height = CANVAS.height;
const ctx = canvas.getContext('2d');

const status = document.getElementById('status');
const muteButton = document.getElementById('mute');

let world;
let paused = false;
let lastTime = 0;

if (shotName) {
  const staged = stageShot(shotName, seed);
  world = staged.world;
  world.screen = staged.screen;
  render(ctx, world, false);
  document.title = `Sizzle & Serve — ${shotName}`;
  if (status) status.textContent = `Shot staged: ${shotName} (seed ${seed})`;
} else {
  world = createWorld(seed);
  render(ctx, world, false);
}

function handleAction(action) {
  if (!action) return;
  if (action.kind === 'mute') {
    toggleMute();
    if (muteButton) muteButton.textContent = isMuted() ? 'Sound: off' : 'Sound: on';
    return;
  }
  if (action.kind === 'pause') {
    if (world.screen === SCREEN_PLAY) paused = !paused;
    return;
  }
  if (action.kind === 'restart') {
    world = createWorld(seed);
    startShift(world);
    paused = false;
    render(ctx, world, false);
    return;
  }
  if (action.kind === 'start') {
    if (world.screen === SCREEN_TITLE) {
      startShift(world);
      paused = false;
    }
    return;
  }
  if (world.screen !== SCREEN_PLAY || paused) return;
  if (action.kind === 'station') {
    const before = world.stations.find((slot) => slot.id === action.id);
    pressStation(world, action.id);
    const after = world.stations.find((slot) => slot.id === action.id);
    if (before && !before.cooking && after.cooking) playSizzle();
    if (before && before.ready && !after.ready) playPop();
  } else if (action.kind === 'serve') {
    const events = pressServe(world);
    if (events & EVENT_SERVED) playDing();
  } else if (action.kind === 'clear') {
    clearPlate(world);
  }
}

canvas.addEventListener('click', (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * (CANVAS.width / rect.width);
  const y = (event.clientY - rect.top) * (CANVAS.height / rect.height);
  handleAction(clickAt(x, y));
});

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space') event.preventDefault();
  handleAction(keyAction(event.code, event.key));
});

if (muteButton) {
  muteButton.addEventListener('click', () => handleAction({ kind: 'mute' }));
}

function frame(time) {
  if (!shotName) {
    const dt = Math.min(0.1, (time - lastTime) / 1000 || 0);
    lastTime = time;
    if (!paused && world.screen === SCREEN_PLAY) {
      const events = stepFixed(world, dt);
      if (events & EVENT_SERVED) playDing();
      if (events & EVENT_LOST) playBuzz();
      if (events & EVENT_OVER) playFanfare();
    }
    render(ctx, world, paused);
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
