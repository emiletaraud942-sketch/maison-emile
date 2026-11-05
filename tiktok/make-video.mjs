#!/usr/bin/env node
// Fabrique une vidéo TikTok verticale (1080x1920, 30 i/s, MP4 H.264) à partir d'un brief JSON.
// Usage : node tiktok/make-video.mjs tiktok/briefs/<slug>.json
// Sortie : tiktok/out/<slug>/{video.mp4, cover.jpg, legende.txt}
//
// Le rendu passe par Chromium (Playwright) : chaque image est capturée puis envoyée à ffmpeg.
// L'horloge de la page est pilotée (page.clock) pour que les animations du site soient fluides
// et identiques d'un rendu à l'autre.

import { spawn, execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Playwright : installation locale si présente, sinon installation globale (npm i -g playwright).
let chromium;
try { ({ chromium } = await import('playwright')); }
catch { ({ chromium } = createRequire(execSync('npm root -g').toString().trim() + '/')('playwright')); }

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FPS = 30;
const W = 540, H = 960, SCALE = 2; // 1080x1920 en sortie

const briefPath = process.argv[2];
if (!briefPath) { console.error('Usage : node tiktok/make-video.mjs <brief.json>'); process.exit(1); }
const brief = JSON.parse(fs.readFileSync(briefPath, 'utf8'));
const slug = brief.slug || path.basename(briefPath, '.json');
const outDir = path.join(ROOT, 'tiktok', 'out', slug);
fs.mkdirSync(outDir, { recursive: true });

// --- Mini serveur statique (racine du repo) ---------------------------------
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  const p = path.normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  let f = path.join(ROOT, p);
  if (!f.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

// --- Habillage (charte Maison Émile : noir / crème, Caveat + Hanken Grotesk) ---
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Hanken+Grotesk:wght@500;700&display=swap');`;
const OVERLAY_CSS = `${FONTS}
#cookie,.cookie,[id*="cookie" i][class*="banner" i]{display:none!important}
#tt-cap{position:fixed;left:28px;right:64px;top:118px;z-index:2147483647;pointer-events:none;
  font:700 27px/1.18 'Hanken Grotesk',system-ui,sans-serif;color:#0c0b0a;text-align:center}
#tt-cap span{background:#f4f1ea;box-decoration-break:clone;-webkit-box-decoration-break:clone;padding:5px 12px;border-radius:8px;
  box-shadow:0 0 0 2px #0c0b0a}
#tt-tag{position:fixed;left:0;right:0;bottom:250px;text-align:center;z-index:2147483647;pointer-events:none;
  font:600 30px 'Caveat',cursive;color:#f4f1ea;text-shadow:0 2px 10px rgba(0,0,0,.7)}`;

function cardHTML(s) {
  const dark = (s.theme || 'black') === 'black';
  const bg = dark ? '#0c0b0a' : '#f4f1ea', fg = dark ? '#f4f1ea' : '#0c0b0a';
  const esc = t => String(t ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])).replace(/\n/g, '<br>');
  return `<!doctype html><meta charset="utf-8"><style>${FONTS}
  html,body{margin:0;height:100%;background:${bg};color:${fg};overflow:hidden}
  .wrap{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;padding:0 70px 120px 44px;box-sizing:border-box}
  .eyebrow{font:500 19px 'Hanken Grotesk',sans-serif;letter-spacing:.18em;text-transform:uppercase;opacity:.65;margin-bottom:18px}
  h1{font:700 ${s.size || 74}px/1.02 'Caveat',cursive;margin:0}
  p{font:500 25px/1.35 'Hanken Grotesk',sans-serif;margin:26px 0 0;opacity:.85}
  .line{height:3px;background:${fg};width:0;margin-top:34px}
  .sig{position:absolute;left:44px;bottom:270px;font:600 30px 'Caveat',cursive;opacity:.7}
  .el{opacity:0;transform:translateY(24px)}
  </style><div class="wrap"><div class="eyebrow el">${esc(s.eyebrow)}</div><h1 class="el">${esc(s.text)}</h1>
  ${s.sub ? `<p class="el">${esc(s.sub)}</p>` : ''}<div class="line"></div></div><div class="sig">Maison Émile · Rouen</div>
  <script>
  const ease=x=>1-Math.pow(1-Math.min(Math.max(x,0),1),3);
  window.__render=t=>{document.querySelectorAll('.el').forEach((e,i)=>{const p=ease((t-.12*i)/.55);
    e.style.opacity=p;e.style.transform='translateY('+(24*(1-p))+'px)';});
    document.querySelector('.line').style.width=(ease((t-.4)/.8)*160)+'px';};
  </script>`;
}

// --- ffmpeg -----------------------------------------------------------------
const videoPath = path.join(outDir, 'video.mp4');
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error',
  '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
  '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
  '-shortest', '-vf', 'scale=1080:1920:flags=lanczos,format=yuv420p',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-profile:v', 'high',
  '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', videoPath], { stdio: ['pipe', 'inherit', 'inherit'] });
const ffDone = new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg code ' + c))));
const write = buf => new Promise(r => ff.stdin.write(buf) ? r() : ff.stdin.once('drain', r));

// --- Rendu ------------------------------------------------------------------
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: SCALE, locale: 'fr-FR' });
let frameCount = 0, cover = null;

for (const [i, s] of brief.scenes.entries()) {
  const page = await ctx.newPage();
  const n = Math.round((s.duration || 3) * FPS);
  process.stdout.write(`Scène ${i + 1}/${brief.scenes.length} (${s.type}, ${n} images)… `);

  if (s.type === 'card') {
    await page.setContent(cardHTML(s), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    for (let f = 0; f < n; f++) {
      await page.evaluate(t => window.__render(t), f / FPS);
      const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
      if (!cover) cover = buf;
      await write(buf); frameCount++;
    }
  } else if (s.type === 'page') {
    await page.clock.install();
    await page.goto(BASE + (s.path || 'index.html'), { waitUntil: 'networkidle' });
    if (s.click) await page.click(s.click).catch(() => console.warn(`(clic impossible : ${s.click})`));
    await page.addStyleTag({ content: OVERLAY_CSS + (s.hide || []).map(h => `${h}{display:none!important}`).join('') });
    await page.evaluate(({ cap, tag }) => {
      if (cap) { const d = document.createElement('div'); d.id = 'tt-cap'; const sp = document.createElement('span'); sp.textContent = cap; d.append(sp); document.body.append(d); }
      if (tag) { const d = document.createElement('div'); d.id = 'tt-tag'; d.textContent = tag; document.body.append(d); }
    }, { cap: s.caption, tag: s.tag });
    const start = s.anchor ? await page.evaluate(sel => { const e = document.querySelector(sel); return e ? e.getBoundingClientRect().top + scrollY : 0; }, s.anchor) : 0;
    await page.evaluate(y => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, y); }, start);
    await page.evaluate(() => document.fonts.ready);
    await page.clock.runFor(400);
    for (let f = 0; f < n; f++) {
      const p = f / Math.max(n - 1, 1), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      if (s.scroll) await page.evaluate(y => scrollTo(0, y), start + e * s.scroll);
      await page.clock.runFor(1000 / FPS);
      const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
      if (!cover) cover = buf;
      await write(buf); frameCount++;
    }
  } else {
    throw new Error(`Type de scène inconnu : ${s.type}`);
  }
  console.log('ok');
  await page.close();
}

ff.stdin.end();
await ffDone;
await browser.close();
server.close();

if (cover) fs.writeFileSync(path.join(outDir, 'cover.jpg'), cover);
const legende = [brief.caption || '', '', (brief.hashtags || []).map(h => '#' + h.replace(/^#/, '')).join(' ')].join('\n').trim();
fs.writeFileSync(path.join(outDir, 'legende.txt'), legende + '\n');
console.log(`\n✔ ${frameCount} images · ${(frameCount / FPS).toFixed(1)} s → ${path.relative(ROOT, videoPath)}`);
