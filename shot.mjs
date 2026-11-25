// Screenshot driver for Sizzle & Serve: serves game/, drives headless
// Chrome over CDP, waits for the staged scene to paint, and saves a JPEG.
// Usage:
//   node shot.mjs <shot-name> <outfile.jpg>
//   node shot.mjs test          (loads the title screen, reports errors)
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const NODE = '/home/hatch/workspace/tools/node22/bin/node';
const CHROME = '/home/hatch/workspace/makefun/chrome/chrome-linux64/chrome';
const REPO = '/home/hatch/workspace/makefun/cooking-game-20261125';
const PORT = 8941;
const CDP_PORT = 9341;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(url, timeout = 20000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    try {
      const r = await fetch(url);
      if (r.ok) return true;
    } catch { /* retry */ }
    await sleep(300);
  }
  return false;
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.events = [];
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      } else if (msg.method) {
        this.events.push(msg);
      }
    };
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`timeout ${method}`));
        }
      }, 30000);
    });
  }

  async eval(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression, returnByValue: true, awaitPromise: true,
    });
    return result.result ? result.result.value : undefined;
  }
}

async function main() {
  const mode = process.argv[2];
  const outFile = process.argv[3];
  const shots = JSON.parse(
    (await import('node:fs')).readFileSync(`${REPO}/shots.json`, 'utf8'),
  );
  const shot = shots.find((item) => item.name === outFile?.split('/').pop());
  const query = mode === 'test' ? '' : (shot ? shot.query : `?shot=${mode}&seed=7`);

  const server = spawn(NODE, ['serve.ts', '--port', String(PORT)], { cwd: REPO, stdio: 'ignore' });
  const chrome = spawn(CHROME, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
    `--remote-debugging-port=${CDP_PORT}`, '--window-size=1280,800', 'about:blank',
  ], { stdio: 'ignore' });

  try {
    if (!await waitFor(`http://127.0.0.1:${PORT}/index.html`)) throw new Error('server did not start');
    if (!await waitFor(`http://127.0.0.1:${CDP_PORT}/json/version`)) throw new Error('chrome did not start');
    const targets = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
    const page = targets.find((t) => t.type === 'page');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });
    const cdp = new Cdp(ws);
    await cdp.send('Runtime.enable');
    await cdp.send('Page.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1280, height: 800, deviceScaleFactor: 1, mobile: false,
    });
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html${query}` });
    await sleep(2500);

    const errors = cdp.events.filter((e) =>
      e.method === 'Runtime.exceptionThrown'
      || (e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error'));
    const failedRequests = cdp.events.filter((e) =>
      e.method === 'Network.loadingFailed' || e.method === 'Network.responseReceived' && e.params.response.status >= 400);
    console.log(`console errors: ${errors.length}, failed requests: ${failedRequests.length}`);
    for (const e of errors.slice(0, 5)) console.log(JSON.stringify(e.params).slice(0, 300));

    if (mode !== 'test') {
      const shotResult = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 82 });
      writeFileSync(outFile, Buffer.from(shotResult.data, 'base64'));
      console.log(`wrote ${outFile}`);
    } else {
      const state = await cdp.eval(`document.title + ' | canvas=' + !!document.getElementById('game')`);
      console.log(`page: ${state}`);
    }
    ws.close();
  } finally {
    chrome.kill();
    server.kill();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
