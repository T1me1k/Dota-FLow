import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const projectRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const port = Number(process.env.PORT ?? 4173);

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

function safePath(urlPath) {
  const requested = urlPath === '/'
    ? '/apps/mock-dashboard/public/index.html'
    : urlPath === '/diagnostics' || urlPath === '/diagnostics/'
      ? '/apps/diagnostics-viewer/public/index.html'
      : urlPath === '/live' || urlPath === '/live/'
        ? '/apps/live-monitor/public/index.html'
        : urlPath === '/overlay' || urlPath === '/overlay/'
          ? '/apps/decision-overlay/public/index.html'
          : urlPath === '/validation' || urlPath === '/validation/'
            ? '/apps/match-validator/public/index.html'
            : urlPath === '/coach' || urlPath === '/coach/'
              ? '/apps/coach-center/public/index.html'
              : urlPath;
  const path = normalize(join(projectRoot, requested));
  if (!path.startsWith(projectRoot)) throw new Error('Invalid path');
  return path;
}

const server = createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
    const path = safePath(pathname);
    const info = await stat(path);
    const finalPath = info.isDirectory() ? join(path, 'index.html') : path;
    const body = await readFile(finalPath);
    res.writeHead(200, {
      'Content-Type': mime[extname(finalPath)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(body);
  } catch (error) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Not found\n${error.message}`);
  }
});

server.listen(port, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${port}`;
  console.log(`Dota Flow mock dashboard: ${url}`);
  if (process.argv.includes('--open')) {
    const command = process.platform === 'win32' ? 'cmd' : process.platform === 'darwin' ? 'open' : 'xdg-open';
    const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
    spawn(command, args, { detached: true, stdio: 'ignore' }).unref();
  }
});
