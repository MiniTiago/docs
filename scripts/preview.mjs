import http from 'node:http';
import path from 'node:path';
import { readFile, stat } from 'node:fs/promises';
import { root } from './context.mjs';
const dist = path.join(root, 'dist');
const port = Number(process.env.PORT || 4173);
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.woff2':'font/woff2', '.xml':'application/xml', '.txt':'text/plain' };
const server = http.createServer(async (req, res) => {
  try {
    const manifest = JSON.parse(await readFile(path.join(dist, 'build-manifest.json'), 'utf8'));
    const base = new URL(manifest.siteUrl).pathname;
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!pathname.startsWith(base)) { res.writeHead(404); res.end('Not found'); return; }
    let file = path.resolve(dist, pathname.slice(base.length));
    if (file !== dist && !file.startsWith(dist + path.sep)) { res.writeHead(404); res.end('Not found'); return; }
    if ((await stat(file)).isDirectory()) {
      if (!pathname.endsWith('/')) { res.writeHead(301, { Location: pathname + '/' }); res.end(); return; }
      file = path.join(file, 'index.html');
    }
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type':types[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store', 'X-Robots-Tag':'noindex, nofollow' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    res.writeHead(404, { 'Content-Type':'text/html; charset=utf-8' });
    res.end(await readFile(path.join(dist, '404.html')).catch(() => 'Build the docs first.'));
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Local docs preview: http://localhost:${port}/`));
