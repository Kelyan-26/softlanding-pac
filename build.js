#!/usr/bin/env node
/**
 * Chiffre data/content.json vers content.enc.json.
 *
 * Le fichier chiffre est le seul qui part en ligne : sans le mot de passe de la
 * promotion, il est illisible. La source claire (data/content.json) reste locale
 * et n'est jamais versionnee (voir .gitignore).
 *
 *   SOFTLANDING_PASSWORD='...' node build.js
 *   node build.js            → demande le mot de passe
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

const ITERATIONS = 250000;
const KEY_LENGTH = 32;
const ROOT = __dirname;
const SOURCE = path.join(ROOT, 'data', 'content.json');
const TARGET = path.join(ROOT, 'content.enc.json');

function askPassword() {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write('Mot de passe de la promotion : ');
    rl.output.write = () => {}; // masque la saisie
    rl.question('', (answer) => {
      rl.close();
      process.stdout.write('\n');
      answer ? resolve(answer) : reject(new Error('Mot de passe vide.'));
    });
  });
}

async function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error(`Source introuvable : ${SOURCE}`);
    console.error('Copie data/content.example.json vers data/content.json pour demarrer.');
    process.exit(1);
  }

  const raw = fs.readFileSync(SOURCE, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    console.error(`data/content.json n'est pas un JSON valide : ${error.message}`);
    process.exit(1);
  }

  const password = process.env.SOFTLANDING_PASSWORD || (await askPassword());
  if (password.length < 8) {
    console.error('Mot de passe trop court : 8 caracteres minimum.');
    process.exit(1);
  }

  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const payload = Buffer.concat([
    cipher.update(JSON.stringify(parsed), 'utf8'),
    cipher.final(),
    cipher.getAuthTag(), // WebCrypto attend le tag colle au chiffre
  ]);

  fs.writeFileSync(
    TARGET,
    JSON.stringify(
      {
        v: 1,
        kdf: 'PBKDF2-SHA256',
        iterations: ITERATIONS,
        salt: salt.toString('base64'),
        iv: iv.toString('base64'),
        ciphertext: payload.toString('base64'),
        builtAt: new Date().toISOString(),
      },
      null,
      2,
    ) + '\n',
  );

  const sessions = Array.isArray(parsed.programme) ? parsed.programme.length : 0;
  const contacts = Array.isArray(parsed.contacts) ? parsed.contacts.length : 0;
  console.log(`content.enc.json ecrit — ${sessions} sessions, ${contacts} contacts, ${(payload.length / 1024).toFixed(1)} Ko chiffres.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
