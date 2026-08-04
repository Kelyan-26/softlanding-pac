#!/usr/bin/env node
/**
 * Prépare une VERSION DE REVUE : le site complet, sans aucune coordonnée.
 *
 * À utiliser pour faire relire la plateforme (tuteur, collègues) avant que les
 * personnes du carnet d'adresses aient été informées de leur présence en ligne.
 * Ce que le relecteur juge — structure, contenu, design — ne nécessite ni
 * téléphone ni email.
 *
 * Retire : emails, téléphones et LinkedIn des contacts et des acteurs.
 * Conserve : noms, structures, rôles, activités, étiquettes, sites publics.
 *
 *   SOFTLANDING_PASSWORD='…' node review.js
 *
 * Écrit data/content.review.json (gitignoré) et content.enc.json (publiable).
 */

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = __dirname;
const SOURCE = path.join(ROOT, 'data', 'content.json');
const REVUE = path.join(ROOT, 'data', 'content.review.json');

if (!fs.existsSync(SOURCE)) {
  console.error(`Source introuvable : ${SOURCE}`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
let retires = 0;

const vider = (objet, champs) => {
  for (const c of champs) {
    if (objet && typeof objet[c] === 'string' && objet[c].trim()) { objet[c] = ''; retires++; }
  }
};

for (const c of data.contacts || []) vider(c, ['email', 'phone', 'linkedin']);
for (const a of data.acteurs || []) vider(a.contact, ['email', 'phone']);
for (const h of data.hotels || []) vider(h.booking, ['contact']);

// Le relecteur doit savoir ce qu'il ne voit pas.
data.meta = data.meta || {};
data.meta.promotion = `${data.meta.promotion || ''} — version de revue`.trim();
data.home = data.home || {};
data.home.practical = [
  {
    label: { fr: 'Version de revue', en: 'Review build' },
    value: {
      fr: 'Téléphones et emails retirés tant que les personnes du carnet n’ont pas été informées. Tout le reste est le contenu réel.',
      en: 'Phone numbers and emails removed until the people listed have been informed. Everything else is the real content.',
    },
  },
  ...(data.home.practical || []),
];

fs.writeFileSync(REVUE, JSON.stringify(data, null, 2) + '\n');
console.log(`data/content.review.json écrit — ${retires} coordonnées retirées.`);

// On réutilise build.js pour le chiffrement : une seule implémentation.
const sauvegarde = fs.readFileSync(SOURCE);
try {
  fs.copyFileSync(REVUE, SOURCE);
  execFileSync(process.execPath, [path.join(ROOT, 'build.js')], { stdio: 'inherit', env: process.env });
} finally {
  fs.writeFileSync(SOURCE, sauvegarde);
}
console.log('content.enc.json contient désormais la version de revue.');
