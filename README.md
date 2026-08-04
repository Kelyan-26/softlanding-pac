# Soft Landing — Provence Africa Connect

Plateforme privée de la promotion en cours du programme Soft Landing.
Site statique, bilingue FR/EN, contenu chiffré.

## Identité

Logo officiel `logo_SLPAC.ai`, décliné en trois fichiers dans `assets/` :
`logo.png` (texte marine, thème clair), `logo-dark.png` (texte éclairci, thème
sombre) et `mark.png` (la marque seule — favicon et filigrane du bandeau d'accueil).
Fonds transparents, générés depuis le `.ai` — voir le vault pour la méthode.

Couleurs, mesurées sur le fichier source : **orange `#ED752C`**, **bleu marine
`#333D85`**. Elles vivent dans un seul bloc `:root` de `assets/style.css`, avec un
bloc jumeau `:root[data-theme="light"]`. **Aucune couleur en dur dans les
composants.**

Le site s'ouvre en **thème clair** ; la bascule en bas de la barre latérale passe au
sombre et mémorise le choix.

## Ce qu'elle contient

| Section | Contenu |
|---|---|
| Accueil | Présentation du programme, accès rapides, infos pratiques |
| Programme | Déroulé jour par jour. **La session en cours est détectée automatiquement** et mise en avant |
| Visa & Passeport Talent | Les voies possibles, les étapes, les pièces, les liens officiels |
| Business plan en France | Attentes d'un lecteur français, checklists, ressources |
| Navigation interculturelle | Codes professionnels, à faire / à éviter |
| Acteurs du programme | Les structures, leur rôle, comment les joindre |
| Hôtels partenaires | Adresses, tarifs négociés, modalités de réservation |
| Carnet d'adresses | Les personnes du programme, avec recherche |
| Marseille | Les bonnes adresses, filtrables par catégorie |

## Comment ça marche

Le contenu n'est **pas** en clair dans le site. `data/content.json` est chiffré en
AES-256-GCM (clé dérivée du mot de passe par PBKDF2, 250 000 itérations) vers
`content.enc.json`, seul fichier mis en ligne. Sans le mot de passe, le fichier
téléchargé est inexploitable — un simple contrôle en JavaScript, lui, se contourne
en dix secondes, ce qui n'est pas acceptable pour un carnet d'adresses.

Conséquence : **`data/content.json` n'est jamais versionné** (`.gitignore`).
Il vit sur le poste de Kelyan et nulle part ailleurs.

## Modifier le contenu depuis le site

Bouton **Mode édition** en bas de la barre latérale. Chaque texte affiché devient
modifiable au clic : on écrit dans la langue affichée, la seconde reste intacte.
Les listes (programme, acteurs, hôtels, contacts, lieux) gagnent un **Ajouter** et
un **Supprimer** par ligne.

Les modifications vivent dans la **session du navigateur uniquement** — elles
contiennent des données personnelles et disparaissent à la fermeture. Deux sorties :

| Bouton | Effet |
|---|---|
| `content.json` | télécharge la source en clair, à replacer dans `data/` |
| **Publier** | demande un mot de passe, **rechiffre dans le navigateur** et télécharge `content.enc.json` prêt à remplacer sur l'hébergement |

Le fichier produit par « Publier » est au format exact de `build.js` — vérifié en
déchiffrant côté Node un fichier chiffré côté navigateur.

Ce qui n'est **pas** éditable depuis le site : les étiquettes, les listes
d'intervenants, les liens et les langues. Ils passent encore par `data/content.json`.

## Modifier le contenu en local

```bash
cd ~/dev/softlanding-pac

# la première fois
cp data/content.example.json data/content.json

# éditer data/content.json, puis régénérer
SOFTLANDING_PASSWORD='le-mot-de-passe' node build.js
```

Tout texte accepte la forme bilingue `{"fr": "…", "en": "…"}`.
Les mentions `A REMPLIR` / `TO FILL` s'affichent **surlignées en orange** sur le
site : impossible d'oublier un champ vide.

## Voir le site en local

`fetch()` ne fonctionne pas en `file://` — il faut un serveur :

```bash
cd ~/dev/softlanding-pac && python3 -m http.server 8080
# puis http://localhost:8080
```

## Version de revue

Pour faire relire la plateforme avant que les personnes du carnet aient été
informées de leur présence en ligne :

```bash
SOFTLANDING_PASSWORD='…' node review.js
```

Retire tous les emails, téléphones et LinkedIn, garde noms, structures, rôles et
activités, signale la chose sur l'accueil, et régénère `content.enc.json`.
`node build.js` remet la version complète.

## Mettre en ligne

Le dossier est déployable tel quel (Cloudflare Pages, Netlify, n'importe quel
hébergeur statique). Fichiers à publier : `index.html`, `assets/`, `content.enc.json`.

**À ne pas publier** : `data/`, `build.js`, ce README.

Le mot de passe se transmet aux participants par un canal séparé — jamais dans le
même message que le lien.

## Limites connues

- Un mot de passe unique et partagé : si un participant le diffuse, tout le contenu
  est exposé. Pour une vraie granularité il faudrait un back-end (Supabase), voir la
  stack cible de `plateforme-m`.
- Les horaires sont interprétés dans le fuseau du visiteur. Un bandeau prévient
  quand ce fuseau n'est pas celui de Paris.
- RGPD : le carnet d'adresses contient des données personnelles. Chaque personne
  listée doit avoir été informée de sa présence et de la finalité du site.
