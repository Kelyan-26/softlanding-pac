/* Service worker — rend la plateforme consultable sans réseau.
   Utile pour de vrai : les participants arrivent en France, parfois sans
   forfait data actif pendant plusieurs jours.

   Deux stratégies seulement, et le choix est tranché :
   - tout ce qui peut changer (page, code, styles, contenu chiffré) : le RÉSEAU
     D'ABORD, le cache ne sert que de filet quand le réseau manque. Une version
     publiée doit être vue immédiatement ;
   - les polices et les images : le CACHE D'ABORD, elles ne changent pas sans
     changer de nom.

   Le « cache puis rafraîchissement » de la version précédente était une
   fausse bonne idée : il servait systématiquement la version de la veille, et
   une correction publiée n'apparaissait qu'au deuxième chargement. Sur un site
   dont le contenu est corrigé au fil de l'eau, c'est inacceptable — l'écart de
   quelques centaines de millisecondes au chargement ne pèse rien à côté. */

const VERSION = 'slpac-v5';
const COQUILLE = [
  './',
  'index.html',
  /* Leaflet est hébergé ici, comme les polices : le site ne dépend d'aucun
     CDN. Les tuiles satellite, elles, viennent bien de l'extérieur — mais
     seulement si l'utilisateur ouvre la carte et l'accepte. */
  'assets/vendor/leaflet.js',
  'assets/vendor/leaflet.css',
  /* Sans lui le site s'ouvre mais reste vide : à la première visite, la page
     l'a déjà chargé avant que ce worker prenne la main. On l'amorce donc ici. */
  'content.enc.json',
  'assets/style.css',
  'assets/app.js',
  'assets/fonts.css',
  'assets/logo.png',
  'assets/logo-clair.png',
  'assets/mark.png',
  'assets/fonts/space-grotesk-latin.woff2',
  'assets/fonts/space-grotesk-latin-ext.woff2',
  'assets/fonts/jakarta-latin.woff2',
  'assets/fonts/jakarta-latin-ext.woff2',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION)
      // Un fichier manquant ne doit pas faire échouer toute l'installation.
      .then((c) => Promise.allSettled(COQUILLE.map((u) => c.add(u))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const immuable = /\.(woff2|png|jpg|jpeg|svg|webp|ico)$/.test(url.pathname);

  if (immuable) {
    e.respondWith(
      caches.match(request).then((cache) => cache || fetch(request).then((rep) => {
        if (rep.ok) {
          const copie = rep.clone();
          caches.open(VERSION).then((c) => c.put(request, copie));
        }
        return rep;
      })),
    );
    return;
  }

  // Réseau d'abord : on ne sert le cache que s'il n'y a pas de réseau.
  e.respondWith(
    fetch(request)
      .then((rep) => {
        if (rep.ok) {
          const copie = rep.clone();
          caches.open(VERSION).then((c) => c.put(request, copie));
        }
        return rep;
      })
      .catch(() => caches.match(request).then((cache) => cache || caches.match('./'))),
  );
});
