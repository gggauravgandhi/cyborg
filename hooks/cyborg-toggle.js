#!/usr/bin/env node
// cyborg — UserPromptSubmit hook.
//
// Two jobs every turn:
//   1. Toggle: detect "cyborg up/down" (and aliases) in the user prompt and flip
//      the down-flag.
//   2. Per-turn reinforcement: while up, emit a short fixed reminder as hidden
//      additionalContext. This is the anti-drift workhorse — the SessionStart
//      injection alone fades over a long conversation (and after context
//      compression), and competing per-turn instructions from other plugins
//      crowd it out. The reminder is hidden context, never printed output, so it
//      reinforces behavior without the model narrating its own compliance.

const { isDown, setDown, setUp } = require('./cyborg-flag');

const REMINDER =
  'CYBORG ACTIVE: dense, readable, slop-free. No mirroring/preamble/postamble. ' +
  "Don't narrate compliance. No fake hedging. Active voice, specific, no vague declaratives. " +
  'No em dashes, no emoji unless the user used them. Code, commits, and safety/error detail stay normal. ' +
  'Ease off for security/destructive confirmations or a confused user: explain in full.';

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
    if (!isDown()) {
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
