





const { spawn, execSync } = require('child_process');
const http = require('http');

const S = String.fromCharCode(47); 
const PING_PORT = 3456;
const SILENCE_LIMIT = 12000;
const WATCHDOG_TICK = 2000;
const MAX_LISTEN_RETRY = 15;

let lastPing = 0;
let stopping = false;
let listenRetry = 0;

const pingServer = http.createServer((req, res) => {
  if (req.url && req.url.indexOf(S + '__ping__') === 0) {
    lastPing = Date.now();
    res.statusCode = 204;
    res.end();
  } else {
    res.statusCode = 404;
    res.end();
  }
});

pingServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE' && listenRetry < MAX_LISTEN_RETRY) {
    listenRetry += 1;
    setTimeout(listen, 2000);
  } else {
    console.error('[TexLoom] heartbeat port ' + PING_PORT + ' unavailable:', err.message);
    stop(1);
  }
});

function listen() {
  pingServer.listen(PING_PORT, '127.0.0.1');
}

function killTree(pid) {
  try {
    execSync('taskkill ' + S + 'PID ' + pid + ' ' + S + 'T ' + S + 'F', { stdio: 'ignore' });
  } catch (_) {}
}

let watchdog = null;

function stop(code) {
  if (stopping) return;
  stopping = true;
  if (watchdog) clearInterval(watchdog);
  try {
    killTree(child.pid);
  } catch (_) {}
  try {
    pingServer.close();
  } catch (_) {}
  setTimeout(() => process.exit(code), 300);
}

const child = spawn('cmd.exe', [S + 'c', 'npm run dev -- --port 3210 --strictPort'], {
  stdio: 'inherit',
  cwd: __dirname,
});

child.on('exit', (code) => {
  console.log('');
  console.log('[TexLoom] dev server exited, launcher shutting down.');
  stop(code || 0);
});

watchdog = setInterval(() => {
  if (lastPing && Date.now() - lastPing > SILENCE_LIMIT) {
    console.log('[TexLoom] browser closed (heartbeat lost), stopping server...');
    stop(0);
  }
}, WATCHDOG_TICK);

listen();
console.log('[TexLoom] launcher ready, heartbeat port ' + PING_PORT + '.');
