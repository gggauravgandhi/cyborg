#!/usr/bin/env node
// cyborg — shared flag helper.
//
// State model: cyborg is UP (active) by default. A single marker file means DOWN.
//   flag present  -> down (suspended this session)
//   flag absent   -> up   (active)
//
// SECURITY: we treat the flag as PRESENCE-ONLY. We never read its bytes into
// model context — readers inject a fixed reminder string, not file content. So
// the symlink-content-injection vector that a content-bearing flag would open
// (e.g. attacker symlinks the predictable path at ~/.ssh/id_rsa) simply does
// not exist here. We still refuse to follow a symlink at the flag path on write,
// and existence checks use lstat + isFile so a planted symlink reads as "absent".

const fs = require('fs');
const path = require('path');
const os = require('os');

function claudeDir() {
  return process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
}

function flagPath() {
  return path.join(claudeDir(), '.cyborg-down');
}

// DOWN if a real (non-symlink) marker file exists; otherwise UP.
function isDown() {
  try {
    const st = fs.lstatSync(flagPath());
    return st.isFile(); // a symlink (or anything non-file) counts as absent
  } catch (e) {
    return false; // ENOENT -> up
  }
}

// Suspend: create the marker. Symlink-safe (O_EXCL | O_NOFOLLOW, 0600).
function setDown() {
  const fp = flagPath();
  try {
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    // Refuse if the path is already a symlink (clobber vector).
    try { if (fs.lstatSync(fp).isSymbolicLink()) return; } catch (e) { if (e.code !== 'ENOENT') return; }
    const O_NOFOLLOW = typeof fs.constants.O_NOFOLLOW === 'number' ? fs.constants.O_NOFOLLOW : 0;
    const flags = fs.constants.O_WRONLY | fs.constants.O_CREAT | O_NOFOLLOW;
    let fd;
    try { fd = fs.openSync(fp, flags, 0o600); fs.writeSync(fd, 'down'); }
    finally { if (fd !== undefined) fs.closeSync(fd); }
  } catch (e) { /* best-effort */ }
}

// Resume / reset to up: remove the marker. unlink removes the link itself, not
// any target, so this is safe even if the path is a symlink.
function setUp() {
  try { fs.unlinkSync(flagPath()); } catch (e) { /* already up */ }
}

module.exports = { flagPath, isDown, setDown, setUp };
