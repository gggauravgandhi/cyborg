# Cyborg

Always-on output discipline for Claude. Cuts tokens and AI slop while keeping clean, expert prose.

## What this is

An instruction set for *how* Claude writes: no preamble, no postamble, no filler or hedging, no vague declaratives. It trims optional grammar where the result still reads instantly, and stops before output turns terse or cryptic. The goal is signal: clean enough for a human, dense enough for a machine.

It runs on every response by default, across all sessions, until you turn it off.

## Before / after

Same answers, slop removed. Note the last one: cyborg trims the filler but keeps the full explanation. It cuts noise, not substance.

**Debugging**

> Normal: "Great question! There could be a few reasons your API call is returning a 401. The most common cause is usually that the authentication token has expired or isn't being sent correctly in the header. I'd recommend double-checking that you're including the Authorization header in the right format. Let me know if you'd like me to walk through it!"

> Cyborg: "A 401 means the token is missing, expired, or malformed. Check the `Authorization` header is sent as `Bearer <token>` and the token hasn't expired. Usually it's a stale token."

**Status update**

> Normal: "I've gone ahead and updated the configuration file as you requested, and I'm happy to report that all of the tests are now passing successfully. Please let me know if there's anything else you need!"

> Cyborg: "Updated the config. All tests pass."

**Explaining a concept** (full explanation kept, filler dropped)

> Normal: "Sure! So, debouncing is essentially a really useful technique that's commonly used to limit how often a particular function gets called. Basically, what it does is it waits until a certain amount of time has passed before it actually runs the function in question..."

> Cyborg: "Debouncing delays a function until calls stop: each new call resets a timer, and the function runs only after the timer expires with no new calls. Use it for search-as-you-type so you fire one request after the user stops typing, not one per keystroke."

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

**Updating:** in Claude Code the `SessionStart` hook re-reads `SKILL.md` every session, so a plugin update lands automatically on the next session. On web/desktop the pasted block is a static snapshot with no auto-update; when cyborg changes upstream, re-copy the block from `SKILL.md` and replace your custom-instructions copy. The pasted block carries a source comment for this reason.

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
- Does not strip safety detail. Security warnings, destructive or irreversible action confirmations, and exact error text stay complete.
- Eases off on demand. If you're confused or ask it to expand, it drops density and explains in full.

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
│   └── SKILL.md          # Rules + examples lead; paste-in block in a bottom install section
├── SKILL-legacy.md       # Deprecated pre-debate version, reference snapshot only
├── README.md
└── CLAUDE.md             # Working instructions for developing this skill
```

The ruleset came out of a four-model debate (Gemini, Codex, Sonnet, Opus) that put the paste-in block first, cut a redundant self-check, and added a no-mirroring rule. The hook mechanism is ported from caveman.

## Credits

cyborg picked up a couple of good ideas from skills that came before it:

- [stop-slop](https://github.com/hardikpandya/stop-slop) by Hardik Pandya, for how to spot and cut AI writing tells.
- [caveman](https://github.com/JuliusBrussee/caveman) by Julius Brussee, for the hook-based always-on and toggle approach.

It goes its own way on the rest: clean expert prose rather than compression, a ruleset shaped by a four-model debate, and a safety bypass.

## Author

Gaurav Gandhi ([@gggauravgandhi](https://github.com/gggauravgandhi)).

## License

MIT. See [LICENSE](LICENSE).
