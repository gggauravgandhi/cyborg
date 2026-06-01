# CLAUDE.md: cyborg

## Project Overview

`cyborg` is a Claude Code **plugin** that regulates *how Claude writes*: it strips slop (mirroring, preamble, filler, hedging, vague declaratives) and trims optional grammar to cut tokens, while keeping clean, readable expert prose. It is not an app; the "code" is two small hooks.

How always-on is achieved (ported from caveman): a plain skill body loads on-demand, so it can't be always-on alone. Hooks declared in `.claude-plugin/plugin.json` do it:
- `hooks/cyborg-activate.js` (SessionStart) injects the `<!-- cyborg-begin -->` block from `skills/cyborg/SKILL.md` into context every session, and resets state to up.
- `hooks/cyborg-toggle.js` (UserPromptSubmit) flips the down-flag on "cyborg up/down" and re-injects a short reminder every turn (anti-drift). Both are hidden context, never printed.
- `hooks/cyborg-flag.js` is a presence-only down-flag (`~/.claude/.cyborg-down`). NEVER read its bytes into context; readers inject a fixed string, so there is no symlink-content-injection vector.

The SessionStart hook injects ONLY the block, not the whole SKILL.md; injecting the full file every session would defeat a token-saving skill. Edit the block in `skills/cyborg/SKILL.md`; the hook reads it at runtime so changes propagate.

**Platform ceiling:** hooks are Claude Code only. Web/desktop have no hooks; there the paste-in block (manual, into custom instructions) is the only path. Do not claim auto-inject works on web/desktop.

Known limitation (do NOT "fix"): if a project's `CLAUDE.md` says "cyborg down", the SessionStart hook still injects "CYBORG ACTIVE". The hook does not parse project CLAUDE.md; the model-instruction layer resolves that conflict. Building project-down detection into the hook is scope creep.

`SKILL-legacy.md` (`name: cyborg-legacy`, deprecated) is the pre-debate long-form version, kept as a reference snapshot. Do not edit or load it. The active skill is `skills/cyborg/SKILL.md`.

This design came out of a 4-model debate (transcript: `~/.claude-octopus/debates/local/001-cyborg-skill-review/`). Key rulings baked in: block-on-top is canonical; the self-check was CUT (sharp negative rules are the check, a meta-reminder is redundant bloat); the em-dash ban stays; "no inanimate actors" removed; "no mirroring" is Rule 1.

Reference skills live in `ref_skills/` (caveman) and `../ref/` (stop-slop). Cyborg borrows caveman's persistence/toggle model and stop-slop's slop-cutting rules, adapted for assistant output.

## Code Style

- `skills/cyborg/SKILL.md` stays self-contained (web/desktop need the paste-in block with no external files).
- Hooks: plain Node, no dependencies, must run on Node ≥18. Silent-fail on any error; a hook must never block session start or prompt submission.
- Keep it tight. The skill teaches density; the files should model it.
- Write all docs slop-free: no preamble, no em dashes, active voice, specifics over vague claims.

## Behavioral Rules

- **Self-consistency is non-negotiable.** The file must obey its own rules. After any edit, re-scan: no em dashes (`grep "—"`), no banned preamble, every example follows every rule. An example that breaks a rule teaches the rule is optional.
- **Do not reintroduce caveman comparisons** into the skill body. The skill states what cyborg does; it does not rank itself against other skills.
- **No intensity levels.** Up/down only. Do not clone caveman's lite/full/ultra tiers.
- **Do not re-add a self-check / "review before responding" section.** The debate cut it as redundant with the rules and as context bloat. Sharpen rules instead of adding meta-rules.
- **Surface scope creep.** This is a behavior-spec file; resist adding features (scoring rubrics, modes, configs) unless asked.
- Call `advisor()` before committing to wording changes that affect the state machine or rule set.

## Testing

Skill content (manual, rule-based):

1. `grep -n "—" skills/cyborg/SKILL.md` returns nothing.
2. Every `Cyborg:` example obeys rules 1-10.
3. The paste-in block and the body agree on toggle/precedence behavior.
4. The block sits at the top as the canonical artifact, before the long-form rules.

Hooks (test in isolation with mock stdin, no install needed; no browser/dev-server):

5. `node hooks/cyborg-activate.js` prints "CYBORG ACTIVE" + the real block; clears a stale `.cyborg-down`.
6. `echo '{"prompt":"x"}' | node hooks/cyborg-toggle.js` emits `additionalContext` when up; nothing when down.
7. `cyborg down` / `stop cyborg` create the flag; `cyborg up` / `cut the slop` clear it.
8. Malformed stdin exits 0 (silent-fail, never blocks the prompt).
   Use a temp `CLAUDE_CONFIG_DIR` so tests don't touch the real `~/.claude`.

## Project-Specific

- This repo dogfoods cyborg. The block below is active for work in this project.

<!-- cyborg-begin -->
## Cyborg (output discipline, on by default)

Write like a sharp human expert: dense, readable, slop-free. Apply on EVERY response while up.

- No mirroring. Don't restate or summarize the prompt before answering. Open with the answer.
- Kill preamble ("Sure!", "Great question!", "I'd be happy to") and postamble ("Hope this helps", "Let me know if...").
- Don't narrate compliance. Never announce that you're being brief. Never mention cyborg except to acknowledge a toggle.
- Cut filler and non-informative adverbs. No fake hedging (keep genuine uncertainty, stated once).
- Active voice. Be specific; name the thing, no vague declaratives or lazy extremes.
- Trim optional grammar (drop "that", redundant subjects, "there is/are"; fragments OK for short answers) only where it stays instantly readable.
- No em dashes, no pull-quote lines, no emoji unless the user uses them first. Lists only when they cut words or clarify parallel items.
- Never trade clarity for brevity. Code, commit messages, PR text, and safety/error detail stay normal and complete.

Toggle: "cyborg down" suspends (does not expire), "cyborg up" resumes. Default up each session; a project's instructions may set "cyborg down". A command typed this session wins.
<!-- cyborg-end -->
