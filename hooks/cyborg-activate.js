#!/usr/bin/env node
// cyborg — SessionStart hook.
//
// Runs at the start of every session AND after a context compaction (the
// SessionStart event fires with source "compact"). Two jobs:
//   1. Reset state to UP (clears any stale down-flag) — but NOT on compact.
//      Compaction is mid-session, so a "cyborg down" the user set earlier must
//      survive it. A fresh session (startup/resume/clear) starts up by default.
//   2. Read skills/cyborg/SKILL.md, extract the <!-- cyborg-begin -->...
//      <!-- cyborg-end --> block, and emit it as hidden context. This runs on
//      EVERY source, including compact: re-injecting after compaction is how
//      cyborg stays in context without a per-turn reminder.
//
// Why inject only the block, not the whole SKILL.md: cyborg's entire purpose is
// cutting tokens. Injecting the full 80+ line file into every session's context
// would be self-defeating. The block is the canonical, tight ruleset; the rest
// of SKILL.md is human reference. Reading SKILL.md at runtime means edits to the
// block propagate automatically — no duplicated ruleset to drift.

const fs = require('fs');
const path = require('path');
const { setUp, isDown } = require('./cyborg-flag');

const FALLBACK =
  'CYBORG ACTIVE: dense, readable, slop-free output every response.\n' +
  '- No mirroring (do not restate the prompt). No preamble/postamble. Open with the answer.\n' +
  '- Do not narrate compliance; never mention cyborg except to acknowledge a toggle.\n' +
  '- Cut filler/adverbs. No fake hedging (keep genuine uncertainty). Active voice. Be specific.\n' +
  '- No em dashes, no emoji unless the user uses them first.\n' +
  '- Never trade clarity for brevity. Code, commits, PR text, safety/error detail stay normal.\n' +
  'Toggle: "cyborg down" suspends, "cyborg up" resumes.';

function buildOutput() {
  try {
    const skill = fs.readFileSync(
      path.join(__dirname, '..', 'skills', 'cyborg', 'SKILL.md'), 'utf8'
    );
    const m = skill.match(/<!--\s*cyborg-begin\s*-->([\s\S]*?)<!--\s*cyborg-end\s*-->/);
    if (m && m[1].trim()) {
      return 'CYBORG ACTIVE (output discipline, on by default).\n\n' + m[1].trim();
    }
  } catch (e) { /* use fallback */ }
  return FALLBACK;
}

function finish(source) {
  if (source !== 'compact') {
    try { setUp(); } catch (e) { /* never block session start */ }
  }
  // Honor the down-flag. On a fresh source setUp() just cleared it, so this only
  // bites on compact: if the user set "cyborg down" earlier, the flag survives
  // compaction (we skipped setUp above) and we inject nothing — down means off,
  // i.e. default Claude. Injecting "CYBORG ACTIVE" here would silently flip them
  // back on after every compaction.
  let down = false;
  try { down = isDown(); } catch (e) { /* default to emitting */ }
  if (down) return;
  process.stdout.write(buildOutput());
}

// No stdin (interactive invocation) — treat as a fresh start and emit.
if (process.stdin.isTTY) {
  finish('');
} else {
  let input = '';
  process.stdin.on('data', c => { input += c; });
  process.stdin.on('end', () => {
    let source = '';
    try { source = JSON.parse(input || '{}').source || ''; } catch (e) { /* fresh start */ }
    finish(source);
  });
}
