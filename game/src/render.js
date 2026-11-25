// Sizzle & Serve — rendering: everything the player sees.
// One file, one job: draw the kitchen on a canvas. No rules live here;
// it only reads the world and paints it, and it tells input.js where the
// buttons landed so clicks hit the right thing.

import { CANVAS, COLORS, DISHES, SHIFT_SECONDS, STATIONS } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, dishOf, matchingOrder, stationOf } from './world.js';
import { setRegions } from './input.js';

const W = CANVAS.width;
const H = CANVAS.height;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight, align) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 'bold'} ${size}px Trebuchet MS, Verdana, sans-serif`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

/** Draw one ingredient or dish at (x, y), fitting in `size` pixels. */
export function drawFood(ctx, item, x, y, size) {
  const s = size;
  ctx.save();
  ctx.translate(x, y);
  if (item === 'patty') {
    roundRect(ctx, -s * 0.42, -s * 0.16, s * 0.84, s * 0.32, s * 0.14);
    ctx.fillStyle = '#7a4a21';
    ctx.fill();
    ctx.strokeStyle = '#5d3413';
    ctx.lineWidth = Math.max(1, s * 0.03);
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-s * 0.3, i * s * 0.09);
      ctx.lineTo(s * 0.3, i * s * 0.09);
      ctx.stroke();
    }
  } else if (item === 'fries') {
    ctx.fillStyle = '#f7c948';
    for (let i = -2; i <= 2; i += 1) {
      const stickX = i * s * 0.13;
      const stickH = s * (0.42 - Math.abs(i) * 0.04);
      ctx.fillRect(stickX - s * 0.045, -s * 0.28 - stickH / 2 + s * 0.1, s * 0.09, stickH);
    }
    ctx.fillStyle = '#d32f2f';
    ctx.beginPath();
    ctx.moveTo(-s * 0.34, -s * 0.05);
    ctx.lineTo(s * 0.34, -s * 0.05);
    ctx.lineTo(s * 0.26, s * 0.34);
    ctx.lineTo(-s * 0.26, s * 0.34);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, s * 0.14, s * 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (item === 'salad') {
    ctx.fillStyle = '#3e8e41';
    ctx.beginPath();
    ctx.arc(-s * 0.16, -s * 0.1, s * 0.16, 0, Math.PI * 2);
    ctx.arc(s * 0.14, -s * 0.16, s * 0.17, 0, Math.PI * 2);
    ctx.arc(0, s * 0.02, s * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e53935';
    ctx.beginPath();
    ctx.arc(-s * 0.2, -s * 0.02, s * 0.07, 0, Math.PI * 2);
    ctx.arc(s * 0.2, s * 0.06, s * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath();
    ctx.moveTo(-s * 0.4, s * 0.1);
    ctx.quadraticCurveTo(0, s * 0.48, s * 0.4, s * 0.1);
    ctx.lineTo(s * 0.34, s * 0.02);
    ctx.lineTo(-s * 0.34, s * 0.02);
    ctx.closePath();
    ctx.fill();
  } else if (item === 'pasta') {
    ctx.strokeStyle = '#e8a33d';
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i += 1) {
      ctx.lineWidth = Math.max(2, s * 0.06);
      ctx.beginPath();
      ctx.arc(0, s * 0.02, s * (0.12 + i * 0.09), Math.PI * (0.15 + i * 0.2), Math.PI * (1.25 + i * 0.15));
      ctx.stroke();
    }
    ctx.fillStyle = '#c62828';
    ctx.beginPath();
    ctx.arc(-s * 0.18, -s * 0.14, s * 0.07, 0, Math.PI * 2);
    ctx.arc(s * 0.16, -s * 0.05, s * 0.06, 0, Math.PI * 2);
    ctx.arc(0, -s * 0.2, s * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath();
    ctx.arc(s * 0.05, -s * 0.24, s * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** A dish's picture is its first ingredient, drawn bigger and stacked. */
function drawDish(ctx, dishId, x, y, size) {
  const dish = DISHES.find((item) => item.id === dishId);
  if (!dish) return;
  if (dishId === 'burger') {
    ctx.save();
    ctx.translate(x, y);
    const s = size;
    ctx.fillStyle = '#e8a33d';
    ctx.beginPath();
    ctx.arc(0, -s * 0.22, s * 0.34, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-s * 0.34, -s * 0.22, s * 0.68, s * 0.08);
    ctx.fillStyle = '#5da24a';
    roundRect(ctx, -s * 0.36, -s * 0.14, s * 0.72, s * 0.1, s * 0.05);
    ctx.fill();
    ctx.fillStyle = '#7a4a21';
    roundRect(ctx, -s * 0.34, -s * 0.04, s * 0.68, s * 0.16, s * 0.07);
    ctx.fill();
    ctx.fillStyle = '#e8a33d';
    roundRect(ctx, -s * 0.34, s * 0.12, s * 0.68, s * 0.12, s * 0.06);
    ctx.fill();
    ctx.restore();
    return;
  }
  if (dishId === 'combo') {
    drawFood(ctx, 'patty', x - size * 0.28, y, size * 0.72);
    drawFood(ctx, 'fries', x + size * 0.3, y, size * 0.72);
    return;
  }
  if (dishId === 'feast') {
    drawFood(ctx, 'patty', x - size * 0.32, y - size * 0.1, size * 0.6);
    drawFood(ctx, 'fries', x + size * 0.3, y - size * 0.08, size * 0.6);
    drawFood(ctx, 'salad', x, y + size * 0.3, size * 0.55);
    return;
  }
  drawFood(ctx, dish.needs[0], x, y, size);
}

function drawBoard(ctx, world) {
  ctx.fillStyle = COLORS.board;
  ctx.fillRect(0, 0, W, 104);
  ctx.fillStyle = COLORS.boardPaper;
  ctx.fillRect(16, 10, 150, 84);
  roundRect(ctx, 16, 10, 150, 84, 8);
  ctx.fill();
  text(ctx, 'ORDERS', 91, 34, 20, COLORS.ink, 'bold', 'center');
  text(ctx, 'Sizzle & Serve', 91, 62, 14, COLORS.muted, 'bold', 'center');
  text(ctx, 'Dapur Kilat', 91, 82, 12, COLORS.muted, 'normal', 'center');

  const slotW = 236;
  for (let i = 0; i < 4; i += 1) {
    const x = 182 + i * (slotW + 10);
    const order = world.orders[i];
    ctx.fillStyle = order ? '#fffdf6' : 'rgba(255,255,255,0.08)';
    roundRect(ctx, x, 10, slotW, 84, 8);
    ctx.fill();
    if (!order) {
      text(ctx, '— waiting —', x + slotW / 2, 52, 14, 'rgba(255,255,255,0.45)', 'normal', 'center');
      continue;
    }
    const dish = dishOf(order);
    drawDish(ctx, order.dish, x + 42, 44, 62);
    text(ctx, dish.name, x + 82, 30, 16, COLORS.ink);
    text(ctx, `${dish.coins} coins`, x + 82, 52, 13, COLORS.muted);
    const ratio = Math.max(0, order.left / order.patience);
    const barColor = ratio > 0.5 ? COLORS.green : ratio > 0.25 ? COLORS.amber : COLORS.red;
    ctx.fillStyle = '#e0d5c1';
    roundRect(ctx, x + 82, 66, 140, 10, 5);
    ctx.fill();
    ctx.fillStyle = barColor;
    roundRect(ctx, x + 82, 66, Math.max(8, 140 * ratio), 10, 5);
    ctx.fill();
    text(ctx, `${Math.ceil(order.left)}s`, x + slotW - 12, 52, 13, ratio > 0.25 ? COLORS.muted : COLORS.red, 'bold', 'right');
  }

  if (world.message && world.elapsed - world.messageAt < 2.5) {
    text(ctx, world.message, W - 24, 118, 15, COLORS.red, 'bold', 'right');
  }
}

function drawStations(ctx, world) {
  const top = 128;
  const height = 250;
  const gap = 16;
  const width = (W - 32 - gap * 3) / 4;
  const boxes = [];
  world.stations.forEach((slot, i) => {
    const station = stationOf(slot);
    const x = 16 + i * (width + gap);
    const y = top;
    ctx.fillStyle = COLORS.counter;
    roundRect(ctx, x, y, width, height, 14);
    ctx.fill();
    ctx.fillStyle = COLORS.counterTop;
    roundRect(ctx, x, y, width, 54, 14);
    ctx.fill();
    ctx.fillRect(x, y + 40, width, 14);
    text(ctx, station.name, x + width / 2, y + 28, 20, '#fff', 'bold', 'center');
    text(ctx, `press ${station.key}`, x + width / 2, y + 76, 13, 'rgba(255,255,255,0.75)', 'normal', 'center');

    const cx = x + width / 2;
    const cy = y + 158;
    if (slot.ready) {
      const bounce = Math.sin(Date.now() / 180) * 4;
      drawFood(ctx, slot.ready, cx, cy + bounce, 110);
      ctx.fillStyle = COLORS.gold;
      roundRect(ctx, cx - 62, y + 212, 124, 26, 13);
      ctx.fill();
      text(ctx, 'READY — take it!', cx, y + 225, 14, COLORS.ink, 'bold', 'center');
    } else if (slot.cooking) {
      drawFood(ctx, slot.cooking, cx, cy, 110);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      roundRect(ctx, cx - 70, y + 206, 140, 14, 7);
      ctx.fill();
      ctx.fillStyle = COLORS.gold;
      roundRect(ctx, cx - 70, y + 206, Math.max(10, 140 * slot.progress), 14, 7);
      ctx.fill();
      text(ctx, 'cooking…', cx, y + 236, 13, '#fff', 'normal', 'center');
    } else {
      ctx.globalAlpha = 0.55;
      drawFood(ctx, station.item, cx, cy, 110);
      ctx.globalAlpha = 1;
      text(ctx, station.label, cx, y + 226, 15, 'rgba(255,255,255,0.85)', 'normal', 'center');
    }
    boxes.push({ id: station.id, x, y, width, height });
  });
  return boxes;
}

function drawPlateAndServe(ctx, world) {
  const y = 402;
  const match = matchingOrder(world);
  ctx.fillStyle = COLORS.counter;
  roundRect(ctx, 16, y, 560, 148, 14);
  ctx.fill();
  text(ctx, 'PLATE', 46, y + 28, 16, '#fff', 'bold');

  const plateX = 296;
  const plateY = y + 74;
  ctx.fillStyle = COLORS.plate;
  ctx.beginPath();
  ctx.ellipse(plateX, plateY, 150, 52, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d8d8d0';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(plateX, plateY, 108, 34, 0, 0, Math.PI * 2);
  ctx.stroke();
  world.plate.forEach((item, i) => {
    drawFood(ctx, item, plateX - 90 + i * 90, plateY - 6, 74);
  });
  if (world.plate.length === 0) {
    text(ctx, 'empty plate', plateX, plateY, 14, COLORS.muted, 'normal', 'center');
  }

  const serveBox = { x: 600, y: y + 18, width: 240, height: 112 };
  const canServe = !!match;
  ctx.fillStyle = canServe ? COLORS.green : '#9e9e9e';
  roundRect(ctx, serveBox.x, serveBox.y, serveBox.width, serveBox.height, 16);
  ctx.fill();
  if (canServe) {
    const pulse = 1 + Math.sin(Date.now() / 200) * 0.03;
    ctx.save();
    ctx.translate(serveBox.x + serveBox.width / 2, serveBox.y + serveBox.height / 2);
    ctx.scale(pulse, pulse);
    text(ctx, 'SERVE!', 0, -12, 30, '#fff', 'bold', 'center');
    text(ctx, dishOf(match).name, 0, 22, 16, '#fff', 'normal', 'center');
    ctx.restore();
  } else {
    text(ctx, 'SERVE', serveBox.x + serveBox.width / 2, serveBox.y + 40, 26, '#fff', 'bold', 'center');
    text(ctx, 'Space', serveBox.x + serveBox.width / 2, serveBox.y + 78, 14, 'rgba(255,255,255,0.8)', 'normal', 'center');
  }

  const infoX = 872;
  text(ctx, 'SHIFT', infoX, y + 30, 14, COLORS.muted, 'bold');
  const mins = Math.floor(world.timeLeft / 60);
  const secs = Math.ceil(world.timeLeft % 60);
  text(ctx, `${mins}:${String(secs).padStart(2, '0')}`, infoX, y + 62, 34, world.timeLeft <= 20 ? COLORS.red : COLORS.ink, 'bold');
  ctx.fillStyle = '#e0d5c1';
  roundRect(ctx, infoX, y + 86, 240, 10, 5);
  ctx.fill();
  ctx.fillStyle = world.timeLeft <= 20 ? COLORS.red : COLORS.green;
  roundRect(ctx, infoX, y + 86, Math.max(6, 240 * (world.timeLeft / SHIFT_SECONDS)), 10, 5);
  ctx.fill();
  text(ctx, `Served: ${world.served}   Lost: ${world.lost}`, infoX, y + 122, 15, COLORS.ink);

  return { plate: { x: 16, y, width: 560, height: 148 }, serve: serveBox };
}

function drawHud(ctx, world) {
  const y = 566;
  ctx.fillStyle = COLORS.wallTrim;
  ctx.fillRect(0, y, W, H - y);
  text(ctx, `COINS  ${world.coins}`, 24, y + 38, 30, COLORS.ink, 'bold');
  text(ctx, '♥'.repeat(Math.max(0, world.hearts)) + '♡'.repeat(Math.max(0, 3 - world.hearts)), 300, y + 38, 28, COLORS.heart);
  if (world.combo > 1) {
    text(ctx, `COMBO x${world.combo}`, 470, y + 38, 24, '#b26a00', 'bold');
  }
  text(ctx, '1-4 cook • Space serve • C clear plate • P pause • M sound', W - 24, y + 38, 15, COLORS.muted, 'normal', 'right');
  text(ctx, 'Sizzle & Serve — an original kitchen rush', W - 24, y + 84, 13, COLORS.muted, 'normal', 'right');

  world.popups.forEach((popup, i) => {
    const alpha = Math.max(0, 1 - popup.age / 2.2);
    ctx.globalAlpha = alpha;
    const color = popup.kind === 'good' ? COLORS.green : popup.kind === 'combo' ? '#b26a00' : COLORS.red;
    text(ctx, popup.text, W / 2, 668 - i * 30 - popup.age * 26, 24, color, 'bold', 'center');
    ctx.globalAlpha = 1;
  });
}

function drawKitchen(ctx, world) {
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 566, W, 6);
  if (world.servedFlash > 0) {
    ctx.fillStyle = `rgba(76, 175, 80, ${world.servedFlash * 0.18})`;
    ctx.fillRect(0, 0, W, H);
  }
  drawBoard(ctx, world);
  const stationBoxes = drawStations(ctx, world);
  const { plate, serve } = drawPlateAndServe(ctx, world);
  drawHud(ctx, world);
  setRegions({ stations: stationBoxes, plate, serve, start: null, restart: null });
}

function drawTitle(ctx, world) {
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = COLORS.board;
  roundRect(ctx, 190, 90, 900, 300, 20);
  ctx.fill();
  text(ctx, 'SIZZLE & SERVE', 640, 170, 64, '#ffd54f', 'bold', 'center');
  text(ctx, 'Dapur Kilat — a one-chef kitchen rush', 640, 228, 24, '#fff', 'normal', 'center');
  text(ctx, 'Orders fly in. Cook at the stations, build the dish on the', 640, 282, 19, 'rgba(255,255,255,0.85)', 'normal', 'center');
  text(ctx, 'plate, and serve it before the customer walks out!', 640, 310, 19, 'rgba(255,255,255,0.85)', 'normal', 'center');
  text(ctx, 'Keys 1-4 cook • Space serves • C clears the plate', 640, 352, 18, COLORS.gold, 'bold', 'center');

  drawFood(ctx, 'patty', 420, 470, 120);
  drawFood(ctx, 'fries', 560, 470, 120);
  drawFood(ctx, 'salad', 700, 470, 120);
  drawFood(ctx, 'pasta', 840, 470, 120);

  const startBox = { x: 490, y: 560, width: 300, height: 76 };
  ctx.fillStyle = COLORS.green;
  roundRect(ctx, startBox.x, startBox.y, startBox.width, startBox.height, 16);
  ctx.fill();
  text(ctx, 'START SHIFT  ▶', 640, 598, 28, '#fff', 'bold', 'center');
  text(ctx, '120 seconds • 3 hearts • serve fast for tips', 640, 678, 15, COLORS.muted, 'normal', 'center');
  setRegions({ stations: [], plate: null, serve: null, start: startBox, restart: null });
}

function drawOver(ctx, world) {
  drawKitchen(ctx, world);
  ctx.fillStyle = 'rgba(30, 20, 12, 0.72)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = COLORS.boardPaper;
  roundRect(ctx, 340, 150, 600, 380, 20);
  ctx.fill();
  text(ctx, world.hearts <= 0 ? 'KITCHEN CLOSED!' : 'SHIFT OVER!', 640, 210, 44, COLORS.ink, 'bold', 'center');
  text(ctx, `You earned ${world.coins} coins`, 640, 272, 26, COLORS.ink, 'bold', 'center');
  text(ctx, `Dishes served: ${world.served}    Orders lost: ${world.lost}`, 640, 316, 19, COLORS.muted, 'normal', 'center');
  text(ctx, `Best combo: x${Math.max(1, world.bestCombo)}`, 640, 350, 19, COLORS.muted, 'normal', 'center');
  const verdict = world.coins >= 150 ? 'Head Chef material!' : world.coins >= 90 ? 'Solid service!' : world.coins >= 40 ? 'The rush got you — again?' : 'Every chef starts somewhere.';
  text(ctx, verdict, 640, 396, 20, '#b26a00', 'bold', 'center');
  const restartBox = { x: 490, y: 430, width: 300, height: 64 };
  ctx.fillStyle = COLORS.green;
  roundRect(ctx, restartBox.x, restartBox.y, restartBox.width, restartBox.height, 14);
  ctx.fill();
  text(ctx, 'PLAY AGAIN  (R)', 640, 462, 24, '#fff', 'bold', 'center');
  setRegions({ stations: [], plate: null, serve: null, start: null, restart: restartBox });
}

/** Paint one frame of `world` on `ctx`. */
export function render(ctx, world, paused) {
  ctx.clearRect(0, 0, W, H);
  if (world.screen === SCREEN_TITLE) {
    drawTitle(ctx, world);
    return;
  }
  if (world.screen === SCREEN_OVER) {
    drawOver(ctx, world);
    return;
  }
  drawKitchen(ctx, world);
  if (paused) {
    ctx.fillStyle = 'rgba(30, 20, 12, 0.6)';
    ctx.fillRect(0, 0, W, H);
    text(ctx, 'PAUSED — press P to keep cooking', W / 2, H / 2, 32, '#fff', 'bold', 'center');
  }
}
