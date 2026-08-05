/* Service worker — rend la plateforme consultable sans réseau.
   Utile pour de vrai : les participants arrivent en France, parfois sans
   forfait data actif pendant plusieurs jours.

   Trois stratégies, choisies selon ce que le fichier risque :
   - le contenu chiffré : le RÉSEAU D'ABORD, repli sur le cache. Une correction
     publiée doit parvenir tout de suite ;
   - le code et les pages (HTML, CSS, JS) : le CACHE PUIS RAFRAÎCHISSEMENT. On
     répond instantanément avec le cache, on retélécharge en fond, la visite
     suivante a la version à jour. Un cache simple bloquerait les mises à jour
     jusqu'au prochain changement de VERSION — le piège classique ;
   - les polices et les images : le CACHE D'ABORD, elles ne changent jamais
     sans changer de nom. */

const VERSION = 'slpac-v1';
const COQUILLE = [
  './',
  'index.html',
  /* Sans lui le site s'ouvre mais reste vide : à la première visite, la page
     l'a déjà chargé avant que ce worker prenne la main. On l'amorce donc ici. */
  'content.enc.json',
  'assets/style.css',
  'assets/app.js',
  'assets/fonts.css',
  'assets/logo.png',
  'assets/logo-dark.png',
  'assets/mark.png',
  'assets/fonts/inter-400-800-latin.woff2',
  'assets/fonts/inter-400-800-latin-ext.woff2',
  'assets/fonts/roboto-400-latin.woff2',
  'assets/fonts/roboto-400-latin-ext.woff2',
  'assets/fonts/roboto-500-latin.woff2',
  'assets/fonts/roboto-500-latin-ext.woff2',
  'assets/fonts/roboto-700-latin.woff2',
  'assets/fonts/roboto-700-latin-ext.woff2',
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

  if (url.pathname.endsWith('content.enc.json')) {
    e.respondWith(
      fetch(request)
        .then((rep) => {
          const copie = rep.clone();
          caches.open(VERSION).then((c) => c.put(request, copie));
          return rep;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  const immuable = /\.(woff2|png|jpg|svg|webp)$/.test(url.pathname);

  e.respondWith(
    caches.match(request).then((cache) => {
      const reseau = fetch(request)
        .then((rep) => {
          if (rep.ok) {
            const copie = rep.clone();
            caches.open(VERSION).then((c) => c.put(request, copie));
          }
          return rep;
        })
        .catch(() => cache);

      if (immuable) return cache || reseau;
      // Le cache répond tout de suite, le réseau met à jour pour la prochaine fois.
      if (cache) { e.waitUntil(reseau); return cache; }
      return reseau;
    }),
  );
});
