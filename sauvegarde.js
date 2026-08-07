#!/usr/bin/env node
/**
 * Sauvegarde chiffrée de la source de vérité.
 *
 * Pourquoi ce script existe : `data/content.json` contient tout le contenu réel,
 * dont les coordonnées de 16 fondateurs. Il est volontairement exclu de git, il
 * n'a aucune copie ailleurs sur la machine, et aucune sauvegarde Time Machine
 * n'est configurée. Un disque qui lâche, et tout est perdu.
 *
 * Ce qu'il fait : chiffre le fichier avec une phrase de passe DISTINCTE de celle
 * du site, et l'écrit dans un dépôt git séparé et PRIVÉ. Deux protections
 * superposées — même chiffrées, des données personnelles n'ont rien à faire sur
 * un dépôt public.
 *
 *   SOFTLANDING_BACKUP_PASSWORD='…' node sauvegarde.js            → sauvegarder
 *   SOFTLANDING_BACKUP_PASSWORD='…' node sauvegarde.js --restaurer → restaurer
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ITERATIONS = 250000;
const SOURCE = path.join(__dirname, 'data', 'content.json');
const COFFRE = path.join(path.dirname(__dirname), 'softlanding-pac-sauvegarde');
const CIBLE = path.join(COFFRE, 'content.full.enc.json');

const mdp = process.env.SOFTLANDING_BACKUP_PASSWORD;
if (!mdp || mdp.length < 12) {
  console.error('SOFTLANDING_BACKUP_PASSWORD manquante ou trop courte (12 caractères minimum).');
  process.exit(1);
}

function chiffrer(texte) {
  const sel = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const cle = crypto.pbkdf2Sync(mdp, sel, ITERATIONS, 32, 'sha256');
  const c = crypto.createCipheriv('aes-256-gcm', cle, iv);
  const paquet = Buffer.concat([c.update(texte, 'utf8'), c.final(), c.getAuthTag()]);
  return {
    v: 1, kdf: 'PBKDF2-SHA256', iterations: ITERATIONS,
    salt: sel.toString('base64'), iv: iv.toString('base64'),
    ciphertext: paquet.toString('base64'),
    savedAt: new Date().toISOString(),
  };
}

function dechiffrer(enveloppe) {
  const cle = crypto.pbkdf2Sync(mdp, Buffer.from(enveloppe.salt, 'base64'), enveloppe.iterations, 32, 'sha256');
  const paquet = Buffer.from(enveloppe.ciphertext, 'base64');
  const d = crypto.createDecipheriv('aes-256-gcm', cle, Buffer.from(enveloppe.iv, 'base64'));
  d.setAuthTag(paquet.subarray(paquet.length - 16));
  return Buffer.concat([d.update(paquet.subarray(0, paquet.length - 16)), d.final()]).toString('utf8');
}

if (process.argv.includes('--restaurer')) {
  if (!fs.existsSync(CIBLE)) { console.error(`Aucune sauvegarde dans ${CIBLE}`); process.exit(1); }
  const enveloppe = JSON.parse(fs.readFileSync(CIBLE, 'utf8'));
  let clair;
  try { clair = dechiffrer(enveloppe); }
  catch { console.error('Phrase de passe incorrecte, ou sauvegarde altérée.'); process.exit(1); }
  JSON.parse(clair); // on ne restaure jamais un JSON cassé
  // L'existant est mis de côté : une restauration ne doit pas détruire à son tour.
  if (fs.existsSync(SOURCE)) {
    const secours = `${SOURCE}.avant-restauration-${Date.now()}`;
    fs.copyFileSync(SOURCE, secours);
    console.log(`Fichier actuel mis de côté : ${path.basename(secours)}`);
  }
  fs.writeFileSync(SOURCE, clair);
  console.log(`data/content.json restauré depuis la sauvegarde du ${enveloppe.savedAt}.`);
  process.exit(0);
}

if (!fs.existsSync(SOURCE)) { console.error(`Source introuvable : ${SOURCE}`); process.exit(1); }
const brut = fs.readFileSync(SOURCE, 'utf8');
JSON.parse(brut); // on ne sauvegarde jamais un JSON cassé

fs.mkdirSync(COFFRE, { recursive: true });
const enveloppe = chiffrer(brut);

// Contrôle immédiat : une sauvegarde qu'on n'a pas relue n'est pas une sauvegarde.
const relu = dechiffrer(enveloppe);
if (relu !== brut) { console.error('Le contrôle de relecture a échoué : rien n’a été écrit.'); process.exit(1); }

fs.writeFileSync(CIBLE, JSON.stringify(enveloppe, null, 2) + '\n');
const d = JSON.parse(brut);
console.log(`Sauvegarde écrite et relue avec succès.`);
console.log(`  ${(brut.length / 1024).toFixed(0)} Ko en clair → ${(enveloppe.ciphertext.length / 1024).toFixed(0)} Ko chiffrés`);
console.log(`  ${(d.contacts || []).length} contacts · ${(d.glossaire || []).length} termes · ${(d.programme || []).length} sessions`);
console.log(`  → ${CIBLE}`);
