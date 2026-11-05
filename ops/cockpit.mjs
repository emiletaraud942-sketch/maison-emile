#!/usr/bin/env node
// Cockpit Maison Émile — serveur local (aucune dépendance).
// Usage : node ops/cockpit.mjs   →   http://localhost:4949
// Diffuse en direct (SSE) le journal écrit par le hook .claude/hooks/ops-event.mjs
// pendant que tu travailles avec Claude Code dans ce repo.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 4949);
const LOG = path.join(ROOT, '.claude', 'ops', 'events.jsonl');

function agents() {
  const dir = path.join(ROOT, '.claude', 'agents');
  return fs.readdirSync(dir).filter(f => f.endsWith('.md')).map(f => {
    const txt = fs.readFileSync(path.join(dir, f), 'utf8');
    const fm = (txt.match(/^---\n([\s\S]*?)\n---/) || [])[1] || '';
    const get = k => ((fm.match(new RegExp('^' + k + ':\\s*(.*)$', 'm')) || [])[1] || '').trim();
    return { id: get('name') || f.replace('.md', ''), description: get('description'), tools: get('tools') };
  });
}

function studio() {
  const list = (d, ext) => fs.existsSync(d) ? fs.readdirSync(d).filter(f => !ext || f.endsWith(ext)) : [];
  const out = path.join(ROOT, 'tiktok', 'out');
  return {
    briefs: list(path.join(ROOT, 'tiktok', 'briefs'), '.json').map(f => f.replace('.json', '')),
    videos: list(out).filter(s => fs.existsSync(path.join(out, s, 'video.mp4'))).map(s => ({
      slug: s, pret: fs.existsSync(path.join(out, s, 'PUBLIER.md')),
      mo: +(fs.statSync(path.join(out, s, 'video.mp4')).size / 1048576).toFixed(1),
    })),
  };
}

function readFrom(pos) {
  if (!fs.existsSync(LOG)) return { pos: 0, lines: [] };
  const size = fs.statSync(LOG).size;
  if (size < pos) pos = 0; // fichier tourné
  if (size === pos) return { pos, lines: [] };
  const fd = fs.openSync(LOG, 'r');
  const buf = Buffer.alloc(size - pos);
  fs.readSync(fd, buf, 0, buf.length, pos);
  fs.closeSync(fd);
  const txt = buf.toString('utf8');
  const end = txt.lastIndexOf('\n') + 1; // on n'envoie que des lignes complètes
  return { pos: pos + Buffer.byteLength(txt.slice(0, end)), lines: txt.slice(0, end).split('\n').filter(Boolean) };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/' || url.pathname === '/index.html') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    fs.createReadStream(path.join(ROOT, 'ops', 'cockpit.html')).pipe(res);
  } else if (url.pathname === '/api/agents') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ agents: agents(), studio: studio() }));
  } else if (url.pathname === '/api/events') {
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
    // Rejoue les 300 derniers événements, puis suit le fichier.
    let { pos, lines } = readFrom(0);
    res.write(`event: replay\ndata: ${JSON.stringify(lines.slice(-300).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean))}\n\n`);
    const tick = setInterval(() => {
      const r = readFrom(pos); pos = r.pos;
      for (const l of r.lines) res.write(`data: ${l}\n\n`);
      if (r.lines.some(l => /"tool":"(Write|Bash)"/.test(l))) res.write(`event: studio\ndata: ${JSON.stringify(studio())}\n\n`);
    }, 250);
    const ping = setInterval(() => res.write(': ping\n\n'), 15000);
    req.on('close', () => { clearInterval(tick); clearInterval(ping); });
  } else {
    res.writeHead(404).end();
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  ◉ Cockpit Maison Émile → http://localhost:${PORT}\n  Travaille avec Claude Code dans ce dossier : les agents s'allument en direct.\n`);
});
