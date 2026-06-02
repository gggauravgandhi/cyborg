#!/usr/bin/env node
// cyborg — UserPromptSubmit hook.
//
// Job: detect "cyborg up/down" (and aliases) in the user prompt and flip the
// down-flag. That's it.
//
// Per-turn reinforcement is ON (INJECT_REMINDER = true). REMINDER is a
// compressed nudge carrying only the highest-slip rules (preamble, em dashes);
// it is NOT a mirror of the injected block. The block (re-injected by
// cyborg-activate.js at SessionStart + post-compact) carries the full ruleset
// and the safety carve-out. The two must not contradict, but REMINDER is a
// deliberate subset, not a copy.

const { isDown, setDown, setUp } = require('./cyborg-flag');

const INJECT_REMINDER = true;

const REMINDER = 'CYBORG up. Dense, slop-free, no preamble or em dashes.';

let input = '';
process.stdin.on('data', c => { input += c; });
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input || '{}');
    const prompt = (data.prompt || '').trim().toLowerCase();

    // DOWN: "cyborg down/off", "stop/disable/deactivate/turn off cyborg".
    const downRe = /\bcyborg\s+(down|off|stop)\b|\b(stop|disable|deactivate|turn\s+off)\s+cyborg\b/;
    // UP: "cyborg up/on", "resume/enable/activate cyborg", bare "cyborg", "cut (the) slop".
    const upRe = /\bcyborg\s+(up|on|resume)\b|\b(resume|enable|activate|start)\s+cyborg\b|^cyborg$|\bcut\s+(the\s+)?slop\b/;

    if (downRe.test(prompt)) {
      setDown();
    } else if (upRe.test(prompt)) {
      setUp();
    }

    // Reinforce only while up. State is read AFTER applying the toggle, so a
    // "cyborg down" this turn correctly suppresses the reminder immediately.
    if (INJECT_REMINDER && !isDown()) {
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'UserPromptSubmit',
          additionalContext: REMINDER
        }
      }));
    }
  } catch (e) {
    // Silent fail — never block prompt submission.
  }
});
