#!/usr/bin/env node
// cyborg — SessionStart hook.
//
// Runs at the start of every session:
//   1. Resets state to UP (clears any stale down-flag). Each new session starts up.
//   2. Reads skills/cyborg/SKILL.md, extracts the <!-- cyborg-begin -->...<!-- cyborg-end -->
//      block, and emits it as hidden SessionStart context.
//
// Why inject only the block, not the whole SKILL.md: cyborg's entire purpose is
// cutting tokens. Injecting the full 80+ line file into every session's context
// would be self-defeating. The block is the canonical, tight ruleset; the rest
// of SKILL.md is human reference. Reading SKILL.md at runtime means edits to the
// block propagate automatically — no duplicated ruleset to drift.

const fs = require('fs');
const path = require('path');
const { setUp } = require('./cyborg-flag');

// 1. Every new session starts up.
setUp();

// 2. Extract and emit the canonical block.
const FALLBACK =
  'CYBORG ACTIVE: dense, readable, slop-free output every response.\n' +
  '- No mirroring (do not restate the prompt). No preamble/postamble. Open with the answer.\n' +
  '- Do not narrate compliance; never mention cyborg except to acknowledge a toggle.\n' +
  '- Cut filler/adverbs. No fake hedging (keep genuine uncertainty). Active voice. Be specific.\n' +
  '- No em dashes, no emoji unless the user uses them first.\n' +
  '- Never trade clarity for brevity. Code, commits, PR text, safety/error detail stay normal.\n' +
  'Toggle: "cyborg down" suspends, "cyborg up" resumes.';

let output = FALLBACK;
try {
  const skill = fs.readFileSync(
    path.join(__dirname, '..', 'skills', 'cyborg', 'SKILL.md'), 'utf8'
  );
  const m = skill.match(/<!--\s*cyborg-begin\s*-->([\s\S]*?)<!--\s*cyborg-end\s*-->/);
  if (m && m[1].trim()) {
    output = 'CYBORG ACTIVE (output discipline, on by default).\n\n' + m[1].trim();
  }
} catch (e) { /* use fallback */ }

process.stdout.write(output);
