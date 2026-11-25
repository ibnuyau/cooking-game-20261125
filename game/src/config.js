// Sizzle & Serve — kitchen configuration.
// One file, one job: every number and name the rest of the game reads.

export const CANVAS = { width: 1280, height: 720 };

export const SHIFT_SECONDS = 120;
export const MAX_HEARTS = 3;
export const MAX_ORDERS = 4;
export const PLATE_SLOTS = 3;

// Stations, left to right across the counter. Each station cooks one
// ingredient; `cookSeconds` is how long it takes, `key` is its shortcut.
export const STATIONS = [
  { id: 'grill', name: 'Grill', item: 'patty', label: 'Patty', key: '1', cookSeconds: 4, color: '#c65d3b' },
  { id: 'fryer', name: 'Fryer', item: 'fries', label: 'Fries', key: '2', cookSeconds: 3, color: '#e0a030' },
  { id: 'salad', name: 'Salad Bar', item: 'salad', label: 'Salad', key: '3', cookSeconds: 2, color: '#5da24a' },
  { id: 'pasta', name: 'Pasta Pot', item: 'pasta', label: 'Pasta', key: '4', cookSeconds: 5, color: '#d97b2f' },
];

// Dishes: an order is one dish; `needs` lists the ingredients on the plate
// that complete it, in any order. `coins` is the base pay, `tip` the most
// extra a fast serve can add.
export const DISHES = [
  { id: 'fries', name: 'Crispy Fries', needs: ['fries'], coins: 8, tip: 4 },
  { id: 'salad', name: 'Garden Salad', needs: ['salad'], coins: 9, tip: 4 },
  { id: 'pasta', name: 'Pasta Marinara', needs: ['pasta'], coins: 12, tip: 6 },
  { id: 'burger', name: 'Sizzle Burger', needs: ['patty', 'salad'], coins: 16, tip: 8 },
  { id: 'combo', name: 'Burger Combo', needs: ['patty', 'fries'], coins: 18, tip: 9 },
  { id: 'feast', name: 'Chef Feast', needs: ['patty', 'fries', 'salad'], coins: 26, tip: 13 },
];

// Order pacing: seconds between new orders at the start and at the end of
// the shift, and how long an order waits before it walks out.
export const SPAWN_START = 11;
export const SPAWN_END = 5.5;
export const PATIENCE_START = 32;
export const PATIENCE_END = 19;

// Palette for the whole kitchen, so the look stays consistent.
export const COLORS = {
  wall: '#f7e8d0',
  wallTrim: '#e8cfa8',
  floor: '#b98a5a',
  counter: '#8a5a33',
  counterTop: '#a9743f',
  board: '#3b2d20',
  boardPaper: '#fff8e7',
  plate: '#f4f4f0',
  ink: '#2e2118',
  muted: '#7a6a58',
  gold: '#f2b234',
  green: '#4caf50',
  amber: '#ff9800',
  red: '#e53935',
  heart: '#e53935',
};

export const STEP = 1 / 60;
