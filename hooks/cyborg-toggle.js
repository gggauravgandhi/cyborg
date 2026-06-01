#!/usr/bin/env node
// cyborg — UserPromptSubmit hook.
//
// Job: detect "cyborg up/down" (and aliases) in the user prompt and flip the
// down-flag. That's it.
//
// Per-turn reinforcement is OFF (INJECT_REMINDER = false). Cyborg relies on
// SessionStart + post-compact injection (cyborg-activate.js) to stay in context,
// not a reminder on every prompt. The reminder text is kept below so flipping
// INJECT_REMINDER back to true fully restores per-turn reinforcement without
// re-deriving the wording (and keeps it in sync with the injected block).

const { isDown, setDown, setUp } = require('./cyborg-flag');

const INJECT_REMINDER = false;

const REMINDER =
  'CYBORG: dense, slop-free. No mirroring/preamble/postamble, no narrating compliance, no em dashes. ' +
  'Active, specific. Code/commits/safety detail stay full; ' +
  'ease off for confused users or destructive/security confirmations.';

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
