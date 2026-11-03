'use strict';

/**
 * Reset the admin password without touching products or photos.
 *
 *   1. Stop the server (Ctrl+C).
 *   2. Run:  node reset-password.js "my new password"
 *   3. Start the server again.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline/promises');

const DB_FILE = path.join(__dirname, 'data', 'db.json');

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(password), salt, 64);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

async function main() {
  if (!fs.existsSync(DB_FILE)) {
    console.error('No data/db.json yet. Start the server once, then run this again.');
    process.exit(1);
  }

  let password = process.argv[2] || '';
  if (!password) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    password = await rl.question('New admin password (at least 8 characters): ');
    const again = await rl.question('Type it again: ');
    rl.close();
    if (password !== again) {
      console.error('The two passwords do not match.');
      process.exit(1);
    }
  }

  if (password.length < 8) {
    console.error('Use at least 8 characters.');
    process.exit(1);
  }

  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  db.admin = { passwordHash: hashPassword(password), updatedAt: new Date().toISOString() };

  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);

  console.log('Password updated. Start the server and sign in with the new password.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
