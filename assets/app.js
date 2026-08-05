/* Soft Landing — Provence Africa Connect
   Application statique. Le contenu vit dans content.enc.json, chiffré (AES-256-GCM).
   Un mode édition permet de corriger le contenu depuis le site, puis de
   régénérer le fichier chiffré prêt à remplacer en ligne. */

(() => {
  'use strict';

  const CONTENT_URL = 'content.enc.json';
  const CLE_SESSION = 'slpac.session';
  const CLE_BROUILLON = 'slpac.draft';
  const ITERATIONS = 250000;
  const TICK_MS = 30000;

  /* ═══════════════════════ Textes d'interface ═══════════════════════ */

  const UI = {
    'gate.label':       { fr: 'Mot de passe de la promotion', en: 'Programme password' },
    'gate.submit':      { fr: 'Entrer', en: 'Enter' },
    'gate.hint':        { fr: 'Espace privé réservé aux participants du programme.', en: 'Private space, programme participants only.' },
    'gate.working':     { fr: 'Déchiffrement…', en: 'Decrypting…' },
    'gate.wrong':       { fr: 'Mot de passe incorrect.', en: 'Wrong password.' },
    'gate.missing':     { fr: 'Contenu introuvable. Lancez « node build.js » pour générer content.enc.json.', en: 'Content not found. Run “node build.js” to generate content.enc.json.' },
    'gate.corrupt':     { fr: 'Le fichier de contenu est illisible.', en: 'The content file is unreadable.' },

    'app.lock':         { fr: 'Verrouiller', en: 'Lock' },
    'app.edit':         { fr: 'Mode édition', en: 'Edit mode' },
    'app.editOff':      { fr: 'Quitter l’édition', en: 'Exit editing' },
    'app.confidential': { fr: 'Document interne — ne pas diffuser', en: 'Internal document — do not circulate' },
    'app.updated':      { fr: 'Mis à jour le', en: 'Updated on' },

    'edit.cancel':      { fr: 'Tout annuler', en: 'Discard all' },
    'edit.json':        { fr: 'content.json', en: 'content.json' },
    'edit.publish':     { fr: 'Publier', en: 'Publish' },
    'edit.count':       { fr: 'Modifications locales, non publiées', en: 'Local changes, not published' },
    'edit.clean':       { fr: 'Mode édition — cliquez un texte pour le corriger', en: 'Edit mode — click any text to correct it' },
    'edit.confirm':     { fr: 'Annuler toutes les modifications locales ?', en: 'Discard all local changes?' },
    'edit.askPwd':      { fr: 'Mot de passe pour chiffrer le fichier publié :', en: 'Password to encrypt the published file:' },
    'edit.shortPwd':    { fr: 'Mot de passe trop court : 8 caractères minimum.', en: 'Password too short: 8 characters minimum.' },
    'edit.done':        { fr: 'content.enc.json téléchargé. Remplacez le fichier sur l’hébergement.', en: 'content.enc.json downloaded. Replace the file on the host.' },
    'edit.add':         { fr: 'Ajouter', en: 'Add' },
    'edit.remove':      { fr: 'Supprimer', en: 'Remove' },
    'edit.removeAsk':   { fr: 'Supprimer cet élément ?', en: 'Remove this item?' },

    'nav.accueil':       { fr: 'Accueil', en: 'Home' },
    'nav.programme':     { fr: 'Programme', en: 'Schedule' },
    'nav.visa':          { fr: 'Visa & Passeport Talent', en: 'Visa & Talent Passport' },
    'nav.business-plan': { fr: 'Business plan en France', en: 'Business plan in France' },
    'nav.interculturel': { fr: 'Navigation interculturelle', en: 'Intercultural navigation' },
    'nav.acteurs':       { fr: 'Acteurs du programme', en: 'Programme actors' },
    'nav.hotels':        { fr: 'Hôtels partenaires', en: 'Partner hotels' },
    'nav.contacts':      { fr: 'Carnet d’adresses', en: 'Address book' },
    'nav.marseille':     { fr: 'Marseille', en: 'Marseille' },
    'nav.installation':  { fr: 'S’installer en France', en: 'Settling in France' },
    'nav.glossaire':     { fr: 'Glossaire', en: 'Glossary' },
    'res.dejeuner-pro': { fr: 'Déjeuner professionnel', en: 'Business lunch' },
    'res.rapide':       { fr: 'Manger vite', en: 'Quick bite' },
    'res.coworking':    { fr: 'Travailler', en: 'Work from there' },

    'st.a-valider':  { fr: 'À valider', en: 'To be validated' },
    'st.partenaire': { fr: 'Partenaire', en: 'Partner' },
    'st.hint': { fr: 'Présélection trouvée par recherche web en août 2026. Rien n’est partenaire du programme tant que ce n’est pas confirmé.', en: 'Shortlist found by web search in August 2026. Nothing is a programme partner until confirmed.' },
    'anc.from':  { fr: 'Distances mesurées depuis', en: 'Distances measured from' },
    'anc.warn':  { fr: 'Ancrage provisoire — cette sélection sera à refaire', en: 'Provisional anchor — this selection will need redoing' },
    'anc.why':   { fr: 'Le bon point de référence serait', en: 'The right reference point would be' },

    'sub.installation': { fr: 'La chaîne des démarches, dans l’ordre. Chaque étape débloque la suivante.', en: 'The chain of formalities, in order. Each step unlocks the next.' },
    'sub.glossaire':    { fr: 'Les mots français que personne ne traduit et sans lesquels aucun formulaire ne se comprend.', en: 'The French words nobody translates, without which no form makes sense.' },

    'inst.when':     { fr: 'Quand', en: 'When' },
    'inst.why':      { fr: 'Pourquoi maintenant', en: 'Why now' },
    'inst.unlocks':  { fr: 'Ce que ça débloque', en: 'What it unlocks' },
    'inst.blocker':  { fr: 'L’obstacle', en: 'The obstacle' },
    'inst.ways':     { fr: 'Comment s’en sortir', en: 'How to get around it' },
    'inst.docs':     { fr: 'À prévoir', en: 'What to bring' },
    'inst.warning':  { fr: 'À lire avant', en: 'Read this first' },
    'inst.urgent':   { fr: 'Numéros d’urgence', en: 'Emergency numbers' },

    'glo.trap':      { fr: 'Le piège', en: 'The catch' },
    'glo.search':    { fr: 'Chercher un mot…', en: 'Search a word…' },
    'glo.entreprise':    { fr: 'Entreprise', en: 'Company' },
    'glo.logement':      { fr: 'Logement', en: 'Housing' },
    'glo.banque':        { fr: 'Banque', en: 'Banking' },
    'glo.sante':         { fr: 'Santé', en: 'Health' },
    'glo.administration':{ fr: 'Administration', en: 'Administration' },

    'now.live':   { fr: 'En ce moment', en: 'Happening now' },
    'now.next':   { fr: 'Prochaine session', en: 'Next session' },
    'now.done':   { fr: 'Le programme est terminé.', en: 'The programme has ended.' },
    'now.tz':     { fr: 'Heures affichées dans votre fuseau. Le programme se déroule à l’heure de Paris.', en: 'Times shown in your timezone. The programme runs on Paris time.' },
    'badge.live': { fr: 'En cours', en: 'Live' },
    'badge.next': { fr: 'À suivre', en: 'Next' },

    'label.speakers':  { fr: 'Intervenants', en: 'Speakers' },
    'label.documents': { fr: 'Pièces à fournir', en: 'Documents required' },
    'label.duration':  { fr: 'Délai', en: 'Timeframe' },
    'label.dos':       { fr: 'À faire', en: 'Do' },
    'label.donts':     { fr: 'À éviter', en: 'Avoid' },
    'label.faq':       { fr: 'Questions fréquentes', en: 'Frequent questions' },
    'label.tracks':    { fr: 'Les voies possibles', en: 'Available tracks' },
    'label.steps':     { fr: 'Les étapes', en: 'The steps' },
    'label.resources': { fr: 'Ressources', en: 'Resources' },
    'label.practical': { fr: 'Repères', en: 'Key facts' },
    'label.booking':   { fr: 'Réservation', en: 'Booking' },
    'label.price':     { fr: 'Tarif', en: 'Price' },
    'label.all':       { fr: 'Tout', en: 'All' },
    'label.explore':   { fr: 'Explorer', en: 'Explore' },
    'label.ics':       { fr: 'Ajouter à mon agenda', en: 'Add to my calendar' },
    'label.icsHint':   { fr: 'Fichier .ics — les heures sont celles de Paris.', en: '.ics file — times are Paris times.' },

    'find.open':    { fr: 'Rechercher', en: 'Search' },
    'find.holder':  { fr: 'Chercher partout : une session, une personne, un lieu…', en: 'Search everything: a session, a person, a place…' },
    'find.empty':   { fr: 'Aucun résultat.', en: 'No results.' },
    'find.hint':    { fr: 'Entrée pour ouvrir · Échap pour fermer', en: 'Enter to open · Esc to close' },

    'off.ready':    { fr: 'Site disponible hors ligne.', en: 'Site available offline.' },

    'action.website': { fr: 'Site web', en: 'Website' },
    'action.map':     { fr: 'Carte', en: 'Map' },
    'action.email':   { fr: 'Écrire', en: 'Email' },
    'action.call':    { fr: 'Appeler', en: 'Call' },

    'search.contacts': { fr: 'Rechercher un nom, une structure…', en: 'Search a name, an organisation…' },
    'search.places':   { fr: 'Rechercher un lieu…', en: 'Search a place…' },
    'search.acteurs':  { fr: 'Rechercher un acteur…', en: 'Search an actor…' },

    'empty.generic': { fr: 'Rien à afficher pour le moment.', en: 'Nothing to show yet.' },
    'empty.search':  { fr: 'Aucun résultat.', en: 'No results.' },
    'empty.field':   { fr: 'À remplir', en: 'To fill' },

    'sub.programme': { fr: 'Le déroulé complet. La session en cours est repérée automatiquement.', en: 'The full schedule. The current session is flagged automatically.' },
    'sub.contacts':  { fr: 'Les personnes du programme et ce sur quoi les solliciter.', en: 'The people of the programme and what to reach out to them about.' },
    'sub.marseille': { fr: 'Où recevoir, où déjeuner, où travailler, où souffler.', en: 'Where to host, eat, work and unwind.' },
    'res.sortir':    { fr: 'Découvrir la ville', en: 'Discover the city' },
    'sub.hotels':    { fr: 'Les établissements partenaires et les conditions négociées.', en: 'Partner venues and negotiated terms.' },
    'sub.acteurs':   { fr: 'L’opérateur, le consortium, les partenaires et les intervenants.', en: 'The operator, the consortium, the partners and the speakers.' },
  };

  /* ═══════════════════════ Icônes, en trait fin ═══════════════════════ */

  const ICONS = {
    accueil: '<path d="M3 10.6 12 3.5l9 7.1"/><path d="M5.6 9.4V20.5h12.8V9.4"/><path d="M10 20.5v-5.4h4v5.4"/>',
    programme: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M8 2.8v4M16 2.8v4M3.5 10h17"/>',
    visa: '<rect x="4" y="3" width="16" height="18" rx="2.5"/><circle cx="12" cy="9.8" r="2.5"/><path d="M8.5 16.6h7"/>',
    'business-plan': '<path d="M4 20.2h16"/><path d="M6.4 20.2v-6.4M11.4 20.2V9.4M16.4 20.2V4.6"/>',
    interculturel: '<circle cx="12" cy="12" r="8.6"/><path d="M3.4 12h17.2"/><path d="M12 3.4c2.6 2.6 3.9 5.5 3.9 8.6s-1.3 6-3.9 8.6c-2.6-2.6-3.9-5.5-3.9-8.6s1.3-6 3.9-8.6Z"/>',
    acteurs: '<circle cx="9.2" cy="8.4" r="3.3"/><path d="M3.4 19.6c0-3.1 2.6-5.2 5.8-5.2s5.8 2.1 5.8 5.2"/><path d="M16.4 5.5a3.1 3.1 0 0 1 0 5.9"/><path d="M17.6 14.7c1.9.6 3.1 2.2 3.1 4.5"/>',
    hotels: '<path d="M3 19.4V9.6"/><path d="M3 13.2h13.6a4.4 4.4 0 0 1 4.4 4.4v1.8"/><circle cx="7.2" cy="9.9" r="2.1"/><path d="M3 19.4h18"/>',
    contacts: '<rect x="5" y="3" width="14.5" height="18" rx="2.5"/><path d="M2.6 8h2.4M2.6 12h2.4M2.6 16h2.4"/><circle cx="12.2" cy="10.2" r="2.3"/><path d="M8.6 16.6c0-2 1.6-3.2 3.6-3.2s3.6 1.2 3.6 3.2"/>',
    marseille: '<path d="M12 21.2s6.6-6.1 6.6-10.6a6.6 6.6 0 1 0-13.2 0C5.4 15.1 12 21.2 12 21.2Z"/><circle cx="12" cy="10.5" r="2.4"/>',
    pin: '<path d="M12 21.2s6.6-6.1 6.6-10.6a6.6 6.6 0 1 0-13.2 0C5.4 15.1 12 21.2 12 21.2Z"/><circle cx="12" cy="10.5" r="2.4"/>',
    user: '<circle cx="12" cy="8" r="3.4"/><path d="M5.4 20.2c0-3.4 3-5.6 6.6-5.6s6.6 2.2 6.6 5.6"/>',
    walk: '<circle cx="13" cy="4.4" r="1.9"/><path d="M11 21.4l2-6.2-2.4-2.6.8-4.4 3.4 2 2.6 1.4"/><path d="M10.6 8.2 7.8 10l-1 3.6"/><path d="m13.4 15.4 2.4 2.6.9 3.4"/>',
    speech: '<path d="M3.5 5.5h11.8v8H8.8L5 17V13.5H3.5Z"/><path d="M18 9h2.5v8H19v3.2L16 17h-4.2"/>',
    arrow: '<path d="M4.5 12h15"/><path d="m13.2 5.6 6.3 6.4-6.3 6.4"/>',
    link: '<path d="M10.5 13.5a4.2 4.2 0 0 0 6.2.4l2.4-2.4a4.2 4.2 0 0 0-5.9-5.9l-1.4 1.3"/><path d="M13.5 10.5a4.2 4.2 0 0 0-6.2-.4l-2.4 2.4a4.2 4.2 0 0 0 5.9 5.9l1.4-1.3"/>',
    mail: '<rect x="2.8" y="5" width="18.4" height="14" rx="2.4"/><path d="m3.4 7 8.6 6 8.6-6"/>',
    phone: '<path d="M6.2 3.6h3l1.6 4-2 1.4a12 12 0 0 0 6.2 6.2l1.4-2 4 1.6v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.2 5.8a2 2 0 0 1 2-2.2Z"/>',
    sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.2M12 19.2v2.2M21.4 12h-2.2M4.8 12H2.6M18.6 5.4l-1.6 1.6M7 17l-1.6 1.6M18.6 18.6 17 17M7 7 5.4 5.4"/>',
    moon: '<path d="M20.4 13.6A8.4 8.4 0 1 1 10.4 3.6a6.6 6.6 0 0 0 10 10Z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    restaurants: '<path d="M6.4 3.4v7a2.6 2.6 0 0 0 5.2 0v-7"/><path d="M9 3.4v17.2"/><path d="M17.6 3.4c-1.8 1.4-2.6 3.4-2.6 6s.9 3 2.6 3v8.2"/>',
    installation: '<circle cx="6" cy="6.4" r="2.6"/><circle cx="18" cy="17.6" r="2.6"/><path d="M8.6 6.4h5.4a3.6 3.6 0 0 1 0 7.2h-4a3.6 3.6 0 0 0 0 7.2"/>',
    glossaire: '<path d="M4 4.6h6a3 3 0 0 1 3 3v12a2.4 2.4 0 0 0-2.4-2.4H4Z"/><path d="M20 4.6h-6a3 3 0 0 0-3 3v12a2.4 2.4 0 0 1 2.4-2.4H20Z"/>',
    alert: '<path d="M12 3.6 21.4 20H2.6Z"/><path d="M12 9.6v4.4M12 17.2h.01"/>',
    search: '<circle cx="11" cy="11" r="6.6"/><path d="m16 16 4.6 4.6"/>',
    download: '<path d="M12 3.6v11.4"/><path d="m7.4 10.4 4.6 4.6 4.6-4.6"/><path d="M4.4 19.4h15.2"/>',
    trash: '<path d="M4 6.5h16"/><path d="M9 6.5V4.2h6v2.3"/><path d="M6.4 6.5 7.3 20h9.4l.9-13.5"/>',
  };

  const svg = (nom, taille = 18) => (ICONS[nom]
    ? `<svg viewBox="0 0 24 24" width="${taille}" height="${taille}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[nom]}</svg>`
    : '');

  const SECTIONS = ['accueil', 'programme', 'installation', 'glossaire', 'visa',
                    'business-plan', 'interculturel', 'acteurs', 'hotels',
                    'contacts', 'marseille'];

  /* Les listes qu'on peut allonger ou raccourcir en mode édition. */
  const MODELES = {
    programme: () => ({ date: new Date().toISOString().slice(0, 10), start: '09:00', end: '10:00', type: '',
                        title: { fr: '', en: '' }, description: { fr: '', en: '' },
                        location: { name: '', address: '', map: '' }, speakers: [], resources: [] }),
    acteurs: () => ({ name: '', role: { fr: '', en: '' }, description: { fr: '', en: '' },
                      website: '', contact: { email: '', phone: '' }, tags: [] }),
    hotels: () => ({ name: '', address: '', district: '', distance: { fr: '', en: '' }, priceRange: '',
                     booking: { contact: '', code: { fr: '', en: '' } }, notes: { fr: '', en: '' }, website: '', map: '' }),
    contacts: () => ({ name: '', org: '', role: { fr: '', en: '' }, email: '', phone: '', linkedin: '',
                       website: '', languages: [], tags: [], note: { fr: '', en: '' } }),
    marseille: () => ({ name: '', category: 'dejeuner-pro', district: '', address: '',
                        distance: { fr: '', en: '' }, why: { fr: '', en: '' },
                        priceLevel: '', website: '', map: '', statut: 'a-valider' }),
    glossaire: () => ({ terme: '', categorie: 'administration',
                        definition: { fr: '', en: '' }, piege: { fr: '', en: '' } }),

  };

  /* ═══════════════════════ État ═══════════════════════ */

  const state = {
    /* Clair par défaut ; le sombre ne s'applique que si on l'a choisi. */
    theme: localStorage.getItem('slpac.theme') === 'dark' ? 'dark' : 'light',
    lang: localStorage.getItem('slpac.lang') === 'en' ? 'en' : 'fr',
    data: null,
    section: 'accueil',
    filters: {},
    editing: false,
    dirty: false,
    timer: null,
  };

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  /* ═══════════════════════ Texte ═══════════════════════ */

  const ui = (cle) => (UI[cle] ? UI[cle][state.lang] || UI[cle].fr : cle);

  function t(v) {
    if (v == null) return '';
    if (typeof v === 'string' || typeof v === 'number') return String(v);
    if (typeof v === 'object') return v[state.lang] || v.fr || v.en || '';
    return '';
  }

  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const markTodo = (html) => html.replace(/(A REMPLIR|À REMPLIR|TO FILL)/g, '<span class="todo">$1</span>');

  /* En lecture : le texte, avec les marqueurs surlignés.
     En édition : le même texte, mais modifiable et relié à son chemin JSON. */
  function field(chemin, valeur, options = {}) {
    const brut = t(valeur);
    if (!state.editing) return markTodo(esc(brut));
    const bilingue = valeur !== null && typeof valeur === 'object' && !Array.isArray(valeur);
    const cible = bilingue ? `${chemin}.${state.lang}` : chemin;
    return `<span class="ed" data-path="${esc(cible)}" data-vide="${esc(options.vide || ui('empty.field'))}"`
         + ` contenteditable="plaintext-only" spellcheck="false">${esc(brut)}</span>`;
  }

  const list = (v) => (Array.isArray(v) ? v : []);
  /* En édition, tout s'affiche : un champ vide doit rester atteignable. */
  const filled = (v) => state.editing || t(v).trim().length > 0;

  function href(v) {
    const s = String(v ?? '').trim();
    return /^(https?:\/\/|mailto:|tel:)/i.test(s) ? esc(s) : '';
  }

  function lien(url, texte, icone) {
    const safe = href(url);
    return safe
      ? `<a class="btn" href="${safe}" target="_blank" rel="noopener noreferrer">${icone ? svg(icone, 14) : ''}${esc(texte)}</a>`
      : '';
  }

  const vide = (msg) => `<div class="empty">${esc(msg || ui('empty.generic'))}</div>`;
  const meta = (icone, html) => `<span class="meta">${svg(icone, 14)}${html}</span>`;

  /* Monogramme : deux initiales, teintées dans une gamme dérivée de la marque. */
  const TEINTES = [24, 234, 12, 208, 38, 260];
  function mono(nom) {
    const propre = String(nom || '?').trim();
    const initiales = propre.split(/\s+/).filter(Boolean).slice(0, 2)
      .map((m) => m[0]).join('').toUpperCase() || '?';
    let h = 0;
    for (const c of propre) h = (h * 31 + c.charCodeAt(0)) % 9973;
    return `<span class="mono" style="--h:${TEINTES[h % TEINTES.length]}" aria-hidden="true">${esc(initiales)}</span>`;
  }

  /* ═══════════════════════ Chemins JSON ═══════════════════════ */

  const lire = (obj, chemin) => chemin.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);

  function ecrire(obj, chemin, valeur) {
    const cles = chemin.split('.');
    const derniere = cles.pop();
    let cible = obj;
    for (const k of cles) {
      if (cible[k] == null || typeof cible[k] !== 'object') cible[k] = {};
      cible = cible[k];
    }
    cible[derniere] = valeur;
  }

  /* ═══════════════════════ Chiffrement ═══════════════════════ */

  const b64 = (v) => Uint8Array.from(atob(v), (c) => c.charCodeAt(0));
  const versB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));

  async function derive(mdp, sel, iterations, usages) {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(mdp), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: sel, iterations, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, usages);
  }

  async function dechiffrer(mdp, enveloppe) {
    const cle = await derive(mdp, b64(enveloppe.salt), enveloppe.iterations, ['decrypt']);
    const clair = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(enveloppe.iv) }, cle, b64(enveloppe.ciphertext));
    return JSON.parse(new TextDecoder().decode(clair));
  }

  /* Le pendant exact de build.js, côté navigateur. */
  async function chiffrer(mdp, donnees) {
    const sel = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cle = await derive(mdp, sel, ITERATIONS, ['encrypt']);
    const chiffre = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv }, cle, new TextEncoder().encode(JSON.stringify(donnees)));
    return {
      v: 1, kdf: 'PBKDF2-SHA256', iterations: ITERATIONS,
      salt: versB64(sel), iv: versB64(iv), ciphertext: versB64(chiffre),
      builtAt: new Date().toISOString(),
    };
  }

  let enveloppePromise = null;
  function chargerEnveloppe() {
    if (!enveloppePromise) {
      enveloppePromise = fetch(CONTENT_URL, { cache: 'no-store' }).then((r) => {
        if (!r.ok) throw new Error('missing');
        return r.json();
      });
    }
    return enveloppePromise;
  }

  /* ═══════════════════════ Porte d'entrée ═══════════════════════ */

  function erreurPorte(msg) {
    const n = $('#gate-error');
    n.textContent = msg;
    n.hidden = !msg;
  }

  async function ouvrir(mdp, { silencieux = false } = {}) {
    const bouton = $('#gate-form button[type="submit"]');
    if (!silencieux) { bouton.disabled = true; bouton.textContent = ui('gate.working'); }
    erreurPorte('');
    try {
      const donnees = await dechiffrer(mdp, await chargerEnveloppe());
      sessionStorage.setItem(CLE_SESSION, mdp);
      const brouillon = sessionStorage.getItem(CLE_BROUILLON);
      if (brouillon) {
        try { state.data = JSON.parse(brouillon); state.dirty = true; }
        catch { state.data = donnees; }
      } else {
        state.data = donnees;
      }
      demarrer();
      return true;
    } catch (e) {
      if (!silencieux) {
        if (e && e.message === 'missing') erreurPorte(ui('gate.missing'));
        else if (e instanceof SyntaxError) erreurPorte(ui('gate.corrupt'));
        else erreurPorte(ui('gate.wrong'));
      }
      sessionStorage.removeItem(CLE_SESSION);
      return false;
    } finally {
      bouton.disabled = false;
      bouton.textContent = ui('gate.submit');
    }
  }

  /* ═══════════════════════ Mode édition ═══════════════════════ */

  /* Le brouillon vit en sessionStorage, pas en localStorage : il contient des
     données personnelles et disparaît à la fermeture du navigateur. Seul
     l'export le rend durable. */
  function sauverBrouillon() {
    try { sessionStorage.setItem(CLE_BROUILLON, JSON.stringify(state.data)); } catch {}
  }

  function marquerModifie() {
    state.dirty = true;
    indexCache = null;   /* le contenu a bougé : l'index de recherche aussi */
    sauverBrouillon();
    majBarreEdition();
  }

  function majBarreEdition() {
    const barre = $('#editbar');
    barre.hidden = !state.editing;
    $('#editbar-count').innerHTML = state.dirty
      ? `<b>●</b> ${esc(ui('edit.count'))}`
      : esc(ui('edit.clean'));
    $('#edit-cancel').disabled = !state.dirty;
    $('#edit-json').disabled = false;
    $('#edit-publish').disabled = false;
    $('#edit-toggle').textContent = state.editing ? ui('app.editOff') : ui('app.edit');
    document.body.classList.toggle('editing', state.editing);
  }

  function basculerEdition() {
    state.editing = !state.editing;
    majBarreEdition();
    afficherSection();
  }

  function telecharger(nom, contenu, type) {
    const url = URL.createObjectURL(new Blob([contenu], { type }));
    const a = document.createElement('a');
    a.href = url; a.download = nom;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function publier() {
    const mdp = prompt(ui('edit.askPwd'), sessionStorage.getItem(CLE_SESSION) || '');
    if (mdp === null) return;
    if (mdp.length < 8) { alert(ui('edit.shortPwd')); return; }
    const enveloppe = await chiffrer(mdp, state.data);
    telecharger('content.enc.json', JSON.stringify(enveloppe, null, 2) + '\n', 'application/json');
    alert(ui('edit.done'));
  }

  /* ═══════════════════════ Programme ═══════════════════════ */

  function bornes(item) {
    const d = String(item.date || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
    const debut = /^\d{2}:\d{2}$/.test(item.start || '') ? item.start : '00:00';
    const fin = /^\d{2}:\d{2}$/.test(item.end || '') ? item.end : null;
    const de = new Date(`${d}T${debut}:00`);
    if (Number.isNaN(de.getTime())) return null;
    const a = fin ? new Date(`${d}T${fin}:00`) : new Date(de.getTime() + 3600000);
    return { de, a: a > de ? a : new Date(de.getTime() + 3600000) };
  }

  function modeleProgramme(maintenant = new Date()) {
    const sessions = list(state.data.programme)
      .map((item, index) => ({ item, index, b: bornes(item) }))
      .filter((r) => r.b)
      .sort((x, y) => x.b.de - y.b.de);

    const enCours = sessions.filter((r) => r.b.de <= maintenant && maintenant <= r.b.a);
    const suivante = sessions.find((r) => r.b.de > maintenant) || null;

    const jours = [];
    sessions.forEach((r) => {
      let j = jours.find((d) => d.cle === r.item.date);
      if (!j) { j = { cle: r.item.date, lignes: [] }; jours.push(j); }
      j.lignes.push(r);
    });
    return { sessions, enCours, suivante, jours };
  }

  const locale = () => (state.lang === 'en' ? 'en-GB' : 'fr-FR');

  function jourLong(cle) {
    const d = new Date(`${cle}T12:00:00`);
    if (Number.isNaN(d.getTime())) return cle;
    const texte = d.toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' });
    /* En français les mois ne prennent pas de majuscule : seule la première
       lettre monte, ce qu'une capitalisation CSS ne sait pas faire. */
    return texte.charAt(0).toUpperCase() + texte.slice(1);
  }

  function dateLongue(v) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    const d = new Date(`${v}T12:00:00`);
    return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function rendreProgramme() {
    const maintenant = new Date();
    const m = modeleProgramme(maintenant);
    if (!m.sessions.length && !state.editing) return vide();

    const tz = state.data.meta && state.data.meta.timezone
      && Intl.DateTimeFormat().resolvedOptions().timeZone !== state.data.meta.timezone;

    let banniere;
    if (m.enCours.length) {
      banniere = `<div class="now now--live"><span class="now__dot"></span>
        <span class="eyebrow now__k">${esc(ui('now.live'))}</span>
        <span>${field(`programme.${m.enCours[0].index}.title`, m.enCours[0].item.title)}</span></div>`;
    } else if (m.suivante) {
      banniere = `<div class="now"><span class="eyebrow now__k">${esc(ui('now.next'))}</span>
        <span class="num">${esc(m.suivante.item.start || '')}</span>
        <span>${field(`programme.${m.suivante.index}.title`, m.suivante.item.title)}</span></div>`;
    } else {
      banniere = `<div class="now"><span class="eyebrow now__k">${esc(ui('now.done'))}</span></div>`;
    }

    const jours = m.jours.map((j) => {
      const lignes = j.lignes.map((r) => {
        const { item, b, index } = r;
        const live = b.de <= maintenant && maintenant <= b.a;
        const suivante = m.suivante && m.suivante.index === index && !live;
        const passe = b.a < maintenant;
        const cls = ['slot', live ? 'slot--live' : '', suivante ? 'slot--next' : '', passe ? 'slot--past' : '']
          .filter(Boolean).join(' ');

        const badge = live ? `<span class="badge">${esc(ui('badge.live'))}</span>`
          : suivante ? `<span class="badge badge--next">${esc(ui('badge.next'))}</span>` : '';

        const lieu = item.location || {};
        const infos = [];
        if (filled(lieu.name)) infos.push(meta('pin', field(`programme.${index}.location.name`, lieu.name)));
        if (list(item.speakers).length) infos.push(meta('user', `${esc(ui('label.speakers'))} : ${list(item.speakers).map((s) => esc(t(s))).join(', ')}`));
        if (filled(item.type)) infos.push(`<span class="tag">${field(`programme.${index}.type`, item.type)}</span>`);

        const ressources = list(item.resources)
          .map((res) => lien(res.url, t(res.label) || ui('label.resources'), 'link'))
          .filter(Boolean).join('');

        return `<article class="${cls}">
          <div class="slot__when">
            <span class="slot__h num">${field(`programme.${index}.start`, item.start)}</span>
            <span class="slot__e num">${field(`programme.${index}.end`, item.end)}</span>
          </div>
          <div class="slot__body">
            <h3 class="slot__t">${field(`programme.${index}.title`, item.title)}${badge}</h3>
            ${filled(item.description) ? `<p class="slot__d">${field(`programme.${index}.description`, item.description)}</p>` : ''}
            ${infos.length ? `<div class="slot__m">${infos.join('')}</div>` : ''}
            ${ressources ? `<div class="slot__a">${ressources}</div>` : ''}
            ${boutonsLigne('programme', index)}
          </div>
        </article>`;
      }).join('');

      return `<section class="day">
        <div class="day__head"><h2 class="day__n">${esc(jourLong(j.cle))}</h2><span class="day__c num">${j.lignes.length}</span></div>
        <div class="line">${lignes}</div>
      </section>`;
    }).join('');

    const agenda = m.sessions.length
      ? `<div class="tools"><button type="button" class="btn btn--primary" id="ics">${svg('download', 15)}${esc(ui('label.ics'))}</button>
           <span class="find__d">${esc(ui('label.icsHint'))}</span></div>`
      : '';

    return banniere
      + (tz ? `<p class="day__c" style="margin-bottom:var(--s5)">${esc(ui('now.tz'))}</p>` : '')
      + agenda
      + jours
      + boutonAjout('programme');
  }

  /* ═══════════════════════ Fragments d'édition ═══════════════════════ */

  /* Un badge visible vaut mieux qu'une note en bas de page : tant que Jade n'a
     pas confirmé, personne ne doit croire que l'adresse est réservée. */
  const badgeStatut = (statut) => (statut && statut !== 'partenaire'
    ? `<span class="tag tag--todo">${esc(ui(`st.${statut}`))}</span>`
    : statut === 'partenaire' ? `<span class="tag tag--ok">${esc(ui('st.partenaire'))}</span>` : '');

  const boutonsLigne = (liste, index) => (state.editing
    ? `<div class="rowtools"><button type="button" class="btn" data-del="${liste}.${index}">${svg('trash', 13)}${esc(ui('edit.remove'))}</button></div>`
    : '');

  /* Un seul point de référence pour toutes les distances. Le nommer une fois
     en tête de page évite d'avoir à le répéter — et à le corriger partout — dans
     chaque fiche le jour où il change. */
  function bandeauAncrage() {
    const a = (state.data.meta || {}).ancrage;
    if (!a) return '';
    const provisoire = a.provisoire === true;
    return `<div class="anc${provisoire ? ' anc--warn' : ''}">
      ${provisoire ? `<span class="anc__i">${svg('alert', 16)}</span>` : `<span class="anc__i">${svg('pin', 16)}</span>`}
      <div>
        <p class="eyebrow">${esc(provisoire ? ui('anc.warn') : ui('anc.from'))}</p>
        <p class="anc__t"><strong>${field('meta.ancrage.nom', a.nom)}</strong> — ${field('meta.ancrage.adresse', a.adresse)}</p>
        ${provisoire && filled(a.remplacePar)
          ? `<p class="anc__w">${esc(ui('anc.why'))} ${field('meta.ancrage.remplacePar', a.remplacePar)}.</p>` : ''}
      </div>
    </div>`;
  }

  const boutonAjout = (liste) => (state.editing
    ? `<button type="button" class="btn listadd" data-add="${liste}">${svg('plus', 14)}${esc(ui('edit.add'))}</button>`
    : '');

  /* ═══════════════════════ Sections ═══════════════════════ */

  function entete(titre, chapo) {
    return `<header class="head">
      <p class="eyebrow">${esc(t(state.data.site && state.data.site.subtitle) || 'Provence Africa Connect')}</p>
      <h1>${esc(titre)}</h1>
      ${chapo ? `<p class="head__lede">${chapo}</p>` : ''}
    </header>`;
  }

  function rendreAccueil() {
    const site = state.data.site || {};
    const home = state.data.home || {};
    const m = state.data.meta || {};

    const reperes = list(home.practical).filter((p) => filled(p.value)).map((p, i) => `
      <div class="stat">
        <p class="stat__k">${field(`home.practical.${i}.label`, p.label)}</p>
        <p class="stat__v">${field(`home.practical.${i}.value`, p.value)}</p>
      </div>`).join('');

    const tuiles = list(home.highlights).map((h, i) => {
      const cible = typeof h.link === 'string' && h.link.startsWith('#') ? esc(h.link) : '';
      const balise = cible && !state.editing ? 'a' : 'div';
      const attr = cible && !state.editing ? ` href="${cible}"` : '';
      return `<${balise} class="tile"${attr}>
        <p class="tile__t">${field(`home.highlights.${i}.label`, h.label)}</p>
        <p class="tile__d">${field(`home.highlights.${i}.text`, h.text)}</p>
        ${cible ? `<span class="tile__go">${esc(ui('label.explore'))}${svg('arrow', 15)}</span>` : ''}
      </${balise}>`;
    }).join('');

    const dates = [m.startDate, m.endDate].filter(filled).map((d) => dateLongue(t(d)));

    return `<div class="hero">
        <h1>${field('site.title', site.title)}</h1>
        <p class="hero__lede">${field('site.tagline', site.tagline)}</p>
        ${filled(home.intro) ? `<p class="hero__intro">${field('home.intro', home.intro)}</p>` : ''}
        <div class="hero__cta">
          <a class="btn btn--primary" href="#programme">${svg('programme', 15)}${esc(ui('nav.programme'))}</a>
          <a class="btn" href="#contacts">${svg('contacts', 15)}${esc(ui('nav.contacts'))}</a>
        </div>
        ${dates.length ? `<div class="stats"><div class="stat">
            <p class="stat__k">${esc(state.lang === 'en' ? 'Dates' : 'Dates')}</p>
            <p class="stat__v num">${markTodo(esc(dates.join(' → ')))}</p>
          </div>${reperes}</div>` : (reperes ? `<div class="stats">${reperes}</div>` : '')}
      </div>

      ${tuiles ? `<section class="section"><div class="section__head">
          <h2>${esc(state.lang === 'en' ? 'Go straight to' : 'Aller droit au but')}</h2></div>
        <div class="grid grid--2">${tuiles}</div></section>` : ''}`;
  }

  function rendreVisa() {
    const v = state.data.visa || {};
    const voies = list(v.tracks).map((tr, i) => `
      <article class="card">
        <p class="card__title">${field(`visa.tracks.${i}.name`, tr.name)}</p>
        <p class="card__text">${field(`visa.tracks.${i}.who`, tr.who)}</p>
      </article>`).join('');

    const etapes = list(v.steps).map((s, i) => {
      const docs = list(s.documents).filter(filled);
      const liens = list(s.links).map((l) => lien(l.url, t(l.label), 'link')).filter(Boolean).join('');
      return `<article class="step">
        <h3 class="step__t">${field(`visa.steps.${i}.title`, s.title)}</h3>
        ${filled(s.body) ? `<p class="step__b">${field(`visa.steps.${i}.body`, s.body)}</p>` : ''}
        ${docs.length ? `<div><p class="eyebrow">${esc(ui('label.documents'))}</p>
            <ul class="step__list">${docs.map((d, k) => `<li>${field(`visa.steps.${i}.documents.${k}`, d)}</li>`).join('')}</ul></div>` : ''}
        ${filled(s.duration) ? `<p class="card__meta">${esc(ui('label.duration'))} : ${field(`visa.steps.${i}.duration`, s.duration)}</p>` : ''}
        ${liens ? `<div class="card__acts">${liens}</div>` : ''}
      </article>`;
    }).join('');

    const faq = list(v.faq).filter((f) => filled(f.q)).map((f, i) => `
      <article class="step">
        <h3 class="step__t">${field(`visa.faq.${i}.q`, f.q)}</h3>
        <p class="step__b">${field(`visa.faq.${i}.a`, f.a)}</p>
      </article>`).join('');

    return entete(ui('nav.visa'), filled(v.intro) ? field('visa.intro', v.intro) : '')
      + (voies ? `<section class="section"><div class="section__head"><h2>${esc(ui('label.tracks'))}</h2></div><div class="grid grid--2">${voies}</div></section>` : '')
      + (etapes ? `<section class="section"><div class="section__head"><h2>${esc(ui('label.steps'))}</h2></div>${etapes}</section>` : '')
      + (faq ? `<section class="section"><div class="section__head"><h2>${esc(ui('label.faq'))}</h2></div>${faq}</section>` : '')
      + (!voies && !etapes && !faq ? vide() : '');
  }

  function rendreBusinessPlan() {
    const bp = state.data.businessPlan || {};
    const blocs = list(bp.sections).map((s, i) => {
      const checks = list(s.checklist).filter(filled);
      return `<article class="step">
        <h3 class="step__t">${field(`businessPlan.sections.${i}.title`, s.title)}</h3>
        ${filled(s.body) ? `<p class="step__b">${field(`businessPlan.sections.${i}.body`, s.body)}</p>` : ''}
        ${checks.length ? `<ul class="checks">${checks.map((c, k) => `<li>${field(`businessPlan.sections.${i}.checklist.${k}`, c)}</li>`).join('')}</ul>` : ''}
      </article>`;
    }).join('');

    const ressources = list(bp.resources).map((r) => lien(r.url, t(r.label), 'link')).filter(Boolean).join('');

    return entete(ui('nav.business-plan'), filled(bp.intro) ? field('businessPlan.intro', bp.intro) : '')
      + (blocs || vide())
      + (ressources ? `<section class="section"><div class="section__head"><h2>${esc(ui('label.resources'))}</h2></div><div class="card__acts">${ressources}</div></section>` : '');
  }

  function rendreInterculturel() {
    const ic = state.data.interculturel || {};
    const sujets = list(ic.topics).map((tp, i) => {
      const oui = list(tp.dos).filter(filled);
      const non = list(tp.donts).filter(filled);
      const colonnes = (oui.length || non.length) ? `<div class="split">
          ${oui.length ? `<div class="split__col split__col--y"><h4>${esc(ui('label.dos'))}</h4><ul>${oui.map((d, k) => `<li>${field(`interculturel.topics.${i}.dos.${k}`, d)}</li>`).join('')}</ul></div>` : ''}
          ${non.length ? `<div class="split__col split__col--n"><h4>${esc(ui('label.donts'))}</h4><ul>${non.map((d, k) => `<li>${field(`interculturel.topics.${i}.donts.${k}`, d)}</li>`).join('')}</ul></div>` : ''}
        </div>` : '';
      return `<article class="step">
        <h3 class="step__t">${field(`interculturel.topics.${i}.title`, tp.title)}</h3>
        ${filled(tp.body) ? `<p class="step__b">${field(`interculturel.topics.${i}.body`, tp.body)}</p>` : ''}
        ${colonnes}
      </article>`;
    }).join('');

    return entete(ui('nav.interculturel'), filled(ic.intro) ? field('interculturel.intro', ic.intro) : '')
      + (sujets || vide());
  }

  const foin = (parts) => parts.filter(Boolean).map((p) => t(p)).join(' ').toLowerCase();

  function rendreActeurs() {
    const q = (state.filters.acteurs || '').toLowerCase();
    const tout = list(state.data.acteurs);
    const cartes = tout.map((a, i) => ({ a, i }))
      .filter(({ a }) => !q || foin([a.name, a.role, a.description, ...list(a.tags)]).includes(q))
      .map(({ a, i }) => {
        const c = a.contact || {};
        const actions = [
          lien(a.website, ui('action.website'), 'link'),
          c.email ? lien(`mailto:${c.email}`, ui('action.email'), 'mail') : '',
          c.phone ? lien(`tel:${String(c.phone).replace(/[^\d+]/g, '')}`, ui('action.call'), 'phone') : '',
        ].filter(Boolean).join('');

        return `<article class="card">
          <div class="card__top">${mono(t(a.name))}
            <div>
              <p class="card__title">${field(`acteurs.${i}.name`, a.name)}</p>
              ${filled(a.role) ? `<p class="card__role">${field(`acteurs.${i}.role`, a.role)}</p>` : ''}
            </div>
          </div>
          ${filled(a.description) ? `<p class="card__text">${field(`acteurs.${i}.description`, a.description)}</p>` : ''}
          ${list(a.tags).length ? `<div class="tags">${list(a.tags).map((tg) => `<span class="tag">${esc(t(tg))}</span>`).join('')}</div>` : ''}
          ${actions ? `<div class="card__acts">${actions}</div>` : ''}
          ${boutonsLigne('acteurs', i)}
        </article>`;
      }).join('');

    return entete(ui('nav.acteurs'), esc(ui('sub.acteurs')))
      + `<div class="tools"><input class="search" type="search" data-filter="acteurs"
            value="${esc(state.filters.acteurs || '')}" placeholder="${esc(ui('search.acteurs'))}"></div>`
      + (cartes ? `<div class="grid grid--2">${cartes}</div>` : vide(q ? ui('empty.search') : ''))
      + boutonAjout('acteurs');
  }

  function rendreHotels() {
    const cartes = list(state.data.hotels).map((h, i) => {
      const b = h.booking || {};
      const infos = [];
      if (filled(h.district)) infos.push(meta('pin', field(`hotels.${i}.district`, h.district)));
      if (filled(h.distance)) infos.push(meta('walk', field(`hotels.${i}.distance`, h.distance)));
      if (filled(h.priceRange)) infos.push(`<span class="tag">${field(`hotels.${i}.priceRange`, h.priceRange)}</span>`);

      const resa = (filled(b.contact) || filled(b.code))
        ? `<p class="card__text"><span class="eyebrow">${esc(ui('label.booking'))}</span><br>
             ${field(`hotels.${i}.booking.contact`, b.contact)} ${field(`hotels.${i}.booking.code`, b.code)}</p>` : '';

      const actions = [lien(h.website, ui('action.website'), 'link'), lien(h.map, ui('action.map'), 'pin')]
        .filter(Boolean).join('');

      return `<article class="card">
        <div class="card__top">${mono(t(h.name))}
          <div>
            <p class="card__title">${field(`hotels.${i}.name`, h.name)} ${badgeStatut(h.statut)}</p>
            ${filled(h.address) ? `<p class="card__role">${field(`hotels.${i}.address`, h.address)}</p>` : ''}
          </div>
        </div>
        ${infos.length ? `<div class="card__meta">${infos.join('')}</div>` : ''}
        ${resa}
        ${filled(h.notes) ? `<p class="card__text">${field(`hotels.${i}.notes`, h.notes)}</p>` : ''}
        ${actions ? `<div class="card__acts">${actions}</div>` : ''}
        ${boutonsLigne('hotels', i)}
      </article>`;
    }).join('');

    return entete(ui('nav.hotels'), esc(ui('sub.hotels')))
      + bandeauAncrage()
      + `<p class="note">${esc(ui('st.hint'))}</p>`
      + (cartes ? `<div class="grid grid--2">${cartes}</div>` : vide())
      + boutonAjout('hotels');
  }

  function rendreContacts() {
    const q = (state.filters.contacts || '').toLowerCase();
    const cartes = list(state.data.contacts).map((c, i) => ({ c, i }))
      .filter(({ c }) => !q || foin([c.name, c.org, c.role, c.note, ...list(c.tags)]).includes(q))
      .map(({ c, i }) => {
        const actions = [
          c.email ? lien(`mailto:${c.email}`, ui('action.email'), 'mail') : '',
          c.phone ? lien(`tel:${String(c.phone).replace(/[^\d+]/g, '')}`, ui('action.call'), 'phone') : '',
          lien(c.website, ui('action.website'), 'link'),
          lien(c.linkedin, 'LinkedIn', 'link'),
        ].filter(Boolean).join('');

        const infos = [];
        if (filled(c.org)) infos.push(`<span>${field(`contacts.${i}.org`, c.org)}</span>`);
        if (list(c.languages).length) infos.push(meta('speech', list(c.languages).map((l) => esc(String(l).toUpperCase())).join(' / ')));

        return `<article class="card">
          <div class="card__top">${mono(t(c.name))}
            <div>
              <p class="card__title">${field(`contacts.${i}.name`, c.name)}</p>
              ${filled(c.role) ? `<p class="card__role">${field(`contacts.${i}.role`, c.role)}</p>` : ''}
            </div>
          </div>
          ${infos.length ? `<div class="card__meta">${infos.join('')}</div>` : ''}
          ${filled(c.note) ? `<p class="card__text">${field(`contacts.${i}.note`, c.note)}</p>` : ''}
          ${list(c.tags).length ? `<div class="tags">${list(c.tags).map((tg) => `<span class="tag tag--accent">${esc(t(tg))}</span>`).join('')}</div>` : ''}
          ${actions ? `<div class="card__acts">${actions}</div>` : ''}
          ${boutonsLigne('contacts', i)}
        </article>`;
      }).join('');

    return entete(ui('nav.contacts'), esc(ui('sub.contacts')))
      + `<div class="tools"><input class="search" type="search" data-filter="contacts"
            value="${esc(state.filters.contacts || '')}" placeholder="${esc(ui('search.contacts'))}"></div>`
      + (cartes ? `<div class="grid grid--2">${cartes}</div>` : vide(q ? ui('empty.search') : ''))
      + boutonAjout('contacts');
  }

  function rendreInstallation() {
    const inst = state.data.installation || {};

    const alerte = filled(inst.avertissement) ? `
      <div class="warn">
        <span class="warn__i">${svg('alert', 17)}</span>
        <div><p class="eyebrow">${esc(ui('inst.warning'))}</p>
          <p class="warn__t">${field('installation.avertissement', inst.avertissement)}</p></div>
      </div>` : '';

    const bloc = (cle, titre, contenu) => (contenu
      ? `<div class="etape__b"><p class="eyebrow">${esc(ui(cle))}</p>${contenu}</div>` : '');

    const etapes = list(inst.etapes).map((e, i) => {
      const sorties = list(e.solutions).filter(filled);
      const pieces = list(e.documents).filter(filled);
      const liens = list(e.liens).map((l) => lien(l.url, l.label, 'link')).filter(Boolean).join('');

      return `<article class="etape">
        <div class="etape__n"><span class="etape__num num">${i}</span></div>
        <div class="etape__c">
          <h3 class="etape__t">${field(`installation.etapes.${i}.titre`, e.titre)}</h3>
          ${filled(e.quand) ? `<p class="etape__q">${svg('programme', 13)}${field(`installation.etapes.${i}.quand`, e.quand)}</p>` : ''}

          ${bloc('inst.why', 0, filled(e.pourquoi) ? `<p class="etape__p">${field(`installation.etapes.${i}.pourquoi`, e.pourquoi)}</p>` : '')}
          ${bloc('inst.unlocks', 0, filled(e.debloque) ? `<p class="etape__p">${field(`installation.etapes.${i}.debloque`, e.debloque)}</p>` : '')}
          ${filled(e.obstacle) ? `<div class="etape__stop"><p class="eyebrow">${esc(ui('inst.blocker'))}</p>
              <p>${field(`installation.etapes.${i}.obstacle`, e.obstacle)}</p></div>` : ''}
          ${sorties.length ? `<div class="etape__b"><p class="eyebrow">${esc(ui('inst.ways'))}</p>
              <ul class="checks">${sorties.map((x, k) => `<li>${field(`installation.etapes.${i}.solutions.${k}`, x)}</li>`).join('')}</ul></div>` : ''}
          ${pieces.length ? `<div class="etape__b"><p class="eyebrow">${esc(ui('inst.docs'))}</p>
              <ul class="step__list">${pieces.map((x, k) => `<li>${field(`installation.etapes.${i}.documents.${k}`, x)}</li>`).join('')}</ul></div>` : ''}
          ${liens ? `<div class="card__acts">${liens}</div>` : ''}
        </div>
      </article>`;
    }).join('');

    const urgences = list(inst.urgences).length ? `
      <section class="section">
        <div class="section__head"><h2>${esc(ui('inst.urgent'))}</h2></div>
        <div class="grid grid--3">${list(inst.urgences).map((u, i) => `
          <div class="sos">
            <p class="sos__n num">${esc(u.numero)}</p>
            <p class="sos__q">${field(`installation.urgences.${i}.quand`, u.quand)}</p>
          </div>`).join('')}</div>
      </section>` : '';

    return entete(ui('nav.installation'), filled(inst.intro) ? field('installation.intro', inst.intro) : esc(ui('sub.installation')))
      + alerte
      + `<div class="etapes">${etapes}</div>`
      + urgences;
  }

  function rendreGlossaire() {
    const tout = list(state.data.glossaire);
    const q = (state.filters.glossaire || '').toLowerCase();
    const cat = state.filters.glossaireCat || '';
    const categories = [...new Set(tout.map((t2) => String(t2.categorie || '').trim()).filter(Boolean))];

    const retenus = tout.map((g, i) => ({ g, i }))
      .filter(({ g }) => (!cat || g.categorie === cat)
        && (!q || foin([g.terme, g.definition, g.piege, g.categorie]).includes(q)))
      .sort((a, b2) => String(a.g.terme).localeCompare(String(b2.g.terme), 'fr'));

    const cartes = retenus.map(({ g, i }) => `
      <article class="mot">
        <div class="mot__h">
          <h3 class="mot__t">${field(`glossaire.${i}.terme`, g.terme)}</h3>
          <span class="tag">${esc(ui(`glo.${g.categorie}`))}</span>
        </div>
        <p class="mot__d">${field(`glossaire.${i}.definition`, g.definition)}</p>
        ${filled(g.piege) ? `<p class="mot__p"><span class="eyebrow">${esc(ui('glo.trap'))}</span>
            ${field(`glossaire.${i}.piege`, g.piege)}</p>` : ''}
        ${boutonsLigne('glossaire', i)}
      </article>`).join('');

    const filtres = categories.map((c) =>
      `<button type="button" class="chipbtn" data-gcat="${esc(c)}" aria-pressed="${cat === c}">${esc(ui(`glo.${c}`))}</button>`).join('');

    return entete(ui('nav.glossaire'), esc(ui('sub.glossaire')))
      + `<div class="tools">
          <input class="search" type="search" data-filter="glossaire"
                 value="${esc(state.filters.glossaire || '')}" placeholder="${esc(ui('glo.search'))}">
          <button type="button" class="chipbtn" data-gcat="" aria-pressed="${cat === ''}">${esc(ui('label.all'))}</button>
          ${filtres}
        </div>`
      + (cartes ? `<div class="mots">${cartes}</div>` : vide(q || cat ? ui('empty.search') : ''))
      + boutonAjout('glossaire');
  }


  /* Une catégorie connue porte un libellé traduit ; les autres — celles que
     Jade ajoutera — s'affichent telles quelles. */
  const libelleCat = (c) => (UI[`res.${c}`] ? ui(`res.${c}`) : String(c || ''));

  function rendreMarseille() {
    const lieux = list(state.data.marseille);
    const q = (state.filters.marseille || '').toLowerCase();
    const cat = state.filters.marseilleCat || '';

    /* L'ordre des usages est délibéré : du plus professionnel au plus libre. */
    const ORDRE = ['dejeuner-pro', 'rapide', 'coworking', 'sortir'];
    const presentes = [...new Set(lieux.map((p) => String(p.category || '').trim()).filter(Boolean))];
    const familles = [...ORDRE.filter((c) => presentes.includes(c)),
                      ...presentes.filter((c) => !ORDRE.includes(c))];

    const retenus = lieux.map((p, i) => ({ p, i })).filter(({ p }) => {
      if (cat && String(p.category || '') !== cat) return false;
      if (!q) return true;
      return foin([p.name, p.district, p.address, p.why, p.category]).includes(q);
    });

    const carte = ({ p, i }) => {
      const infos = [];
      if (filled(p.distance)) infos.push(meta('walk', field(`marseille.${i}.distance`, p.distance)));
      if (filled(p.district)) infos.push(meta('pin', field(`marseille.${i}.district`, p.district)));
      if (filled(p.priceLevel)) infos.push(`<span class="tag">${field(`marseille.${i}.priceLevel`, p.priceLevel)}</span>`);
      const actions = [lien(p.website, ui('action.website'), 'link'), lien(p.map, ui('action.map'), 'pin')]
        .filter(Boolean).join('');

      return `<article class="card">
        <div class="card__top">${mono(t(p.name))}
          <div>
            <p class="card__title">${field(`marseille.${i}.name`, p.name)} ${badgeStatut(p.statut)}</p>
            ${filled(p.address) ? `<p class="card__role">${field(`marseille.${i}.address`, p.address)}</p>` : ''}
          </div>
        </div>
        ${filled(p.why) ? `<p class="card__text">${field(`marseille.${i}.why`, p.why)}</p>` : ''}
        ${infos.length ? `<div class="card__meta">${infos.join('')}</div>` : ''}
        ${actions ? `<div class="card__acts">${actions}</div>` : ''}
        ${boutonsLigne('marseille', i)}
      </article>`;
    };

    /* Sans filtre, on montre les usages séparément : c'est la distinction qui
       compte, pas la liste. Filtré ou cherché, une seule grille suffit. */
    const corps = (cat || q)
      ? (retenus.length ? `<div class="grid grid--2">${retenus.map(carte).join('')}</div>` : vide(ui('empty.search')))
      : familles.map((f) => {
          const dedans = retenus.filter(({ p }) => p.category === f);
          if (!dedans.length) return '';
          return `<section class="section">
            <div class="section__head"><h2>${esc(libelleCat(f))}</h2><span class="day__c num">${dedans.length}</span></div>
            <div class="grid grid--2">${dedans.map(carte).join('')}</div>
          </section>`;
        }).join('');

    const filtres = familles.map((f) =>
      `<button type="button" class="chipbtn" data-cat="${esc(f)}" aria-pressed="${cat === f}">${esc(libelleCat(f))}</button>`).join('');

    const intro = state.data.marseilleIntro;
    return entete(ui('nav.marseille'), filled(intro) ? field('marseilleIntro', intro) : esc(ui('sub.marseille')))
      + bandeauAncrage()
      + `<p class="note">${esc(ui('st.hint'))}</p>`
      + `<div class="tools">
          <input class="search" type="search" data-filter="marseille"
                 value="${esc(state.filters.marseille || '')}" placeholder="${esc(ui('search.places'))}">
          <button type="button" class="chipbtn" data-cat="" aria-pressed="${cat === ''}">${esc(ui('label.all'))}</button>
          ${filtres}
        </div>`
      + (retenus.length || state.editing ? corps : vide())
      + boutonAjout('marseille');
  }

  const RENDUS = {
    'accueil': rendreAccueil,
    'programme': () => entete(ui('nav.programme'), esc(ui('sub.programme'))) + rendreProgramme(),
    'visa': rendreVisa,
    'business-plan': rendreBusinessPlan,
    'interculturel': rendreInterculturel,
    'acteurs': rendreActeurs,
    'hotels': rendreHotels,
    'contacts': rendreContacts,
    'marseille': rendreMarseille,
    'installation': rendreInstallation,
    'glossaire': rendreGlossaire,
  };


  /* ═══════════════════════ Agenda : export .ics ═══════════════════════ */

  /* Les heures du programme sont saisies en heure de Paris et affichées telles
     quelles ; on les exporte donc en heure « flottante », sans fuseau. Un
     agenda les pose à l'heure locale de l'appareil — ce qui est exactement le
     comportement attendu une fois sur place. */
  function versICS() {
    /* Le pliage se compte en OCTETS, pas en caractères : « é » en pèse deux, et
       une ligne de 75 caractères accentués dépasse la limite de la norme. On
       n'ampute jamais un caractère au milieu. */
    const mesure = new TextEncoder();
    const plie = (ligne) => {
      const morceaux = [];
      let courant = '';
      let taille = 0;
      for (const c of ligne) {
        const poids = mesure.encode(c).length;
        if (taille + poids > 73) { morceaux.push(courant); courant = ' '; taille = 1; }
        courant += c;
        taille += poids;
      }
      if (courant.trim()) morceaux.push(courant);
      return morceaux.join('\r\n');
    };
    const echappe = (v) => String(v ?? '')
      .replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
    const horo = (date, heure) => `${date.replace(/-/g, '')}T${(heure || '00:00').replace(':', '')}00`;

    const lignes = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Soft Landing PAC//FR', 'CALSCALE:GREGORIAN',
                    plie(`X-WR-CALNAME:${echappe('Soft Landing PAC — ' + t((state.data.meta || {}).promotion))}`)];

    list(state.data.programme).forEach((item, i) => {
      const b = bornes(item);
      if (!b) return;
      const lieu = item.location || {};
      const lien = (list(item.resources).find((r) => href(r.url)) || {}).url || '';
      const details = [t(item.description), list(item.speakers).length ? `${ui('label.speakers')} : ${list(item.speakers).map(t).join(', ')}` : '', lien]
        .filter(Boolean).join('\n\n');

      lignes.push('BEGIN:VEVENT',
        plie(`UID:slpac-${i}-${item.date}@softlanding-pac`),
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
        `DTSTART:${horo(item.date, item.start)}`,
        `DTEND:${horo(item.date, item.end || item.start)}`,
        plie(`SUMMARY:${echappe(t(item.title))}`));
      if (details) lignes.push(plie(`DESCRIPTION:${echappe(details)}`));
      if (t(lieu.name)) lignes.push(plie(`LOCATION:${echappe([t(lieu.name), t(lieu.address)].filter(Boolean).join(', '))}`));
      lignes.push('BEGIN:VALARM', 'TRIGGER:-PT30M', 'ACTION:DISPLAY', 'DESCRIPTION:Rappel', 'END:VALARM', 'END:VEVENT');
    });

    lignes.push('END:VCALENDAR');
    return lignes.join('\r\n') + '\r\n';
  }

  /* ═══════════════════════ Recherche globale ═══════════════════════ */

  /* Un index à plat de tout le contenu : une entrée = un endroit où aller. */
  function indexer() {
    const entrees = [];
    const pousse = (section, titre, detail, texte) => {
      if (!String(titre || '').trim()) return;
      entrees.push({ section, titre: String(titre), detail: String(detail || ''),
                     cle: `${titre} ${detail} ${texte || ''}`.toLowerCase() });
    };

    list(state.data.programme).forEach((x) => pousse('programme', t(x.title),
      `${dateLongue(x.date)} · ${x.start || ''}`, `${t(x.description)} ${list(x.speakers).map(t).join(' ')}`));
    list(state.data.acteurs).forEach((x) => pousse('acteurs', t(x.name), t(x.role), `${t(x.description)} ${list(x.tags).map(t).join(' ')}`));
    list(state.data.contacts).forEach((x) => pousse('contacts', t(x.name), [t(x.org), t(x.role)].filter(Boolean).join(' · '), `${t(x.note)} ${list(x.tags).map(t).join(' ')}`));
    list(state.data.hotels).forEach((x) => pousse('hotels', t(x.name), t(x.address), t(x.notes)));
    list(state.data.marseille).forEach((x) => pousse('marseille', t(x.name), [t(x.category), t(x.district)].filter(Boolean).join(' · '), t(x.why)));
    list((state.data.visa || {}).steps).forEach((x) => pousse('visa', t(x.title), ui('nav.visa'), t(x.body)));
    list((state.data.businessPlan || {}).sections).forEach((x) => pousse('business-plan', t(x.title), ui('nav.business-plan'), t(x.body)));
    list((state.data.interculturel || {}).topics).forEach((x) => pousse('interculturel', t(x.title), ui('nav.interculturel'), t(x.body)));
    list((state.data.installation || {}).etapes).forEach((x) => pousse('installation', t(x.titre), t(x.quand), `${t(x.pourquoi)} ${t(x.obstacle)} ${list(x.solutions).map(t).join(' ')}`));
    list(state.data.glossaire).forEach((x) => pousse('glossaire', t(x.terme), t(x.definition), t(x.piege)));
    return entrees;
  }

  let indexCache = null;
  const index = () => (indexCache = indexCache || indexer());

  function chercher(q) {
    const mots = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!mots.length) return [];
    return index().filter((e) => mots.every((m) => e.cle.includes(m))).slice(0, 24);
  }

  function afficherResultats(q) {
    const boite = $('#find-results');
    const res = chercher(q);
    if (!q.trim()) { boite.innerHTML = ''; return; }
    if (!res.length) { boite.innerHTML = `<p class="find__empty">${esc(ui('find.empty'))}</p>`; return; }
    boite.innerHTML = res.map((e, i) => `
      <button type="button" class="find__hit" data-goto="${esc(e.section)}" ${i === 0 ? 'data-first' : ''}>
        <span class="find__ico">${svg(e.section, 16)}</span>
        <span class="find__txt"><span class="find__t">${esc(e.titre)}</span>
          <span class="find__d">${esc(e.detail)}</span></span>
        <span class="find__sec">${esc(ui(`nav.${e.section}`))}</span>
      </button>`).join('');
  }

  function ouvrirRecherche() {
    const boite = $('#find');
    boite.hidden = false;
    const champ = $('#find-input');
    champ.value = '';
    afficherResultats('');
    champ.focus();
  }

  const fermerRecherche = () => { $('#find').hidden = true; };

  /* ═══════════════════════ Hors ligne ═══════════════════════ */

  function activerHorsLigne() {
    if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
    navigator.serviceWorker.register('sw.js').catch(() => {
      /* Un enregistrement refusé (contexte non sécurisé) n'empêche rien : le
         site fonctionne, il ne sera simplement pas consultable hors réseau. */
    });
  }

  /* ═══════════════════════ Rendu et navigation ═══════════════════════ */

  function afficherNav() {
    $('#nav').innerHTML = SECTIONS.map((id) => `
      <button type="button" class="nav__item" data-section="${id}"
              ${state.section === id ? 'aria-current="page"' : ''}>
        <span class="nav__icon">${svg(id)}</span>
        <span>${esc(ui(`nav.${id}`))}</span>
      </button>`).join('');
  }

  function afficherSection() {
    SECTIONS.forEach((id) => {
      const vue = document.getElementById(`view-${id}`);
      if (!vue) return;
      const actif = id === state.section;
      vue.hidden = !actif;
      if (actif) vue.innerHTML = RENDUS[id]();
    });
    $('#topbar-title').textContent = ui(`nav.${state.section}`);
  }

  function afficherChrome() {
    const m = state.data.meta || {};
    $('#promo').textContent = t(m.promotion) || '';
    $('#foot-updated').textContent = filled(m.updatedAt) ? `${ui('app.updated')} ${dateLongue(t(m.updatedAt))}` : '';
    $$('[data-i18n]').forEach((n) => { n.textContent = ui(n.dataset.i18n); });
    $$('[data-i18n-placeholder]').forEach((n) => { n.placeholder = ui(n.dataset.i18nPlaceholder); });
    $$('.langbtn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === state.lang)));
    document.documentElement.lang = state.lang;
    appliquerTheme();
    majBarreEdition();
    $('.findbtn__i').innerHTML = svg('search', 15);
    $('.find__headi').innerHTML = svg('search', 17);
    indexCache = null;   /* les libellés de section changent avec la langue */
  }

  function toutAfficher() { afficherChrome(); afficherNav(); afficherSection(); }

  function aller(section, { push = true } = {}) {
    if (!RENDUS[section]) section = 'accueil';
    state.section = section;
    if (push && location.hash !== `#${section}`) history.replaceState(null, '', `#${section}`);
    const appliquer = () => { afficherNav(); afficherSection(); };
    if (document.startViewTransition) {
      const vt = document.startViewTransition(appliquer);
      /* Enchaîner deux sections interrompt la transition en cours : le
         navigateur rejette alors la promesse. Ce n'est pas une erreur. */
      vt.ready.catch(() => {});
      vt.finished.catch(() => {});
      vt.updateCallbackDone.catch(() => {});
    } else {
      appliquer();
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    fermerMenu();
  }

  function fermerMenu() {
    $('#app').classList.remove('open');
    $('#scrim').hidden = true;
    $('#burger').setAttribute('aria-expanded', 'false');
  }

  function appliquerTheme() {
    document.documentElement.dataset.theme = state.theme;
    $$('[data-theme-toggle]').forEach((b) => {
      b.innerHTML = svg(state.theme === 'dark' ? 'sun' : 'moon', 15);
      b.title = state.theme === 'dark'
        ? (state.lang === 'en' ? 'Light theme' : 'Thème clair')
        : (state.lang === 'en' ? 'Dark theme' : 'Thème sombre');
    });
  }

  function definirTheme(theme) {
    state.theme = theme === 'dark' ? 'dark' : 'light';
    localStorage.setItem('slpac.theme', state.theme);
    appliquerTheme();
  }

  function definirLangue(lang) {
    state.lang = lang === 'en' ? 'en' : 'fr';
    localStorage.setItem('slpac.lang', state.lang);
    if (state.data) toutAfficher();
    else {
      $$('[data-i18n]').forEach((n) => { n.textContent = ui(n.dataset.i18n); });
      $$('.langbtn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === state.lang)));
      document.documentElement.lang = state.lang;
      appliquerTheme();
    }
  }

  /* ═══════════════════════ Démarrage ═══════════════════════ */

  function demarrer() {
    $('#gate').hidden = true;
    $('#app').hidden = false;
    const h = location.hash.replace('#', '');
    state.section = RENDUS[h] ? h : 'accueil';
    toutAfficher();

    if (state.timer) clearInterval(state.timer);
    state.timer = setInterval(() => {
      if (state.section === 'programme' && !state.editing) afficherSection();
    }, TICK_MS);
  }

  function brancher() {
    $('#gate-form').addEventListener('submit', (e) => {
      e.preventDefault();
      ouvrir($('#gate-password').value);
    });

    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-theme-toggle]')) { definirTheme(state.theme === 'dark' ? 'light' : 'dark'); return; }

      const lang = e.target.closest('.langbtn');
      if (lang) { definirLangue(lang.dataset.lang); return; }

      const nav = e.target.closest('.nav__item');
      if (nav) { aller(nav.dataset.section); return; }

      const tuile = e.target.closest('a.tile, a.btn[href^="#"]');
      if (tuile && tuile.getAttribute('href').startsWith('#')) {
        e.preventDefault();
        aller(tuile.getAttribute('href').slice(1));
        return;
      }

      const cat = e.target.closest('.chipbtn');
      if (cat) {
        if ('gcat' in cat.dataset) state.filters.glossaireCat = cat.dataset.gcat;
        else if ('rcat' in cat.dataset) state.filters.restaurantsCat = cat.dataset.rcat;
        else state.filters.marseilleCat = cat.dataset.cat;
        afficherSection();
        return;
      }

      const ajout = e.target.closest('[data-add]');
      if (ajout) {
        const liste = ajout.dataset.add;
        if (!Array.isArray(state.data[liste])) state.data[liste] = [];
        state.data[liste].push(MODELES[liste]());
        marquerModifie(); afficherSection();
        return;
      }

      const suppr = e.target.closest('[data-del]');
      if (suppr) {
        if (!confirm(ui('edit.removeAsk'))) return;
        const [liste, index] = suppr.dataset.del.split('.');
        state.data[liste].splice(Number(index), 1);
        marquerModifie(); afficherSection();
        return;
      }

      if (e.target.closest('#ics')) {
        telecharger('soft-landing-pac.ics', versICS(), 'text/calendar;charset=utf-8');
        return;
      }
      if (e.target.closest('#find-open')) { ouvrirRecherche(); return; }
      if (e.target.closest('#find-close') || e.target.id === 'find') { fermerRecherche(); return; }
      const cible = e.target.closest('[data-goto]');
      if (cible) { fermerRecherche(); aller(cible.dataset.goto); return; }

      if (e.target.closest('#edit-toggle')) { basculerEdition(); return; }
      if (e.target.closest('#edit-json')) {
        telecharger('content.json', JSON.stringify(state.data, null, 2) + '\n', 'application/json');
        return;
      }
      if (e.target.closest('#edit-publish')) { publier(); return; }
      if (e.target.closest('#edit-cancel')) {
        if (!confirm(ui('edit.confirm'))) return;
        sessionStorage.removeItem(CLE_BROUILLON);
        location.reload();
        return;
      }

      if (e.target.closest('#burger')) {
        const app = $('#app');
        const ouvert = !app.classList.contains('open');
        app.classList.toggle('open', ouvert);
        $('#scrim').hidden = !ouvert;
        $('#burger').setAttribute('aria-expanded', String(ouvert));
        return;
      }
      if (e.target.closest('#scrim')) { fermerMenu(); return; }

      if (e.target.closest('#lock')) {
        sessionStorage.removeItem(CLE_SESSION);
        sessionStorage.removeItem(CLE_BROUILLON);
        location.reload();
      }
    });

    document.addEventListener('input', (e) => {
      /* Un champ éditable : on écrit dans le modèle, sans re-rendre — sinon
         le curseur saute à chaque frappe. */
      const ed = e.target.closest('.ed');
      if (ed) {
        ecrire(state.data, ed.dataset.path, ed.innerText.replace(/ /g, ' ').trim());
        marquerModifie();
        return;
      }

      if (e.target.id === 'find-input') { afficherResultats(e.target.value); return; }

      const champ = e.target.closest('[data-filter]');
      if (!champ) return;
      state.filters[champ.dataset.filter] = champ.value;
      afficherSection();
      const restaure = document.querySelector(`[data-filter="${champ.dataset.filter}"]`);
      if (restaure) { restaure.focus(); restaure.setSelectionRange(restaure.value.length, restaure.value.length); }
    });

    document.addEventListener('keydown', (e) => {
      /* Entrée valide le champ au lieu d'insérer un saut de ligne. */
      if (e.key === 'Enter' && e.target.closest('.ed')) { e.preventDefault(); e.target.blur(); return; }

      const dansLaRecherche = !$('#find').hidden;
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        dansLaRecherche ? fermerRecherche() : ouvrirRecherche();
        return;
      }
      if (!dansLaRecherche) return;
      if (e.key === 'Escape') { fermerRecherche(); return; }
      if (e.key === 'Enter' && e.target.id === 'find-input') {
        const premier = $('#find-results [data-first]');
        if (premier) premier.click();
      }
    });

    window.addEventListener('hashchange', () => {
      const h = location.hash.replace('#', '');
      if (RENDUS[h] && h !== state.section) aller(h, { push: false });
    });

    window.addEventListener('beforeunload', (e) => {
      if (state.dirty) { e.preventDefault(); e.returnValue = ''; }
    });
  }

  async function amorcer() {
    brancher();
    activerHorsLigne();
    definirLangue(state.lang);
    const retenu = sessionStorage.getItem(CLE_SESSION);
    if (retenu) await ouvrir(retenu, { silencieux: true });
    if ($('#gate').hidden === false) $('#gate-password').focus();
  }

  amorcer();
})();
