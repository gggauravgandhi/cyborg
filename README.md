# Cyborg

Always-on output discipline for Claude. Cuts tokens and AI slop while keeping clean, expert prose.

## What this is

An instruction set for *how* Claude writes: no preamble, no postamble, no filler or hedging, no vague declaratives. It trims optional grammar where the result still reads instantly, and stops before output turns terse or cryptic. The goal is signal: clean enough for a human, dense enough for a machine.

It runs on every response by default, across all sessions, until you turn it off.

## How "always on" actually works

A plain skill body is loaded on-demand, not every turn, so it can't be always-on by itself. cyborg solves this with **hooks** (the same mechanism caveman uses):

- A `SessionStart` hook injects the ruleset into context at the start of every session.
- A `UserPromptSubmit` hook re-injects a short reminder every turn (anti-drift) and watches for toggle commands.

Both are hidden context, never printed, so cyborg stays active without ever narrating its own compliance.

**Platform ceiling:** hooks run in **Claude Code only**. On Claude web and desktop there are no hooks, so auto-inject is not possible there; use the manual paste-in block below.

## Install

### Claude Code (automatic, recommended)

Install as a plugin. The hooks then run every session, no manual step:

```
/plugin marketplace add gggauravgandhi/cyborg
/plugin install cyborg@cyborg
```

After install, cyborg is up by default in every new session. Requires Node ≥18 (for the hook scripts).

### Claude web / desktop (manual)

No hooks, so paste the `<!-- cyborg-begin -->` block from [`skills/cyborg/SKILL.md`](skills/cyborg/SKILL.md) into Settings → custom instructions (everywhere) or a Project's instructions (that project only).

## Toggle

- `cyborg down`: write normally for the rest of the session. Does not expire.
- `cyborg up`: resume.
- Every new session starts **up**, unless a project's `CLAUDE.md` says `cyborg down`. A command you type this session always wins.

## What it does

- Kills mirroring (restating the prompt before answering), preamble ("Great question!", "Sure!"), and postamble ("Hope this helps", "Let me know if...").
- Stops the model narrating its own compliance ("I'll keep this brief").
- Cuts filler and adverbs. Bans fake hedging but keeps genuine uncertainty. Forces active voice.
- Demands specifics over vague declaratives and lazy extremes.
- Trims optional grammar ("that", redundant subjects, "there is/are") only where it stays instantly readable.
- Bans em dashes, pull-quote one-liners, and unprompted emoji.

## What it does not do

- Does not degrade clarity for brevity. Complex steps get explained in full.
- Does not touch code, commit messages, or PR descriptions.
- Does not strip safety detail. Security warnings, irreversible-action confirmations, and exact error text stay complete.

## Structure

```
cyborg/
├── .claude-plugin/
│   ├── plugin.json       # Declares the SessionStart + UserPromptSubmit hooks
│   └── marketplace.json  # For /plugin marketplace add
├── hooks/
│   ├── cyborg-activate.js # SessionStart: inject the block, reset to up
│   ├── cyborg-toggle.js   # UserPromptSubmit: toggle flag + per-turn reminder
│   └── cyborg-flag.js     # Presence-only down-flag (symlink-safe)
├── skills/cyborg/
│   └── SKILL.md          # Canonical block on top, full ruleset + examples beneath
├── SKILL-legacy.md       # Deprecated pre-debate version, reference snapshot only
├── README.md
└── CLAUDE.md             # Working instructions for developing this skill
```

The ruleset came out of a four-model debate (Gemini, Codex, Sonnet, Opus) that put the paste-in block first, cut a redundant self-check, and added a no-mirroring rule. The hook mechanism is ported from caveman.

## Author

Gaurav Gandhi ([@gggauravgandhi](https://github.com/gggauravgandhi)).

## License

MIT. See [LICENSE](LICENSE).
