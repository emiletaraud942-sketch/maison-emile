#!/usr/bin/env node
// Hook Claude Code → journal du cockpit (.claude/ops/events.jsonl, non versionné).
// Ne bloque jamais Claude : aucune sortie, code 0 dans tous les cas.
import fs from 'node:fs';
import path from 'node:path';

const BUILTIN = { 'general-purpose': 'renfort', Explore: 'renfort', Plan: 'renfort', claude: 'renfort' };
const cut = (s, n = 140) => (s == null ? '' : String(s).replace(/\s+/g, ' ').trim().slice(0, n));

try {
  const raw = fs.readFileSync(0, 'utf8');
  const d = JSON.parse(raw || '{}');
  const dir = process.env.CLAUDE_PROJECT_DIR || d.cwd || process.cwd();
  const i = d.tool_input || {};
  const rel = p => (p ? path.relative(dir, p) || p : '');
  const ev = {
    t: Date.now(),
    ev: d.hook_event_name,
    sid: String(d.session_id || '').slice(0, 8),
  };
  if (d.agent_type) ev.agent = BUILTIN[d.agent_type] || d.agent_type;
  if (d.agent_id) ev.aid = String(d.agent_id).slice(0, 12);
  if (d.tool_name) ev.tool = d.tool_name;
  if (d.tool_name === 'Agent' || d.tool_name === 'Task') {
    const s = i.subagent_type || 'general-purpose';
    ev.sub = BUILTIN[s] || s;
    ev.desc = cut(i.description || i.prompt, 120);
  } else if (i.file_path || i.notebook_path) ev.desc = rel(i.file_path || i.notebook_path);
  else if (i.command) ev.desc = cut(i.command, 120);
  else if (i.pattern) ev.desc = cut(i.pattern, 80);
  else if (i.url) ev.desc = cut(i.url, 100);
  else if (i.query) ev.desc = cut(i.query, 100);
  if (d.hook_event_name === 'UserPromptSubmit') ev.desc = cut(d.prompt, 160);
  if (d.hook_event_name === 'PostToolUse') {
    const r = d.tool_response;
    ev.ok = !(r && (r.is_error || r.error || (typeof r === 'object' && r.interrupted)));
  }

  const file = path.join(dir, '.claude', 'ops', 'events.jsonl');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, JSON.stringify(ev) + '\n');
  // Rotation simple : on garde les 2000 dernières lignes au-delà de 2 Mo.
  if (fs.statSync(file).size > 2 * 1024 * 1024) {
    const lines = fs.readFileSync(file, 'utf8').trim().split('\n');
    fs.writeFileSync(file, lines.slice(-2000).join('\n') + '\n');
  }
} catch { /* le cockpit ne doit jamais gêner le travail */ }
process.exit(0);
