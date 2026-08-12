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
    'gate.render':      { fr: 'Mot de passe accepté, mais l’affichage a échoué — c’est un défaut du site :',
                          en: 'Password accepted, but rendering failed — this is a fault in the site:' },

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
    'nav.acteurs':       { fr: 'Acteurs du programme', en: 'Programme actors' },
    'nav.hotels':        { fr: 'Hôtels partenaires', en: 'Partner hotels' },
    'nav.contacts':      { fr: 'Carnet d’adresses', en: 'Address book' },
    'nav.marseille':     { fr: 'Marseille', en: 'Marseille' },
    'nav.entreprises':   { fr: 'Entreprises de la promotion', en: 'Cohort companies' },
    'sub.entreprises':   { fr: 'Les startups accompagnées cette année. Passez en mode édition pour en ajouter.', en: 'The startups supported this year. Switch to edit mode to add them.' },
    'ent.logo':          { fr: 'Logo', en: 'Logo' },
    'ent.addLogo':       { fr: 'Choisir un logo', en: 'Choose a logo' },
    'ent.delLogo':       { fr: 'Retirer le logo', en: 'Remove logo' },
    'ent.noLogo':        { fr: 'Pas de logo', en: 'No logo' },
    'ent.name':          { fr: 'Nom de l’entreprise', en: 'Company name' },
    'ent.activity':      { fr: 'Ce qu’elle fait', en: 'What it does' },
    'ent.open':          { fr: 'Voir la fiche', en: 'Open profile' },
    'ent.back':          { fr: 'Toutes les entreprises', en: 'All companies' },
    'ent.country':       { fr: 'Pays', en: 'Country' },
    'ent.sector':        { fr: 'Secteur', en: 'Sector' },
    'ent.stage':         { fr: 'Stade', en: 'Stage' },
    'ent.founders':      { fr: 'Fondateurs', en: 'Founders' },
    'ent.addBlock':      { fr: 'Ajouter une rubrique', en: 'Add a section' },
    'ent.blockTitle':    { fr: 'Titre de la rubrique', en: 'Section title' },
    'ent.blockBody':     { fr: 'Contenu', en: 'Content' },
    'ent.addFounder':    { fr: 'Ajouter un fondateur', en: 'Add a founder' },
    'ent.tooBig':        { fr: 'Image trop lourde même après réduction. Essayez un PNG ou un JPEG plus simple.', en: 'Image still too heavy after downscaling. Try a simpler PNG or JPEG.' },

    'save.saved':    { fr: 'Enregistré', en: 'Saved' },
    'save.nothing':  { fr: 'Aucune modification', en: 'No changes' },
    'save.newer':    { fr: 'Une version plus récente a été publiée en ligne. Vos modifications locales sont conservées.', en: 'A newer version was published online. Your local changes are kept.' },
    'save.takeNew':  { fr: 'Reprendre la version en ligne', en: 'Take the online version' },
    'save.takeAsk':  { fr: 'Reprendre la version en ligne ? Vos modifications locales seront perdues. Exportez-les d’abord si vous voulez les garder.', en: 'Take the online version? Your local changes will be lost. Export them first if you want to keep them.' },
    'save.full':     { fr: 'Espace de stockage plein : vos dernières modifications ne sont PAS enregistrées. Exportez content.json tout de suite, puis allégez les logos.', en: 'Storage full: your latest changes are NOT saved. Export content.json now, then reduce logo sizes.' },
    'save.lockAsk':  { fr: 'Verrouiller efface aussi vos modifications locales. Les avez-vous exportées ou publiées ?', en: 'Locking also erases your local changes. Have you exported or published them?' },
    'save.where':    { fr: 'Vos modifications sont enregistrées dans ce navigateur. Pour qu’elles apparaissent pour tout le monde, cliquez Publier.', en: 'Your changes are saved in this browser. To make them visible to everyone, click Publish.' },
    'nav.installation':  { fr: 'S’installer en France', en: 'Settling in France' },
    'nav.glossaire':     { fr: 'Glossaire', en: 'Glossary' },
    'res.dejeuner-pro': { fr: 'Déjeuner professionnel', en: 'Business lunch' },
    'res.rapide':       { fr: 'Manger vite', en: 'Quick bite' },
    'res.coworking':    { fr: 'Travailler', en: 'Work from there' },

    'st.a-valider':  { fr: 'À valider', en: 'To be validated' },
    'st.partenaire': { fr: 'Partenaire', en: 'Partner' },
    'st.ferme':      { fr: 'Fermé', en: 'Closed' },
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
    'inst.how':      { fr: 'Ce que vous faites, dans l’ordre', en: 'What you do, in order' },
    'inst.africa':   { fr: 'Si vous arrivez d’Afrique', en: 'If you are arriving from Africa' },
    'inst.avoid':    { fr: 'À ne pas faire', en: 'What not to do' },
    'inst.cost':     { fr: 'Ce que ça coûte', en: 'What it costs' },
    'inst.time':     { fr: 'Combien de temps', en: 'How long' },
    'inst.open':     { fr: 'Cette étape en détail', en: 'This step in detail' },
    'visa.who':      { fr: 'Pour qui', en: 'Who it is for' },
    'visa.step':     { fr: 'Cette étape en détail', en: 'This step in detail' },
    'bp.detail':     { fr: 'Ce que couvre cette thématique', en: 'What this theme covers' },
    'bp.cover':      { fr: 'Les points à traiter', en: 'The points to cover' },
    'bp.traps':      { fr: 'Les erreurs qui coûtent cher', en: 'The costly mistakes' },

    'pan.close':     { fr: 'Fermer', en: 'Close' },
    'pan.detail':    { fr: 'En détail', en: 'In detail' },
    'pan.where':     { fr: 'Où vous le rencontrerez', en: 'Where you will meet it' },
    'pan.seeAlso':   { fr: 'Voir aussi', en: 'See also' },
    'pan.def':       { fr: 'Définition', en: 'Definition' },
    'pan.about':     { fr: 'À propos', en: 'About' },
    'pan.contact':   { fr: 'Contact', en: 'Contact' },
    'pan.practical': { fr: 'Informations pratiques', en: 'Practical information' },
    'pan.session':   { fr: 'La session', en: 'The session' },
    'pan.hours':     { fr: 'Horaires', en: 'Opening hours' },
    'pan.access':    { fr: 'Y aller', en: 'Getting there' },
    'pan.services':  { fr: 'Services et équipements', en: 'Services and facilities' },
    'pan.keep':      { fr: 'À retenir', en: 'Worth knowing' },
    'pan.type':      { fr: 'Type', en: 'Type' },
    'pan.rating':    { fr: 'Avis', en: 'Reviews' },
    'pan.sourced':   { fr: 'Relevé sur les sources publiques le', en: 'Recorded from public sources on' },
    'pan.notSourced':{ fr: 'Aucune donnée relevée sur les sources publiques pour cette adresse.', en: 'No data recorded from public sources for this place.' },
    'chk.title':   { fr: 'Ma progression', en: 'My progress' },
    'chk.sub':     { fr: 'Cochez au fur et à mesure. Le site s’en souvient sur cet appareil.', en: 'Tick as you go. The site remembers on this device.' },
    'chk.done':    { fr: 'terminé', en: 'done' },
    'chk.of':      { fr: 'sur', en: 'of' },
    'chk.reset':   { fr: 'Tout décocher', en: 'Uncheck all' },
    'chk.resetAsk':{ fr: 'Décocher toutes les étapes ?', en: 'Uncheck every step?' },
    'chk.allDone': { fr: 'Toutes les étapes sont faites.', en: 'Every step is done.' },

    'jour.before':  { fr: 'Avant l’immersion', en: 'Before the immersion' },
    'jour.countdown': { fr: 'jours avant la semaine d’immersion', en: 'days until the immersion week' },
    'jour.oneDay':  { fr: 'jour avant la semaine d’immersion', en: 'day until the immersion week' },
    'jour.today':   { fr: 'Aujourd’hui', en: 'Today' },
    'jour.tomorrow':{ fr: 'Demain', en: 'Tomorrow' },
    'jour.nothing': { fr: 'Rien de prévu aujourd’hui.', en: 'Nothing scheduled today.' },
    'jour.during':  { fr: 'Semaine d’immersion en cours', en: 'Immersion week under way' },
    'jour.after':   { fr: 'Après le programme', en: 'After the programme' },
    'jour.see':     { fr: 'Voir le programme', en: 'See the schedule' },
    'pan.more':      { fr: 'Ouvrir', en: 'Open' },
    'pan.forYou':    { fr: 'Ce que ça change pour vous', en: 'What it changes for you' },
    'pan.ask':       { fr: 'Ce que vous pouvez leur demander', en: 'What you can ask them for' },
    'pan.notThis':   { fr: 'Ce qu’ils ne font pas', en: 'What they do not do' },
    'pan.markers':   { fr: 'Repères', en: 'Key facts' },
    'pan.people':    { fr: 'Vos interlocuteurs', en: 'Who to talk to' },
    'pan.sessions':  { fr: 'Dans le programme', en: 'In the programme' },
    'pan.org':       { fr: 'Sa structure', en: 'Their organisation' },
    'pan.speaks':    { fr: 'Intervient dans', en: 'Speaks at' },
    'pan.terms':     { fr: 'Mots de cette session', en: 'Terms from this session' },
    'pan.speakers':  { fr: 'Qui intervient', en: 'Who is speaking' },
    'pan.venue':     { fr: 'Le lieu', en: 'The venue' },
    'pan.noContact': { fr: 'Ni email ni téléphone dans les documents du programme. Passez par l’équipe de l’Accélérateur M, ou par la fiche de la structure ci-dessus.',
                       en: 'Neither email nor phone in the programme documents. Go through the Accélérateur M team, or via the organisation’s entry above.' },
    'pan.founderOf': { fr: 'Fondateur·rice de', en: 'Founder of' },
    'pan.sameCountry': { fr: 'Même pays dans la promotion', en: 'Same country in the cohort' },
    'pan.orgs':      { fr: 'Structures citées', en: 'Organisations mentioned' },

    'nav.carte':     { fr: 'Carte', en: 'Map' },
    'sub.carte':     { fr: 'Les hôtels et les adresses du site, posés sur la ville. Cliquez un repère pour ouvrir sa fiche.',
                       en: 'The site’s hotels and addresses, placed on the city. Click a pin to open its entry.' },
    'map.hotels':    { fr: 'Hôtels', en: 'Hotels' },
    'map.charge':    { fr: 'Afficher la carte', en: 'Show the map' },
    'map.avert':     { fr: 'La vue satellite charge des images depuis un serveur extérieur (Esri). C’est le seul moment où ce site sort vers l’extérieur : elle ne s’affiche que si vous le demandez, et le reste du site fonctionne sans elle, y compris hors ligne.',
                       en: 'The satellite view loads imagery from an outside server (Esri). It is the only moment this site reaches outward: it appears only if you ask for it, and the rest of the site works without it, offline included.' },
    'map.plan':      { fr: 'Plan', en: 'Street' },
    'map.sat':       { fr: 'Satellite', en: 'Satellite' },
    'map.recentrer': { fr: 'Tout voir', en: 'Fit all' },
    'map.aucun':     { fr: 'Aucun lieu ne correspond.', en: 'No place matches.' },
    'map.horsligne': { fr: 'Carte indisponible hors ligne — les fiches, elles, restent lisibles.',
                       en: 'Map unavailable offline — the entries themselves remain readable.' },

    'replay.title':  { fr: 'Revoir la session', en: 'Watch again' },
    'replay.pending':{ fr: 'Enregistrement disponible, pas encore hébergé en ligne. Fichier :',
                       en: 'Recording available, not yet hosted online. File:' },
    'replay.none':   { fr: 'Aucun enregistrement pour cette session.', en: 'No recording for this session.' },

    'j1.title':      { fr: 'Vos 48 premières heures', en: 'Your first 48 hours' },
    'j1.lede':       { fr: 'Ce qui se règle tout de suite, dans l’ordre. Le reste attend.',
                       en: 'What to sort straight away, in order. The rest can wait.' },
    'j1.more':       { fr: 'La chaîne complète', en: 'The full chain' },

    'need.title':    { fr: 'Qui contacter, pour quoi', en: 'Who to contact, and what for' },
    'need.lede':     { fr: 'On ne cherche pas un nom, on cherche une solution. Partez du problème.',
                       en: 'You don’t look for a name, you look for a way out. Start from the problem.' },

    'off.title':     { fr: 'Ce site fonctionne sans réseau', en: 'This site works without a network' },
    'off.body':      { fr: 'Une fois ouvert, il reste consultable hors ligne : programme, glossaire, chaîne d’installation, carnet. Utile à l’atterrissage, avant d’avoir une carte SIM française.',
                       en: 'Once opened, it stays readable offline: programme, glossary, settling-in chain, address book. Useful on landing, before you have a French SIM.' },
    'off.ready':     { fr: 'Prêt pour le hors-ligne', en: 'Ready for offline' },

    'site.name':     { fr: 'Soft Landing Provence Africa Connect', en: 'Soft Landing Provence Africa Connect' },
    'kpi.startups':  { fr: 'startups accompagnées', en: 'startups supported' },
    'kpi.sessions':  { fr: 'sessions au programme', en: 'sessions in the programme' },
    'kpi.acteurs':   { fr: 'structures mobilisées', en: 'organisations involved' },
    'kpi.termes':    { fr: 'termes expliqués', en: 'terms explained' },
    'foot.who':      { fr: 'Opéré par l’Accélérateur M, Marseille Innovation et ANIMA, financé par la Métropole Aix-Marseille-Provence.',
                       en: 'Operated by Accélérateur M, Marseille Innovation and ANIMA, funded by the Aix-Marseille-Provence Metropolis.' },
    'foot.update':   { fr: 'Mis à jour le', en: 'Last updated' },
    'foot.private':  { fr: 'Espace privé', en: 'Private space' },
    'foot.offline':  { fr: 'Consultable sans réseau une fois ouvert.', en: 'Readable without a network once opened.' },
    'prog.past':     { fr: 'Sessions déjà passées', en: 'Past sessions' },
    'prog.pastShow': { fr: 'Afficher', en: 'Show' },
    'prog.pastHide': { fr: 'Masquer', en: 'Hide' },
    'prog.upcoming': { fr: 'À venir', en: 'Upcoming' },
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
    'grp.consortium': { fr: 'Le consortium', en: 'The consortium' },
    'grp.partenaire': { fr: 'Les partenaires', en: 'The partners' },
    'sub.acteurs':   { fr: 'Les trois structures du consortium, puis tous les partenaires du programme.', en: 'The three consortium organisations, then all the programme partners.' },
  };

  /* ═══════════════════════ Icônes, en trait fin ═══════════════════════ */

  const ICONS = {
    accueil: '<path d="M3 10.6 12 3.5l9 7.1"/><path d="M5.6 9.4V20.5h12.8V9.4"/><path d="M10 20.5v-5.4h4v5.4"/>',
    programme: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M8 2.8v4M16 2.8v4M3.5 10h17"/>',
    visa: '<rect x="4" y="3" width="16" height="18" rx="2.5"/><circle cx="12" cy="9.8" r="2.5"/><path d="M8.5 16.6h7"/>',
    'business-plan': '<path d="M4 20.2h16"/><path d="M6.4 20.2v-6.4M11.4 20.2V9.4M16.4 20.2V4.6"/>',
    acteurs: '<circle cx="9.2" cy="8.4" r="3.3"/><path d="M3.4 19.6c0-3.1 2.6-5.2 5.8-5.2s5.8 2.1 5.8 5.2"/><path d="M16.4 5.5a3.1 3.1 0 0 1 0 5.9"/><path d="M17.6 14.7c1.9.6 3.1 2.2 3.1 4.5"/>',
    hotels: '<path d="M3 19.4V9.6"/><path d="M3 13.2h13.6a4.4 4.4 0 0 1 4.4 4.4v1.8"/><circle cx="7.2" cy="9.9" r="2.1"/><path d="M3 19.4h18"/>',
    contacts: '<rect x="5" y="3" width="14.5" height="18" rx="2.5"/><path d="M2.6 8h2.4M2.6 12h2.4M2.6 16h2.4"/><circle cx="12.2" cy="10.2" r="2.3"/><path d="M8.6 16.6c0-2 1.6-3.2 3.6-3.2s3.6 1.2 3.6 3.2"/>',
    marseille: '<path d="M12 21.2s6.6-6.1 6.6-10.6a6.6 6.6 0 1 0-13.2 0C5.4 15.1 12 21.2 12 21.2Z"/><circle cx="12" cy="10.5" r="2.4"/>',
    carte: '<path d="M9.2 4.2 3.4 6.6v13.2l5.8-2.4 5.6 2.4 5.8-2.4V4.2l-5.8 2.4Z"/><path d="M9.2 4.2v13.2M14.8 6.6v13.2"/>',
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
    entreprises: '<path d="M3.4 20.6h17.2"/><path d="M5.4 20.6V6.4l7-2.8v17"/><path d="M12.4 9.6h6.2v11"/><path d="M8.4 9.4h1M8.4 13h1M15.4 13h1M15.4 16.6h1"/>',
    image: '<rect x="3.4" y="4.6" width="17.2" height="14.8" rx="2"/><circle cx="8.8" cy="9.8" r="1.7"/><path d="m4.4 17.4 5-5 4.4 4.4 2.8-2.6 4 3.8"/>',
    glossaire: '<path d="M4 4.6h6a3 3 0 0 1 3 3v12a2.4 2.4 0 0 0-2.4-2.4H4Z"/><path d="M20 4.6h-6a3 3 0 0 0-3 3v12a2.4 2.4 0 0 1 2.4-2.4H20Z"/>',
    alert: '<path d="M12 3.6 21.4 20H2.6Z"/><path d="M12 9.6v4.4M12 17.2h.01"/>',
    search: '<circle cx="11" cy="11" r="6.6"/><path d="m16 16 4.6 4.6"/>',
    download: '<path d="M12 3.6v11.4"/><path d="m7.4 10.4 4.6 4.6 4.6-4.6"/><path d="M4.4 19.4h15.2"/>',
    play: '<circle cx="12" cy="12" r="8.6"/><path d="M10.2 8.6 15.4 12l-5.2 3.4Z"/>',
    trash: '<path d="M4 6.5h16"/><path d="M9 6.5V4.2h6v2.3"/><path d="M6.4 6.5 7.3 20h9.4l.9-13.5"/>',
  };

  const svg = (nom, taille = 18) => (ICONS[nom]
    ? `<svg viewBox="0 0 24 24" width="${taille}" height="${taille}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[nom]}</svg>`
    : '');

  const SECTIONS = ['accueil', 'programme', 'installation', 'glossaire', 'visa',
                    'business-plan', 'entreprises', 'acteurs', 'carte',
                    'hotels', 'contacts', 'marseille'];

  /* Les listes qu'on peut allonger ou raccourcir en mode édition. */
  const MODELES = {
    programme: () => ({ date: new Date().toISOString().slice(0, 10), start: '09:00', end: '10:00', type: '',
                        title: { fr: '', en: '' }, description: { fr: '', en: '' },
                        location: { name: '', address: '', map: '' }, speakers: [], resources: [] }),
    acteurs: () => ({ name: '', groupe: 'partenaire', role: { fr: '', en: '' },
                      description: { fr: '', en: '' }, website: '',
                      contact: { email: '', phone: '' }, tags: [] }),
    hotels: () => ({ name: '', address: '', district: '', distance: { fr: '', en: '' }, priceRange: '',
                     booking: { contact: '', code: { fr: '', en: '' } }, notes: { fr: '', en: '' }, website: '', map: '' }),
    contacts: () => ({ name: '', org: '', role: { fr: '', en: '' }, email: '', phone: '', linkedin: '',
                       website: '', languages: [], tags: [], note: { fr: '', en: '' } }),
    marseille: () => ({ name: '', category: 'dejeuner-pro', district: '', address: '',
                        distance: { fr: '', en: '' }, why: { fr: '', en: '' },
                        priceLevel: '', website: '', map: '', statut: 'a-valider' }),
    /* Un noyau fixe, et « blocs » qui accueille tout le reste : le contenu du
       Loop n'a pas de schéma connu, il ne faut pas le forcer dans le mien. */
    entreprises: () => ({ nom: '', activite: { fr: '', en: '' }, logo: '', site: '',
                          pays: '', secteur: '', stade: '',
                          fondateurs: [], blocs: [] }),
    glossaire: () => ({ terme: '', categorie: 'administration',
                        definition: { fr: '', en: '' }, piege: { fr: '', en: '' } }),

  };

  /* ═══════════════════════ État ═══════════════════════ */

  const state = {
    lang: localStorage.getItem('slpac.lang') === 'en' ? 'en' : 'fr',
    data: null,
    section: 'accueil',
    filters: {},
    editing: false,
    detail: null,          /* index de la fiche entreprise ouverte, sinon null */
    panneau: null,         /* { section, index } du panneau de détail ouvert */
    dirty: false,
    base: '',              /* builtAt de la version publiée qui sert de socle */
    enregistreLe: null,
    versionPlusRecente: false,
    stockagePlein: false,
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

  /* Le libellé passe par t() : certains sont de simples chaînes, d'autres des
     objets {fr, en} — les intitulés de liens officiels notamment, dont la
     page cible est en français mais dont le libellé doit se lire en anglais. */
  function lien(url, texte, icone) {
    const safe = href(url);
    return safe
      ? `<a class="btn" href="${safe}" target="_blank" rel="noopener noreferrer">${icone ? svg(icone, 14) : ''}${esc(t(texte))}</a>`
      : '';
  }

  const vide = (msg) => `<div class="empty">${esc(msg || ui('empty.generic'))}</div>`;
  const meta = (icone, html) => `<span class="meta">${svg(icone, 14)}${html}</span>`;

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
    /* Le déchiffrement et le rendu sont séparés. Tant qu'ils partageaient le
       même try, la moindre erreur d'affichage s'annonçait « mot de passe
       incorrect » — le pire message possible : il accuse l'utilisateur d'une
       faute qui n'est pas la sienne, et il masque le vrai défaut. */
    let ouvert = false;
    try {
      const enveloppe = await chargerEnveloppe();
      const donnees = await dechiffrer(mdp, enveloppe);
      sessionStorage.setItem(CLE_SESSION, mdp);
      state.base = enveloppe.builtAt || '';
      state.publie = donnees;

      const brut = localStorage.getItem(CLE_BROUILLON);
      if (brut) {
        try {
          const b = JSON.parse(brut);
          state.data = b.data;
          state.dirty = true;
          state.enregistreLe = b.enregistreLe ? new Date(b.enregistreLe) : null;
          /* Une publication plus récente ne doit jamais écraser le travail en
             cours en silence : on le signale, on ne décide pas à sa place. */
          state.versionPlusRecente = !!(state.base && b.base && state.base !== b.base);
        } catch { state.data = donnees; }
      } else {
        state.data = donnees;
      }
      ouvert = true;
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

    /* Le mot de passe est bon : ce qui échoue ici est un défaut du site, et
       il doit le dire tel quel plutôt que de se déguiser. On n'anime que si
       le mot de passe vient d'être saisi. */
    if (!ouvert) return false;
    try {
      demarrer(!silencieux);
      return true;
    } catch (e) {
      console.error('Rendu impossible après déverrouillage :', e);
      if (!silencieux) erreurPorte(`${ui('gate.render')} ${e && e.message ? e.message : ''}`);
      return false;
    }
  }

  /* ═══════════════════════ Mode édition ═══════════════════════ */

  /* Le brouillon vit en localStorage : il doit survivre à la fermeture du
     navigateur. Un travail de saisie perdu parce qu'on a fermé un onglet est
     inacceptable — c'était le cas jusqu'au 2026-08-06.
     Contrepartie assumée : le contenu reste sur le disque de cette machine.
     Sur un poste partagé, « Verrouiller » l'efface. */
  function sauverBrouillon() {
    try {
      localStorage.setItem(CLE_BROUILLON, JSON.stringify({
        base: state.base,
        enregistreLe: new Date().toISOString(),
        data: state.data,
      }));
      state.enregistreLe = new Date();
      state.stockagePlein = false;
      return true;
    } catch (e) {
      /* Quota dépassé, souvent à cause des logos. On le DIT : avaler l'erreur
         ferait croire que c'est enregistré alors que non. */
      state.stockagePlein = true;
      return false;
    }
  }

  function marquerModifie() {
    state.dirty = true;
    indexCache = null;   /* le contenu a bougé : l'index de recherche aussi */
    const ok = sauverBrouillon();
    majBarreEdition();
    if (!ok && !state.alerteStockage) {
      state.alerteStockage = true;
      alert(ui('save.full'));
    }
  }

  const heure = (d) => (d ? d.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }) : '');

  function majBarreEdition() {
    const barre = $('#editbar');
    barre.hidden = !state.editing;

    let etat;
    if (state.stockagePlein) etat = `<b>⚠</b> ${esc(ui('save.full'))}`;
    else if (state.dirty) etat = `<b class="editbar__ok">✓</b> ${esc(ui('save.saved'))} ${esc(heure(state.enregistreLe))} — ${esc(ui('save.where'))}`;
    else etat = esc(ui('edit.clean'));
    $('#editbar-count').innerHTML = etat;

    const recent = $('#edit-take');
    if (recent) recent.hidden = !state.versionPlusRecente;

    $('#edit-cancel').disabled = !state.dirty;
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

    const rendreJours = (liste) => liste.map((j) => {
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

        /* Le replay : un lien s'il est hébergé, sinon le nom du fichier qui
           existe déjà sur la machine de Kelyan. Dire « il existe mais il
           n'est pas en ligne » vaut mieux que ne rien dire. */
        const rep = item.replay || {};
        const replay = filled(rep.url)
          ? `<div class="slot__a">${lien(t(rep.url), ui('replay.title'), 'play')}</div>`
          : filled(rep.fichier)
            ? `<p class="slot__rep">${esc(ui('replay.pending'))} <code>${esc(t(rep.fichier))}</code></p>`
            : '';

        return `<article class="${cls} slot--ouvrable" data-panel="programme.${index}" tabindex="0" role="button">
          <div class="slot__when">
            <span class="slot__h num">${field(`programme.${index}.start`, item.start)}</span>
            <span class="slot__e num">${field(`programme.${index}.end`, item.end)}</span>
          </div>
          <div class="slot__body">
            <h3 class="slot__t">${field(`programme.${index}.title`, item.title)}${badge}</h3>
            ${filled(item.description) ? `<p class="slot__d">${field(`programme.${index}.description`, item.description)}</p>` : ''}
            ${infos.length ? `<div class="slot__m">${infos.join('')}</div>` : ''}
            ${ressources ? `<div class="slot__a">${ressources}</div>` : ''}
            ${replay}
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

    /* La page s'ouvrait sur huit webinaires terminés, puis sur les journées
       à venir. Quelqu'un qui arrive en septembre voyait d'abord ce qui était
       fini. On inverse : l'à-venir d'abord, le passé replié — sans le jeter,
       il porte les replays. */
    const finiJour = (j) => j.lignes.every((r) => r.b.a < maintenant);
    const passes = m.jours.filter(finiJour);
    const aVenir = m.jours.filter((j) => !finiJour(j));

    const blocPasse = passes.length ? `
      <details class="fold"${state.editing ? ' open' : ''}>
        <summary class="fold__s">
          <span>${esc(ui('prog.past'))}</span>
          <span class="day__c num">${passes.reduce((n, j) => n + j.lignes.length, 0)}</span>
        </summary>
        <div class="fold__b">${rendreJours(passes)}</div>
      </details>` : '';

    const blocAvenir = aVenir.length
      ? `<div class="section__head section__head--plain"><h2>${esc(ui('prog.upcoming'))}</h2></div>${rendreJours(aVenir)}`
      : '';

    return banniere
      + (tz ? `<p class="day__c" style="margin-bottom:var(--s5)">${esc(ui('now.tz'))}</p>` : '')
      + agenda
      + blocAvenir
      + blocPasse
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
      <p class="eyebrow">${esc(t(state.data.site && state.data.site.title) || 'Soft Landing')}</p>
      <h1>${esc(titre)}</h1>
      ${chapo ? `<p class="head__lede">${chapo}</p>` : ''}
    </header>`;
  }


  /* ═══════════════════════ Ma progression ═══════════════════════ */

  /* Cochée par chaque participant, sur son appareil. Ce n'est pas du contenu
     partagé : personne d'autre n'a à voir où en est quelqu'un. Stockée à part
     du brouillon d'édition, pour qu'un « tout annuler » ne l'efface pas. */
  const CLE_PROGRESSION = 'slpac.progress';

  function progression() {
    try { return JSON.parse(localStorage.getItem(CLE_PROGRESSION) || '{}'); }
    catch { return {}; }
  }

  function cocher(cle, valeur) {
    const p = progression();
    if (valeur) p[cle] = new Date().toISOString(); else delete p[cle];
    try { localStorage.setItem(CLE_PROGRESSION, JSON.stringify(p)); } catch {}
  }

  /* Les étapes cochables sont celles de la chaîne d'installation : elles sont
     déjà ordonnées et chacune correspond à une démarche réelle. */
  const etapesCochables = () => list((state.data.installation || {}).etapes)
    .map((e, i) => ({ cle: `inst-${i}`, titre: t(e.titre), quand: t(e.quand) }))
    .filter((x) => x.titre);

  /* Rafraîchit le compteur et la jauge sans toucher aux cases elles-mêmes. */
  function majProgression() {
    const etapes = etapesCochables();
    if (!etapes.length) return;
    const p = progression();
    const faites = etapes.filter((e) => p[e.cle]).length;
    const part = Math.round((faites / etapes.length) * 100);
    $$('#progression .day__c').forEach((n) => {
      n.textContent = `${faites} ${ui('chk.of')} ${etapes.length} ${ui('chk.done')}`;
    });
    $$('#progression .jauge__b').forEach((n) => { n.style.width = `${part}%`; });
    const bouton = $('#coche-reset');
    if (bouton) bouton.hidden = faites === 0;
  }

  function rendreProgression() {
    const etapes = etapesCochables();
    if (!etapes.length) return '';
    const p = progression();
    const faites = etapes.filter((e) => p[e.cle]).length;
    const part = Math.round((faites / etapes.length) * 100);

    return `<section class="section" id="progression">
      <div class="section__head">
        <h2>${esc(ui('chk.title'))}</h2>
        <span class="day__c num">${faites} ${esc(ui('chk.of'))} ${etapes.length} ${esc(ui('chk.done'))}</span>
      </div>
      <p class="note">${esc(ui('chk.sub'))}</p>
      <div class="jauge"><div class="jauge__b" style="width:${part}%"></div></div>
      <ul class="coches">
        ${etapes.map((e) => `
          <li class="coche${p[e.cle] ? ' coche--ok' : ''}">
            <label>
              <input type="checkbox" data-coche="${esc(e.cle)}" ${p[e.cle] ? 'checked' : ''}>
              <span class="coche__t">${esc(e.titre)}</span>
              ${e.quand ? `<span class="coche__q">${esc(e.quand)}</span>` : ''}
            </label>
          </li>`).join('')}
      </ul>
      <button type="button" class="btn" id="coche-reset" ${faites ? '' : 'hidden'}>${esc(ui('chk.reset'))}</button>
    </section>`;
  }

  /* ═══════════════════════ Le jour où l'on est ═══════════════════════ */

  /* L'accueil doit répondre à « qu'est-ce que je fais aujourd'hui », pas
     présenter le dispositif à quelqu'un qui l'a déjà rejoint. */
  function rendreJour() {
    const m = modeleProgramme(new Date());
    if (!m.sessions.length) return '';

    const auj = new Date(); auj.setHours(0, 0, 0, 0);
    const jour = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

    const duJour = m.sessions.filter((r) => jour(r.b.de).getTime() === auj.getTime());
    const aVenir = m.sessions.filter((r) => jour(r.b.de) > auj);

    const ligne = (r) => `<button type="button" class="jour__s" data-panel="programme.${r.index}">
        <span class="jour__h num">${esc(t(r.item.start))}</span>
        <span class="jour__t">${esc(t(r.item.title))}</span>
        ${filled(r.item.location && r.item.location.name)
          ? `<span class="jour__l">${esc(t(r.item.location.name))}</span>` : ''}
      </button>`;

    if (duJour.length) {
      return `<section class="jour jour--actif">
        <p class="eyebrow">${esc(ui('jour.today'))}</p>
        <div class="jour__l2">${duJour.map(ligne).join('')}</div>
      </section>`;
    }

    if (!aVenir.length) {
      return `<section class="jour">
        <p class="eyebrow">${esc(ui('jour.after'))}</p>
        <p class="jour__g">${esc(ui('now.done'))}</p>
      </section>`;
    }

    const prochaine = aVenir[0];
    const jours = Math.round((jour(prochaine.b.de) - auj) / 86400000);
    const demain = jours === 1;

    return `<section class="jour">
      <p class="eyebrow">${esc(demain ? ui('jour.tomorrow') : ui('jour.before'))}</p>
      ${demain ? '' : `<p class="jour__g"><span class="jour__n num">${jours}</span> ${esc(jours === 1 ? ui('jour.oneDay') : ui('jour.countdown'))}</p>`}
      <div class="jour__l2">${ligne(prochaine)}</div>
    </section>`;
  }

  /* Les deux premières étapes de la chaîne d'installation, sorties de leur
     page. Un fondateur qui atterrit ne cherche pas « la chaîne complète »,
     il cherche quoi faire ce soir. Rien de neuf n'est écrit ici : c'est un
     raccourci vers ce qui existe déjà, pour que ça se voie. */
  function rendrePremieresHeures() {
    const etapes = list((state.data.installation || {}).etapes).slice(0, 3);
    if (!etapes.length) return '';
    /* Pas de compteur ici : les titres des étapes portent déjà le leur
       (« 1 · Une carte SIM »), et deux numérotations qui se superposent
       donnaient « 2 — 1 · Une carte SIM ». L'ordre de la liste suffit. */
    const lignes = etapes.map((e, i) => `
      <li class="h48__i">
        <span class="h48__b" aria-hidden="true"></span>
        <div>
          <p class="h48__t">${field(`installation.etapes.${i}.titre`, e.titre)}</p>
          ${filled(e.quand) ? `<p class="h48__q">${field(`installation.etapes.${i}.quand`, e.quand)}</p>` : ''}
          ${filled(e.pourquoi) ? `<p class="h48__p">${field(`installation.etapes.${i}.pourquoi`, e.pourquoi)}</p>` : ''}
        </div>
      </li>`).join('');

    return `<section class="section h48">
      <div class="section__head"><h2>${esc(ui('j1.title'))}</h2></div>
      <p class="h48__lede">${esc(ui('j1.lede'))}</p>
      <ol class="h48__l">${lignes}</ol>
      <a class="btn" href="#installation">${esc(ui('j1.more'))}${svg('arrow', 15)}</a>
    </section>`;
  }

  /* Le site marche hors ligne depuis le début et personne ne le sait. C'est
     précisément l'argument qui compte à l'atterrissage, sans carte SIM. */
  function rendreHorsLigne() {
    return `<aside class="offl">
      <p class="eyebrow offl__k">${esc(ui('off.title'))}</p>
      <p class="offl__b">${esc(ui('off.body'))}</p>
    </aside>`;
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

    /* Les chiffres qui disent le programme en un coup d'œil. Ils ne sont pas
       saisis : ils se comptent sur le contenu, donc ils ne peuvent pas mentir
       ni se périmer. Motif repris de M alumni : peu de chiffres, très grands. */
    const jours = (() => {
      const d0 = new Date(`${t(m.startDate) || '2026-09-14'}T00:00:00`);
      const debut = new Date(`${(list(state.data.programme).find((s) => t(s.type) === 'immersion') || {}).date || '2026-09-14'}T00:00:00`);
      const n = Math.ceil((debut - new Date()) / 86400000);
      return Number.isFinite(n) ? n : null;
    })();

    const CHIFFRES = [
      { v: list(state.data.entreprises).length, k: ui('kpi.startups') },
      { v: list(state.data.programme).length, k: ui('kpi.sessions') },
      { v: list(state.data.acteurs).length, k: ui('kpi.acteurs') },
      { v: list(state.data.glossaire).length, k: ui('kpi.termes') },
    ].filter((x) => x.v > 0).map((x) => `
      <div class="kpi">
        <p class="kpi__v num">${x.v}</p>
        <p class="kpi__k">${esc(x.k)}</p>
      </div>`).join('');

    /* Pavage inégal : la tuile d'accroche occupe deux colonnes, les autres
       une. Une grille uniforme ne hiérarchise rien. */
    const bento = list(home.highlights).map((h, i) => {
      const cible = typeof h.link === 'string' && h.link.startsWith('#') ? esc(h.link) : '';
      const balise = cible && !state.editing ? 'a' : 'div';
      const attr = cible && !state.editing ? ` href="${cible}"` : '';
      return `<${balise} class="tile${i === 0 ? ' tile--large' : ''}"${attr}>
        <p class="tile__t">${field(`home.highlights.${i}.label`, h.label)}</p>
        <p class="tile__d">${field(`home.highlights.${i}.text`, h.text)}</p>
        ${cible ? `<span class="tile__go">${esc(ui('label.explore'))}${svg('arrow', 15)}</span>` : ''}
      </${balise}>`;
    }).join('');

    return `<div class="hero hero--grand">
        <div class="hero__txt">
          <h1>${field('site.title', site.title)}
            <span class="hero__sub">${field('site.subtitle', site.subtitle)}</span></h1>
          <p class="hero__lede">${field('site.tagline', site.tagline)}</p>
          <div class="hero__cta">
            <a class="btn btn--primary" href="#installation">${svg('installation', 15)}${esc(ui('nav.installation'))}</a>
            <a class="btn" href="#programme">${svg('programme', 15)}${esc(ui('nav.programme'))}</a>
          </div>
        </div>
        <div class="hero__side">${rendreJour()}</div>
      </div>

      ${CHIFFRES ? `<div class="kpis">${CHIFFRES}</div>` : ''}

      ${filled(home.intro) ? `<p class="hero__intro">${field('home.intro', home.intro)}</p>` : ''}
      ${dates.length || reperes ? `<div class="stats">${dates.length ? `<div class="stat">
          <p class="stat__k">${esc(state.lang === 'en' ? 'Dates' : 'Dates')}</p>
          <p class="stat__v num">${markTodo(esc(dates.join(' → ')))}</p>
        </div>` : ''}${reperes}</div>` : ''}

      ${rendrePremieresHeures()}
      ${bento ? `<section class="section"><div class="section__head">
          <h2>${esc(state.lang === 'en' ? 'Go straight to' : 'Aller droit au but')}</h2></div>
        <div class="bento">${bento}</div></section>` : ''}
      ${rendreProgression()}
      ${rendreHorsLigne()}`;
  }

  function rendreVisa() {
    const v = state.data.visa || {};
    const voies = list(v.tracks).map((tr, i) => `
      <article class="card card--ouvrable" data-panel="visa.${i}" tabindex="0" role="button">
        <p class="card__title">${field(`visa.tracks.${i}.name`, tr.name)}</p>
        <p class="card__text">${field(`visa.tracks.${i}.who`, tr.who)}</p>
      </article>`).join('');

    const etapes = list(v.steps).map((s, i) => {
      const docs = list(s.docs).filter(filled);
      const l2 = s.lien && s.lien.url ? lien(s.lien.url, s.lien.label, 'link') : '';
      return `<article class="step step--ouvrable" data-panel="visaetape.${i}" tabindex="0" role="button">
        <h3 class="step__t">${field(`visa.steps.${i}.title`, s.title)}</h3>
        ${filled(s.body) ? `<p class="step__b">${field(`visa.steps.${i}.body`, s.body)}</p>` : ''}
        ${docs.length ? `<div><p class="eyebrow">${esc(ui('inst.docs'))}</p>
            <ul class="step__list">${docs.map((dd, k) => `<li>${field(`visa.steps.${i}.docs.${k}`, dd)}</li>`).join('')}</ul></div>` : ''}
        ${filled(s.delai) ? `<p class="card__meta">${esc(ui('inst.time'))} : ${field(`visa.steps.${i}.delai`, s.delai)}</p>` : ''}
        ${l2 ? `<div class="card__acts">${l2}</div>` : ''}
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
      return `<article class="step step--ouvrable" data-panel="businessplan.${i}" tabindex="0" role="button">
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

  const foin = (parts) => parts.filter(Boolean).map((p) => t(p)).join(' ').toLowerCase();

  function rendreActeurs() {
    const q = (state.filters.acteurs || '').toLowerCase();
    const tout = list(state.data.acteurs);

    const carte = ({ a, i }) => {
      const c = a.contact || {};
      const actions = [
        lien(a.website, ui('action.website'), 'link'),
        c.email ? lien(`mailto:${c.email}`, ui('action.email'), 'mail') : '',
        c.phone ? lien(`tel:${String(c.phone).replace(/[^\d+]/g, '')}`, ui('action.call'), 'phone') : '',
      ].filter(Boolean).join('');

      return `<article class="card card--ouvrable" data-panel="acteurs.${i}" tabindex="0" role="button">
        <div class="card__top">
            ${badgeStatut(a.statut) ? `<div class="card__badges">${badgeStatut(a.statut)}</div>` : ''}
            <p class="card__title">${field(`acteurs.${i}.name`, a.name)}</p>
            ${filled(a.role) ? `<p class="card__role">${field(`acteurs.${i}.role`, a.role)}</p>` : ''}
        </div>
        ${filled(a.description) ? `<p class="card__text">${field(`acteurs.${i}.description`, a.description)}</p>` : ''}
        ${list(a.tags).length ? `<div class="tags">${list(a.tags).map((tg) => `<span class="tag">${esc(t(tg))}</span>`).join('')}</div>` : ''}
        ${actions ? `<div class="card__acts">${actions}</div>` : ''}
        ${boutonsLigne('acteurs', i)}
      </article>`;
    };

    const retenus = tout.map((a, i) => ({ a, i }))
      .filter(({ a }) => !q || foin([a.name, a.role, a.description, ...list(a.tags)]).includes(q));

    /* Deux rubriques et deux seulement : le consortium, puis tout le reste.
       Chaque fiche garde son rôle propre — que la Métropole soit l'opérateur
       reste écrit sur sa carte, seul son regroupement change. */
    const rubrique = (groupe) => {
      const dedans = retenus.filter(({ a }) => (a.groupe || 'partenaire') === groupe);
      if (!dedans.length) return '';
      return `<section class="section">
        <div class="section__head"><h2>${esc(ui(`grp.${groupe}`))}</h2><span class="day__c num">${dedans.length}</span></div>
        <div class="grid grid--2">${dedans.map(carte).join('')}</div>
      </section>`;
    };

    const corps = retenus.length
      ? rubrique('consortium') + rubrique('partenaire')
      : vide(q ? ui('empty.search') : '');

    return entete(ui('nav.acteurs'), esc(ui('sub.acteurs')))
      + `<div class="tools"><input class="search" type="search" data-filter="acteurs"
            value="${esc(state.filters.acteurs || '')}" placeholder="${esc(ui('search.acteurs'))}"></div>`
      + corps
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

      return `<article class="card card--ouvrable card--h${h.statut === 'ferme' ? ' card--ferme' : ''}"
              data-panel="hotels.${i}" tabindex="0" role="button">
        <div class="card__top">
            ${badgeStatut(h.statut) ? `<div class="card__badges">${badgeStatut(h.statut)}</div>` : ''}
            <p class="card__title">${field(`hotels.${i}.name`, h.name)}</p>
            ${filled(h.address) ? `<p class="card__role">${field(`hotels.${i}.address`, h.address)}</p>` : ''}
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

        return `<article class="card card--ouvrable" data-panel="contacts.${i}" tabindex="0" role="button">
        <div class="card__top">
              <p class="card__title">${field(`contacts.${i}.name`, c.name)}</p>
              ${filled(c.role) ? `<p class="card__role">${field(`contacts.${i}.role`, c.role)}</p>` : ''}
        </div>
          ${infos.length ? `<div class="card__meta">${infos.join('')}</div>` : ''}
          ${filled(c.note) ? `<p class="card__text">${field(`contacts.${i}.note`, c.note)}</p>` : ''}
          ${list(c.tags).length ? `<div class="tags">${list(c.tags).map((tg) => `<span class="tag tag--accent">${esc(t(tg))}</span>`).join('')}</div>` : ''}
          ${actions ? `<div class="card__acts">${actions}</div>` : ''}
          ${boutonsLigne('contacts', i)}
        </article>`;
      }).join('');

    /* Un annuaire alphabétique suppose qu'on connaisse déjà le nom. Ici on
       part du problème : « mon titre de séjour bloque » mène à la bonne
       porte. Les cibles sont des sections ou des fiches qui existent déjà. */
    const besoins = list(state.data.besoins).filter((b) => filled(b.probleme)).map((b, i) => {
      const cible = t(b.lien) || '';
      const balise = cible && !state.editing ? 'a' : 'div';
      const attr = cible && !state.editing ? ` href="${esc(cible)}"` : '';
      return `<${balise} class="need"${attr}>
        <p class="need__p">${field(`besoins.${i}.probleme`, b.probleme)}</p>
        <p class="need__r">${field(`besoins.${i}.reponse`, b.reponse)}</p>
      </${balise}>`;
    }).join('');

    const blocBesoins = besoins ? `<section class="section">
        <div class="section__head"><h2>${esc(ui('need.title'))}</h2></div>
        <p class="h48__lede">${esc(ui('need.lede'))}</p>
        <div class="grid grid--2">${besoins}</div>
      </section>` : '';

    return entete(ui('nav.contacts'), esc(ui('sub.contacts')))
      + blocBesoins
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

      const gestes = list(e.comment).filter(filled);
      const chiffres = [
        filled(e.cout) ? `<div class="etape__f"><p class="eyebrow">${esc(ui('inst.cost'))}</p>
            <p>${field(`installation.etapes.${i}.cout`, e.cout)}</p></div>` : '',
        filled(e.delai) ? `<div class="etape__f"><p class="eyebrow">${esc(ui('inst.time'))}</p>
            <p>${field(`installation.etapes.${i}.delai`, e.delai)}</p></div>` : '',
      ].filter(Boolean).join('');

      return `<article class="etape etape--ouvrable" data-panel="installation.${i}" tabindex="0" role="button">
        <div class="etape__n"><span class="etape__num num">${i}</span></div>
        <div class="etape__c">
          <h3 class="etape__t">${field(`installation.etapes.${i}.titre`, e.titre)}</h3>
          ${filled(e.quand) ? `<p class="etape__q">${svg('programme', 13)}${field(`installation.etapes.${i}.quand`, e.quand)}</p>` : ''}

          ${bloc('inst.why', 0, filled(e.pourquoi) ? `<p class="etape__p">${field(`installation.etapes.${i}.pourquoi`, e.pourquoi)}</p>` : '')}

          ${gestes.length ? `<div class="etape__b"><p class="eyebrow">${esc(ui('inst.how'))}</p>
              <ol class="etape__o">${gestes.map((x, k) => `<li>${field(`installation.etapes.${i}.comment.${k}`, x)}</li>`).join('')}</ol></div>` : ''}

          ${bloc('inst.unlocks', 0, filled(e.debloque) ? `<p class="etape__p">${field(`installation.etapes.${i}.debloque`, e.debloque)}</p>` : '')}
          ${filled(e.obstacle) ? `<div class="etape__stop"><p class="eyebrow">${esc(ui('inst.blocker'))}</p>
              <p>${field(`installation.etapes.${i}.obstacle`, e.obstacle)}</p></div>` : ''}
          ${sorties.length ? `<div class="etape__b"><p class="eyebrow">${esc(ui('inst.ways'))}</p>
              <ul class="checks">${sorties.map((x, k) => `<li>${field(`installation.etapes.${i}.solutions.${k}`, x)}</li>`).join('')}</ul></div>` : ''}

          ${filled(e.depuisAfrique) ? `<div class="etape__af"><p class="eyebrow">${esc(ui('inst.africa'))}</p>
              <p>${field(`installation.etapes.${i}.depuisAfrique`, e.depuisAfrique)}</p></div>` : ''}
          ${filled(e.aEviter) ? `<div class="etape__no"><p class="eyebrow">${esc(ui('inst.avoid'))}</p>
              <p>${field(`installation.etapes.${i}.aEviter`, e.aEviter)}</p></div>` : ''}

          ${chiffres ? `<div class="etape__facts">${chiffres}</div>` : ''}
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
      + rendreProgression()
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
      <article class="mot" data-panel="glossaire.${i}" tabindex="0" role="button">
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

      return `<article class="card card--ouvrable card--${esc(String(p.category || 'autre'))}${p.statut === 'ferme' ? ' card--ferme' : ''}"
              data-panel="marseille.${i}" tabindex="0" role="button">
        <div class="card__top">
            ${badgeStatut(p.statut) ? `<div class="card__badges">${badgeStatut(p.statut)}</div>` : ''}
            <p class="card__title">${field(`marseille.${i}.name`, p.name)}</p>
            ${filled(p.address) ? `<p class="card__role">${field(`marseille.${i}.address`, p.address)}</p>` : ''}
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


  /* ═══════════════════════ Entreprises de la promotion ═══════════════════════ */

  /* Le seul endroit du site qui accepte un logo. L'image est réduite avant
     d'être stockée : un logo de 2 Mo dans le contenu chiffré rendrait le
     fichier publié inutilisable. */
  const LOGO_MAX_PX = 260;
  const LOGO_MAX_OCTETS = 120 * 1024;

  function choisirLogo(index) {
    const champ = document.createElement('input');
    champ.type = 'file';
    champ.accept = 'image/png,image/jpeg,image/webp,image/svg+xml';
    champ.addEventListener('change', () => {
      const fichier = champ.files && champ.files[0];
      if (!fichier) return;
      const lecteur = new FileReader();
      lecteur.onload = () => {
        const img = new Image();
        img.onload = () => {
          const ratio = Math.min(1, LOGO_MAX_PX / Math.max(img.width, img.height));
          const toile = document.createElement('canvas');
          toile.width = Math.round(img.width * ratio);
          toile.height = Math.round(img.height * ratio);
          toile.getContext('2d').drawImage(img, 0, 0, toile.width, toile.height);
          const donnees = toile.toDataURL('image/png');
          if (donnees.length > LOGO_MAX_OCTETS * 1.4) { alert(ui('ent.tooBig')); return; }
          ecrire(state.data, `entreprises.${index}.logo`, donnees);
          marquerModifie();
          afficherSection();
        };
        img.onerror = () => alert(ui('ent.tooBig'));
        img.src = String(lecteur.result);
      };
      lecteur.readAsDataURL(fichier);
    });
    champ.click();
  }

  function ficheEntreprise(i) {
    const e = list(state.data.entreprises)[i];
    if (!e) { state.detail = null; return rendreEntreprises(); }

    const logo = typeof e.logo === 'string' && e.logo.startsWith('data:image/')
      ? `<div class="fiche__logo"><img src="${esc(e.logo)}" alt="${esc(t(e.nom))}"></div>` : '';

    const reperes = [
      ['ent.country', 'pays', e.pays],
      ['ent.sector', 'secteur', e.secteur],
      ['ent.stage', 'stade', e.stade],
    ].filter(([, , v]) => filled(v)).map(([cle, champ, v]) => `
      <div class="stat">
        <p class="stat__k">${esc(ui(cle))}</p>
        <p class="stat__v">${field(`entreprises.${i}.${champ}`, v)}</p>
      </div>`).join('');

    const fondateurs = list(e.fondateurs).map((f, k) => `
      <div class="fond">
        <p class="fond__n">${field(`entreprises.${i}.fondateurs.${k}.nom`, f.nom)}</p>
        <p class="fond__r">${field(`entreprises.${i}.fondateurs.${k}.role`, f.role)}</p>
        ${state.editing ? `<div class="rowtools"><button type="button" class="btn" data-delsub="entreprises.${i}.fondateurs.${k}">${svg('trash', 13)}</button></div>` : ''}
      </div>`).join('');

    /* Les rubriques accueillent ce que le noyau ne prévoit pas : marché,
       traction, besoins, tout ce que le Loop contient. */
    const blocs = list(e.blocs).map((b, k) => `
      <section class="section">
        <div class="section__head"><h2>${field(`entreprises.${i}.blocs.${k}.titre`, b.titre, { vide: ui('ent.blockTitle') })}</h2></div>
        <p class="fiche__p">${field(`entreprises.${i}.blocs.${k}.contenu`, b.contenu, { vide: ui('ent.blockBody') })}</p>
        ${state.editing ? `<div class="rowtools"><button type="button" class="btn" data-delsub="entreprises.${i}.blocs.${k}">${svg('trash', 13)}${esc(ui('edit.remove'))}</button></div>` : ''}
      </section>`).join('');

    return `<p><button type="button" class="btn" data-open="">${svg('arrow', 14)}${esc(ui('ent.back'))}</button></p>
      <header class="head fiche__head">
        ${logo}
        <p class="eyebrow">${esc(ui('nav.entreprises'))}</p>
        <h1>${field(`entreprises.${i}.nom`, e.nom, { vide: ui('ent.name') })}</h1>
        <p class="head__lede">${field(`entreprises.${i}.activite`, e.activite, { vide: ui('ent.activity') })}</p>
        ${lien(e.site, ui('action.website'), 'link')}
      </header>
      ${reperes ? `<div class="stats">${reperes}</div>` : ''}
      ${fondateurs || state.editing ? `<section class="section">
          <div class="section__head"><h2>${esc(ui('ent.founders'))}</h2></div>
          <div class="fonds">${fondateurs}</div>
          ${state.editing ? `<button type="button" class="btn listadd" data-addsub="entreprises.${i}.fondateurs">${svg('plus', 14)}${esc(ui('ent.addFounder'))}</button>` : ''}
        </section>` : ''}
      ${blocs}
      ${state.editing ? `<button type="button" class="btn listadd" data-addsub="entreprises.${i}.blocs">${svg('plus', 14)}${esc(ui('ent.addBlock'))}</button>` : ''}`;
  }

  /* ═══════════════════════ La carte ═══════════════════════
     Elle ne charge rien tant qu'on ne le demande pas. Le reste du site ne
     sort jamais vers l'extérieur — polices, images, tout est hébergé ici —
     et les tuiles satellite sont la seule exception. Elle est donc explicite :
     un bouton, un avertissement, et un site qui reste entier sans elle. */

  const TUILES = {
    sat: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
           attr: 'Esri, Maxar, Earthstar Geographics', max: 19 },
    plan: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attr: '© OpenStreetMap', max: 19 },
  };

  /* Les repères de la carte, tirés des deux sections déjà remplies. */
  function lieuxCartographies() {
    const out = [];
    list(state.data.hotels).forEach((x, i) => {
      if (x.lat && x.lng && x.statut !== 'ferme') out.push({ x, i, section: 'hotels', famille: 'hotels' });
    });
    list(state.data.marseille).forEach((x, i) => {
      if (x.lat && x.lng && x.statut !== 'ferme') out.push({ x, i, section: 'marseille', famille: String(x.category || 'autre') });
    });
    return out;
  }

  function rendreCarte() {
    const tout = lieuxCartographies();
    const cat = state.filters.carteCat || '';
    const familles = [...new Set(tout.map((l) => l.famille))];

    const filtres = familles.map((f) => `<button type="button" class="chipbtn" data-ccat="${esc(f)}"
        aria-pressed="${cat === f}">${esc(f === 'hotels' ? ui('map.hotels') : libelleCat(f))}</button>`).join('');

    const compte = tout.filter((l) => !cat || l.famille === cat).length;

    return entete(ui('nav.carte'), esc(ui('sub.carte')))
      + bandeauAncrage()
      + `<div class="tools">
          <button type="button" class="chipbtn" data-ccat="" aria-pressed="${cat === ''}">${esc(ui('label.all'))}</button>
          ${filtres}
          <span class="tools__c num">${compte}</span>
        </div>`
      + `<div class="mapwrap">
          <div class="map" id="map" role="application" aria-label="${esc(ui('nav.carte'))}"></div>
          <div class="map__gate" id="map-gate">
            <p class="map__avert">${esc(ui('map.avert'))}</p>
            <button type="button" class="btn btn--primary btn--lg" id="map-go">${esc(ui('map.charge'))}</button>
          </div>
          <div class="map__tools" id="map-tools" hidden>
            <button type="button" class="chipbtn" data-tuile="sat" aria-pressed="true">${esc(ui('map.sat'))}</button>
            <button type="button" class="chipbtn" data-tuile="plan" aria-pressed="false">${esc(ui('map.plan'))}</button>
            <button type="button" class="chipbtn" id="map-fit">${esc(ui('map.recentrer'))}</button>
          </div>
        </div>`;
  }

  /* L'instance vit hors du rendu : recréer la carte à chaque re-rendu
     ferait clignoter les tuiles et perdrait le zoom de l'utilisateur. */
  const carte = { instance: null, couche: null, reperes: [], fond: 'sat' };

  function poserReperes() {
    if (!carte.instance) return;
    carte.reperes.forEach((m) => m.remove());
    carte.reperes = [];
    const cat = state.filters.carteCat || '';
    const retenus = lieuxCartographies().filter((l) => !cat || l.famille === cat);

    retenus.forEach(({ x, i, section, famille }) => {
      const icone = L.divIcon({
        className: '', iconSize: [0, 0],
        html: `<span class="pin pin--${esc(famille)}"><span class="pin__d"></span>
                 <span class="pin__l">${esc(t(x.name))}</span></span>`,
      });
      const m = L.marker([x.lat, x.lng], { icon: icone, title: t(x.name) }).addTo(carte.instance);
      m.on('click', () => ouvrirPanneau(`${section}.${i}`));
      carte.reperes.push(m);
    });

    if (retenus.length) {
      carte.instance.fitBounds(L.latLngBounds(retenus.map((l) => [l.x.lat, l.x.lng])), { padding: [56, 56], maxZoom: 17 });
      const boite = $('#map');
      if (boite) boite.classList.toggle('map--muet', carte.instance.getZoom() < 16);
    }
  }

  function allumerCarte() {
    const boite = $('#map');
    if (!boite || carte.instance) return;
    if (typeof L === 'undefined') { boite.innerHTML = `<p class="vide">${esc(ui('map.horsligne'))}</p>`; return; }

    carte.instance = L.map(boite, { scrollWheelZoom: false, attributionControl: true })
                      .setView([43.3053, 5.3665], 15);
    /* Seize repères dans un mouchoir de poche : à faible zoom les libellés
       se recouvrent et la carte devient illisible. On ne les montre qu'une
       fois assez près ; en dessous, le survol suffit. */
    const jaugerLibelles = () => boite.classList.toggle('map--muet', carte.instance.getZoom() < 16);
    carte.instance.on('zoomend', jaugerLibelles);
    changerFond('sat');
    poserReperes();
    jaugerLibelles();
    $('#map-gate').hidden = true;
    $('#map-tools').hidden = false;
    /* Leaflet mesure son conteneur à la construction : s'il était caché,
       il faut le lui redemander une fois visible. */
    setTimeout(() => carte.instance.invalidateSize(), 60);
  }

  function changerFond(nom) {
    if (!carte.instance) return;
    const t2 = TUILES[nom] || TUILES.sat;
    if (carte.couche) carte.couche.remove();
    carte.couche = L.tileLayer(t2.url, { maxZoom: t2.max, attribution: t2.attr }).addTo(carte.instance);
    carte.fond = nom;
    document.querySelectorAll('[data-tuile]').forEach((b) =>
      b.setAttribute('aria-pressed', String(b.dataset.tuile === nom)));
  }

  function rendreEntreprises() {
    if (state.detail !== null && state.detail !== undefined) return ficheEntreprise(state.detail);

    /* Le pays est écrit « Tunisie · Tunis » : on filtre sur le pays seul,
       sinon chaque ville ferait sa propre catégorie. */
    const pays = (e) => String(t(e.pays) || '').split('·')[0].trim();
    const choisi = state.filters.entPays || '';
    const paysDispo = [...new Set(list(state.data.entreprises).map(pays).filter(Boolean))].sort();

    const cartes = list(state.data.entreprises)
      .map((e, i) => ({ e, i }))
      .filter(({ e }) => !choisi || pays(e) === choisi)
      .map(({ e, i }) => {
      const logo = typeof e.logo === 'string' && e.logo.startsWith('data:image/')
        ? `<img src="${esc(e.logo)}" alt="${esc(t(e.nom))}">`
        : `<span class="boite__vide">${esc(ui('ent.noLogo'))}</span>`;

      return `<article class="boite">
        <div class="boite__logo">${logo}</div>
        <div>
          <p class="boite__n">${field(`entreprises.${i}.nom`, e.nom, { vide: ui('ent.name') })}</p>
          <p class="boite__a">${field(`entreprises.${i}.activite`, e.activite, { vide: ui('ent.activity') })}</p>
        </div>
        <button type="button" class="btn" data-open="${i}">${esc(ui('ent.open'))}${svg('arrow', 14)}</button>
        <div class="boite__tools">
          <button type="button" class="btn" data-logo="${i}">${svg('image', 14)}${esc(ui('ent.addLogo'))}</button>
          ${e.logo ? `<button type="button" class="btn" data-dellogo="${i}">${esc(ui('ent.delLogo'))}</button>` : ''}
          <button type="button" class="btn" data-del="entreprises.${i}">${svg('trash', 13)}${esc(ui('edit.remove'))}</button>
        </div>
      </article>`;
    }).join('');

    const filtresPays = paysDispo.length > 1 ? `<div class="tools">
        <button type="button" class="chipbtn" data-epays="" aria-pressed="${choisi === ''}">${esc(ui('label.all'))}</button>
        ${paysDispo.map((p) => `<button type="button" class="chipbtn" data-epays="${esc(p)}"
            aria-pressed="${choisi === p}">${esc(p)}</button>`).join('')}
      </div>` : '';

    return entete(ui('nav.entreprises'), esc(ui('sub.entreprises')))
      + filtresPays
      + (cartes ? `<div class="boites">${cartes}</div>` : vide(ui('empty.search')))
      + boutonAjout('entreprises');
  }

  const RENDUS = {
    'accueil': rendreAccueil,
    'programme': () => entete(ui('nav.programme'), esc(ui('sub.programme'))) + rendreProgramme(),
    'visa': rendreVisa,
    'business-plan': rendreBusinessPlan,
    'acteurs': rendreActeurs,
    'hotels': rendreHotels,
    'contacts': rendreContacts,
    'marseille': rendreMarseille,
    'installation': rendreInstallation,
    'glossaire': rendreGlossaire,
    'entreprises': rendreEntreprises,
    'carte': rendreCarte,
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
    const pousse = (section, titre, detail, texte, fiche) => {
      if (!String(titre || '').trim()) return;
      entrees.push({ section, titre: String(titre), detail: String(detail || ''),
                     fiche: fiche === undefined ? null : fiche,
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
    list((state.data.installation || {}).etapes).forEach((x) => pousse('installation', t(x.titre), t(x.quand), `${t(x.pourquoi)} ${t(x.obstacle)} ${list(x.solutions).map(t).join(' ')}`));
    list(state.data.glossaire).forEach((x) => pousse('glossaire', t(x.terme), t(x.definition), t(x.piege)));
    list(state.data.entreprises).forEach((x, i) => pousse('entreprises', t(x.nom), t(x.secteur), `${t(x.activite)} ${t(x.pays)}`, i));
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
      <button type="button" class="find__hit" data-goto="${esc(e.section)}"
              ${e.fiche === null ? '' : `data-fiche="${e.fiche}"`} ${i === 0 ? 'data-first' : ''}>
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

    /* Quand une nouvelle version prend la main, on repart dessus immédiatement.
       Sans ça, l'onglet ouvert continue de tourner sur l'ancien code et on croit
       que la correction n'a pas été publiée. Une seule fois, et jamais à la
       première installation — sinon la page se recharge dès la première visite. */
    const dejaControle = !!navigator.serviceWorker.controller;
    let rechargee = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!dejaControle || rechargee) return;
      rechargee = true;
      location.reload();
    });

    navigator.serviceWorker.register('sw.js').catch(() => {
      /* Un enregistrement refusé (contexte non sécurisé) n'empêche rien : le
         site fonctionne, il ne sera simplement pas consultable hors réseau. */
    });
  }


  /* ═══════════════════════ Panneau de détail ═══════════════════════ */

  /* Un cadre sur lequel on a envie de cliquer doit s'ouvrir. Le panneau glisse
     par-dessus la liste au lieu de changer de page : on garde le contexte, et
     le même mécanisme sert à toutes les sections. */

  const bloc = (titre, contenu) => (contenu
    ? `<section class="pan__b"><p class="eyebrow">${esc(titre)}</p>${contenu}</section>` : '');

  const liste = (items) => (items.length
    ? `<ul class="pan__l">${items.map((x) => `<li>${x}</li>`).join('')}</ul>` : '');

  /* ── Liens croisés entre panneaux ────────────────────────────────────
     Un panneau qui répète sa carte ne sert à rien. Ce que ces helpers
     ajoutent ne s'invente pas : ils relient des entrées qui existent déjà
     — la personne à sa structure, la structure à ses sessions, la session
     à ses intervenants et aux mots du glossaire qu'elle emploie. */

  const puce = (section, i, texte) =>
    `<button type="button" class="chipbtn" data-panel="${section}.${i}">${esc(texte)}</button>`;

  const puces = (items) => (items.length ? `<div class="tools">${items.join('')}</div>` : '');

  /* « Nom — Rôle, Structure » : on ne garde que le nom. */
  const nomIntervenant = (s) => t(s).split('—')[0].trim();

  const indexActeur = (nom) => list(state.data.acteurs)
    .findIndex((a) => t(a.name).toLowerCase() === String(nom || '').toLowerCase());

  const contactsDe = (org) => list(state.data.contacts)
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => t(c.org).toLowerCase() === String(org || '').toLowerCase());

  const indexContact = (nom) => list(state.data.contacts)
    .findIndex((c) => t(c.name).toLowerCase() === String(nom || '').toLowerCase());

  /* Sessions où l'aiguille apparaît parmi les intervenants — une personne
     par son nom, une structure par la mention qui suit son rôle. */
  const sessionsOu = (aiguille) => {
    const a = String(aiguille || '').toLowerCase();
    if (!a) return [];
    return list(state.data.programme).map((s, i) => ({ s, i }))
      .filter(({ s }) => list(s.speakers).some((sp) => t(sp).toLowerCase().includes(a)));
  };

  /* Termes du glossaire réellement employés dans un texte. Simple présence,
     rien de deviné : si le mot n'y est pas, aucune puce n'apparaît. */
  const termesDe = (texte) => {
    const p = String(texte || '').toLowerCase();
    return list(state.data.glossaire).map((g, i) => ({ g, i }))
      .filter(({ g }) => t(g.terme).length > 3 && p.includes(t(g.terme).toLowerCase()))
      .slice(0, 8);
  };

  /* Même principe pour les structures citées dans une session. */
  const structuresDe = (texte) => {
    const p = String(texte || '').toLowerCase();
    return list(state.data.acteurs).map((a, i) => ({ a, i }))
      .filter(({ a }) => {
        /* « CISAM — Cité de l'Innovation… » n'apparaît jamais en entier dans
           une description : on cherche aussi le nom court. */
        const court = t(a.name).split('—')[0].trim().toLowerCase();
        return court.length > 3 && p.includes(court);
      })
      .slice(0, 6);
  };

  /* Les autres fondateurs du même pays. C'est le seul rapprochement qu'on
     puisse faire sans rien interpréter : le pays est déjà une étiquette. */
  const memePays = (contact, moi) => {
    const pays = list(contact.tags).map(t).filter((x) => !/promotion|consortium|équipe|intervenant/i.test(x));
    if (!pays.length) return [];
    return list(state.data.contacts).map((c, i) => ({ c, i }))
      .filter(({ c, i }) => i !== moi && list(c.tags).some((x) => pays.includes(t(x))));
  };

  function panneauGlossaire(i) {
    const g = list(state.data.glossaire)[i];
    if (!g) return '';
    const voir = list(g.voirAussi)
      .map((nom) => {
        const k = list(state.data.glossaire).findIndex((x) => x.terme === nom);
        return k < 0 ? '' : `<button type="button" class="chipbtn" data-panel="glossaire.${k}">${esc(nom)}</button>`;
      }).filter(Boolean).join('');

    return { titre: field(`glossaire.${i}.terme`, g.terme),
             surtitre: ui(`glo.${g.categorie}`),
             corps:
      bloc(ui('pan.def'), `<p class="pan__p">${field(`glossaire.${i}.definition`, g.definition)}</p>`)
      + bloc(ui('pan.detail'), filled(g.detail) ? `<p class="pan__p">${field(`glossaire.${i}.detail`, g.detail)}</p>` : '')
      + bloc(ui('pan.where'), liste(list(g.contextes).map((c, k) => field(`glossaire.${i}.contextes.${k}`, c))))
      + (filled(g.piege) ? `<section class="pan__b pan__warn"><p class="eyebrow">${esc(ui('glo.trap'))}</p>
          <p class="pan__p">${field(`glossaire.${i}.piege`, g.piege)}</p></section>` : '')
      + bloc(ui('pan.seeAlso'), voir ? `<div class="tools">${voir}</div>` : '') };
  }

  function panneauActeur(i) {
    const a = list(state.data.acteurs)[i];
    if (!a) return '';
    const c = a.contact || {};
    const actions = [
      lien(a.website, ui('action.website'), 'link'),
      c.email ? lien(`mailto:${c.email}`, ui('action.email'), 'mail') : '',
      c.phone ? lien(`tel:${String(c.phone).replace(/[^\d+]/g, '')}`, ui('action.call'), 'phone') : '',
    ].filter(Boolean).join('');
    const demander = list(a.aDemander).filter(filled)
      .map((x, k) => field(`acteurs.${i}.aDemander.${k}`, x));
    const reperes = list(a.reperes).filter(filled)
      .map((x, k) => field(`acteurs.${i}.reperes.${k}`, x));

    const gens = contactsDe(a.name).map(({ c, i: k }) => puce('contacts', k, t(c.name)));
    const sessions = sessionsOu(a.name).map(({ s, i: k }) => puce('programme', k, t(s.title)));

    return { titre: field(`acteurs.${i}.name`, a.name),
             surtitre: ui(`grp.${a.groupe || 'partenaire'}`),
             corps:
      bloc(ui('pan.about'), `<p class="pan__p">${field(`acteurs.${i}.role`, a.role)}</p>
          <p class="pan__p">${field(`acteurs.${i}.description`, a.description)}</p>`)
      + (filled(a.pourVous) ? `<section class="pan__b pan__keep"><p class="eyebrow">${esc(ui('pan.forYou'))}</p>
          <p class="pan__p">${field(`acteurs.${i}.pourVous`, a.pourVous)}</p></section>` : '')
      + bloc(ui('pan.ask'), liste(demander))
      + (filled(a.nePasAttendre) ? `<section class="pan__b pan__warn"><p class="eyebrow">${esc(ui('pan.notThis'))}</p>
          <p class="pan__p">${field(`acteurs.${i}.nePasAttendre`, a.nePasAttendre)}</p></section>` : '')
      + bloc(ui('pan.markers'), liste(reperes))
      + bloc(ui('pan.people'), puces(gens))
      + bloc(ui('pan.sessions'), puces(sessions))
      + bloc(ui('pan.contact'), actions ? `<div class="card__acts">${actions}</div>` : '')
      + (list(a.tags).length ? `<div class="tags">${list(a.tags).map((tg) => `<span class="tag">${esc(t(tg))}</span>`).join('')}</div>` : '')
      + (a.releve ? `<p class="pan__src">${esc(ui('pan.sourced'))} ${esc(dateLongue(a.releve))}.</p>` : '') };
  }

  function panneauContact(i) {
    const c = list(state.data.contacts)[i];
    if (!c) return '';
    const actions = [
      c.email ? lien(`mailto:${c.email}`, ui('action.email'), 'mail') : '',
      c.phone ? lien(`tel:${String(c.phone).replace(/[^\d+]/g, '')}`, ui('action.call'), 'phone') : '',
      lien(c.website, ui('action.website'), 'link'),
      lien(c.linkedin, 'LinkedIn', 'link'),
    ].filter(Boolean).join('');
    const infos = [];
    if (filled(c.org)) infos.push(field(`contacts.${i}.org`, c.org));
    if (list(c.languages).length) infos.push(list(c.languages).map((l) => esc(String(l).toUpperCase())).join(' / '));
    /* La structure de la personne, quand elle a sa propre fiche : on montre
       ce qu'elle fait, plutôt que de laisser un nom d'organisation mort. */
    const k = indexActeur(c.org);
    const org = k >= 0 ? list(state.data.acteurs)[k] : null;
    const blocOrg = org
      ? `<p class="pan__p">${esc(t(org.role))}</p>${puces([puce('acteurs', k, t(org.name))])}`
      : '';

    /* Un fondateur : son organisation n'est pas une structure du programme,
       c'est son entreprise. On le dit, et le site de l'entreprise suffit. */
    const fondateur = !org && filled(c.org) && list(c.tags).some((x) => /promotion/i.test(t(x)));
    const blocEntreprise = fondateur
      ? `<p class="pan__p">${esc(ui('pan.founderOf'))} <strong>${esc(t(c.org))}</strong></p>` : '';

    const sessions = sessionsOu(t(c.name)).map(({ s, i: n }) => puce('programme', n, t(s.title)));
    const muet = !c.email && !c.phone && !c.linkedin;
    const voisins = memePays(c, i).map(({ c: v, i: n }) => puce('contacts', n, `${t(v.name)} · ${t(v.org)}`));

    return { titre: field(`contacts.${i}.name`, c.name),
             surtitre: t(c.role) || ui('nav.contacts'),
             corps:
      bloc(ui('pan.about'), `<p class="pan__p">${field(`contacts.${i}.role`, c.role)}</p>`
          + (filled(c.note) ? `<p class="pan__p">${field(`contacts.${i}.note`, c.note)}</p>` : ''))
      + bloc(ui('pan.org'), blocOrg || blocEntreprise)
      + bloc(ui('pan.speaks'), puces(sessions))
      + bloc(ui('pan.sameCountry'), puces(voisins))
      + bloc(ui('pan.practical'), liste(infos))
      + bloc(ui('pan.contact'), actions ? `<div class="card__acts">${actions}</div>` : '')
      + (muet ? `<section class="pan__b pan__warn"><p class="eyebrow">${esc(ui('pan.contact'))}</p>
          <p class="pan__p">${esc(ui('pan.noContact'))}</p></section>` : '')
      + (list(c.tags).length ? `<div class="tags">${list(c.tags).map((tg) => `<span class="tag tag--accent">${esc(t(tg))}</span>`).join('')}</div>` : '') };
  }

  function panneauLieu(section, i) {
    const x = list(state.data[section])[i];
    if (!x) return '';
    const b2 = x.booking || {};
    const infos = [];
    if (filled(x.categorie_lieu)) infos.push(`${esc(ui('pan.type'))} : ${field(`${section}.${i}.categorie_lieu`, x.categorie_lieu)}`);
    if (filled(x.distance)) infos.push(field(`${section}.${i}.distance`, x.distance));
    if (filled(x.note)) infos.push(`${esc(ui('pan.rating'))} : ${field(`${section}.${i}.note`, x.note)}`);
    if (filled(x.priceRange)) infos.push(field(`${section}.${i}.priceRange`, x.priceRange));
    if (filled(x.priceLevel)) infos.push(field(`${section}.${i}.priceLevel`, x.priceLevel));

    const actions = [
      lien(x.website, ui('action.website'), 'link'),
      lien(x.map, ui('action.map'), 'pin'),
      x.telephone ? lien(`tel:${String(x.telephone).replace(/[^\d+]/g, '')}`, t(x.telephone), 'phone') : '',
      x.email ? lien(`mailto:${x.email}`, ui('action.email'), 'mail') : '',
    ].filter(Boolean).join('');

    const services = list(x.services).filter(filled)
      .map((sv, k) => field(`${section}.${i}.services.${k}`, sv));

    return { titre: field(`${section}.${i}.name`, x.name),
             surtitre: t(x.address) || ui(`nav.${section}`),
             corps:
      bloc(ui('pan.about'), (filled(x.notes) ? `<p class="pan__p">${field(`${section}.${i}.notes`, x.notes)}</p>` : '')
          + (filled(x.why) ? `<p class="pan__p">${field(`${section}.${i}.why`, x.why)}</p>` : ''))
      + bloc(ui('pan.practical'), liste(infos))
      + bloc(ui('pan.hours'), filled(x.horaires) ? `<p class="pan__p">${field(`${section}.${i}.horaires`, x.horaires)}</p>` : '')
      + bloc(ui('pan.access'), filled(x.acces) ? `<p class="pan__p">${field(`${section}.${i}.acces`, x.acces)}</p>` : '')
      + bloc(ui('pan.services'), liste(services))
      + (filled(b2.contact) || filled(b2.code) ? bloc(ui('label.booking'),
          `<p class="pan__p">${field(`${section}.${i}.booking.contact`, b2.contact)} ${field(`${section}.${i}.booking.code`, b2.code)}</p>`) : '')
      + (filled(x.aRetenir) ? `<section class="pan__b pan__keep"><p class="eyebrow">${esc(ui('pan.keep'))}</p>
          <p class="pan__p">${field(`${section}.${i}.aRetenir`, x.aRetenir)}</p></section>` : '')
      + bloc(ui('pan.contact'), actions ? `<div class="card__acts">${actions}</div>` : '')
      + `<p class="pan__src">${x.releve
            ? `${esc(ui('pan.sourced'))} ${esc(dateLongue(x.releve))}.`
            : esc(ui('pan.notSourced'))}</p>` };
  }

  function panneauSession(i) {
    const x = list(state.data.programme)[i];
    if (!x) return '';
    const l = x.location || {};
    const infos = [];
    if (filled(l.name)) infos.push(field(`programme.${i}.location.name`, l.name));
    if (filled(l.address)) infos.push(field(`programme.${i}.location.address`, l.address));
    const res = list(x.resources).map((r) => lien(r.url, t(r.label) || ui('label.resources'), 'link'))
      .filter(Boolean).join('');

    /* Chaque intervenant renvoie à sa fiche du carnet quand elle existe, et
       à celle de sa structure sinon. Le rôle reste affiché : c'est lui qui
       dit pourquoi cette personne parle. */
    const gens = list(x.speakers).map((sp) => {
      const nom = nomIntervenant(sp);
      const k = indexContact(nom);
      const reste = t(sp).split('—').slice(1).join('—').trim();
      const cible = k >= 0 ? puce('contacts', k, nom) : `<span class="chipbtn chipbtn--mort">${esc(nom)}</span>`;
      return `<li>${cible}${reste ? ` <span class="pan__role">${esc(reste)}</span>` : ''}</li>`;
    });

    /* Le lieu, quand il correspond à une fiche d'Hôtels ou de Marseille. */
    const cherche = String(t(l.name) || '').toLowerCase();
    let lieu = '';
    for (const s of ['marseille', 'hotels']) {
      const k = list(state.data[s]).findIndex((y) => cherche && t(y.name).toLowerCase() === cherche);
      if (k >= 0) { lieu = puces([puce(s, k, t(l.name))]); break; }
    }

    const texte = `${t(x.title)} ${t(x.description)} ${list(x.speakers).map(t).join(' ')}`;
    const mots = termesDe(texte).map(({ g, i: k }) => puce('glossaire', k, t(g.terme)));
    const orgs = structuresDe(texte).map(({ a, i: k }) => puce('acteurs', k, t(a.name)));

    return { titre: field(`programme.${i}.title`, x.title),
             surtitre: `${dateLongue(x.date)} · ${t(x.start)}–${t(x.end)}`,
             corps:
      bloc(ui('pan.session'), filled(x.description) ? `<p class="pan__p">${field(`programme.${i}.description`, x.description)}</p>` : '')
      + bloc(ui('pan.speakers'), gens.length ? `<ul class="pan__l">${gens.join('')}</ul>` : '')
      + bloc(ui('pan.venue'), lieu)
      + bloc(ui('pan.practical'), liste(infos))
      + bloc(ui('replay.title'), (() => {
          const r = x.replay || {};
          if (filled(r.url)) return `<div class="card__acts">${lien(t(r.url), ui('replay.title'), 'play')}</div>`;
          if (filled(r.fichier)) return `<p class="pan__p">${esc(ui('replay.pending'))} <code>${esc(t(r.fichier))}</code></p>`;
          return '';
        })())
      + bloc(ui('label.resources'), res ? `<div class="card__acts">${res}</div>` : '')
      + bloc(ui('pan.orgs'), puces(orgs))
      + bloc(ui('pan.terms'), puces(mots)) };
  }

  /* Une étape d'installation ouvre son propre panneau. La carte de la page
     donne la marche à suivre ; le panneau donne ce qui ne tenait pas dedans
     sans l'alourdir : les pièces, les liens officiels, les mots du glossaire
     qu'elle emploie, et l'étape qui suit. */
  function panneauEtape(i) {
    const e = list((state.data.installation || {}).etapes)[i];
    if (!e) return '';
    const gestes = list(e.comment).filter(filled).map((x, k) => field(`installation.etapes.${i}.comment.${k}`, x));
    const sorties = list(e.solutions).filter(filled).map((x, k) => field(`installation.etapes.${i}.solutions.${k}`, x));
    const pieces = list(e.documents).filter(filled).map((x, k) => field(`installation.etapes.${i}.documents.${k}`, x));
    const liens = list(e.liens).map((l) => lien(l.url, l.label, 'link')).filter(Boolean).join('');
    const infos = [];
    if (filled(e.cout)) infos.push(`${esc(ui('inst.cost'))} : ${field(`installation.etapes.${i}.cout`, e.cout)}`);
    if (filled(e.delai)) infos.push(`${esc(ui('inst.time'))} : ${field(`installation.etapes.${i}.delai`, e.delai)}`);

    const suivante = list((state.data.installation || {}).etapes)[i + 1];
    const apres = suivante ? puces([puce('installation', i + 1, t(suivante.titre))]) : '';
    const mots = termesDe(`${t(e.pourquoi)} ${t(e.obstacle)} ${list(e.solutions).map(t).join(' ')} ${list(e.documents).map(t).join(' ')}`)
      .map(({ g, i: k }) => puce('glossaire', k, t(g.terme)));

    return { titre: field(`installation.etapes.${i}.titre`, e.titre),
             surtitre: t(e.quand) || ui('nav.installation'),
             corps:
      bloc(ui('inst.why'), filled(e.pourquoi) ? `<p class="pan__p">${field(`installation.etapes.${i}.pourquoi`, e.pourquoi)}</p>` : '')
      + bloc(ui('inst.how'), gestes.length ? `<ol class="pan__o">${gestes.map((g) => `<li>${g}</li>`).join('')}</ol>` : '')
      + (filled(e.obstacle) ? `<section class="pan__b pan__warn"><p class="eyebrow">${esc(ui('inst.blocker'))}</p>
          <p class="pan__p">${field(`installation.etapes.${i}.obstacle`, e.obstacle)}</p></section>` : '')
      + bloc(ui('inst.ways'), liste(sorties))
      + (filled(e.depuisAfrique) ? `<section class="pan__b pan__keep"><p class="eyebrow">${esc(ui('inst.africa'))}</p>
          <p class="pan__p">${field(`installation.etapes.${i}.depuisAfrique`, e.depuisAfrique)}</p></section>` : '')
      + (filled(e.aEviter) ? `<section class="pan__b pan__warn"><p class="eyebrow">${esc(ui('inst.avoid'))}</p>
          <p class="pan__p">${field(`installation.etapes.${i}.aEviter`, e.aEviter)}</p></section>` : '')
      + bloc(ui('pan.practical'), liste(infos))
      + bloc(ui('inst.docs'), liste(pieces))
      + bloc(ui('label.resources'), liens ? `<div class="card__acts">${liens}</div>` : '')
      + bloc(ui('pan.terms'), puces(mots))
      + bloc(ui('inst.unlocks'), (filled(e.debloque) ? `<p class="pan__p">${field(`installation.etapes.${i}.debloque`, e.debloque)}</p>` : '') + apres) };
  }

  function panneauVoieVisa(i) {
    const v = list((state.data.visa || {}).tracks)[i];
    if (!v) return '';
    const etapes = list((state.data.visa || {}).steps)
      .map((s, k) => puce('visaetape', k, t(s.title)));
    return { titre: field(`visa.tracks.${i}.name`, v.name),
             surtitre: ui('nav.visa'),
             corps:
      bloc(ui('visa.who'), filled(v.who) ? `<p class="pan__p">${field(`visa.tracks.${i}.who`, v.who)}</p>` : '')
      + bloc(ui('label.resources'), filled(v.lien) ? `<div class="card__acts">${lien(t(v.lien), ui('action.website'), 'link')}</div>` : '')
      + bloc(ui('pan.sessions'), puces(etapes)) };
  }

  function panneauEtapeVisa(i) {
    const s = list((state.data.visa || {}).steps)[i];
    if (!s) return '';
    const docs = list(s.docs).filter(filled).map((x, k) => field(`visa.steps.${i}.docs.${k}`, x));
    const suivante = list((state.data.visa || {}).steps)[i + 1];
    const mots = termesDe(`${t(s.title)} ${t(s.body)} ${list(s.docs).map(t).join(' ')}`)
      .map(({ g, i: k }) => puce('glossaire', k, t(g.terme)));
    return { titre: field(`visa.steps.${i}.title`, s.title),
             surtitre: ui('nav.visa'),
             corps:
      bloc(ui('visa.step'), filled(s.body) ? `<p class="pan__p">${field(`visa.steps.${i}.body`, s.body)}</p>` : '')
      + bloc(ui('inst.docs'), liste(docs))
      + bloc(ui('inst.time'), filled(s.delai) ? `<p class="pan__p">${field(`visa.steps.${i}.delai`, s.delai)}</p>` : '')
      + bloc(ui('label.resources'), s.lien && s.lien.url ? `<div class="card__acts">${lien(s.lien.url, s.lien.label, 'link')}</div>` : '')
      + bloc(ui('pan.terms'), puces(mots))
      + bloc(ui('pan.seeAlso'), suivante ? puces([puce('visaetape', i + 1, t(suivante.title))]) : '') };
  }

  function panneauBusinessPlan(i) {
    const s = list((state.data.businessPlan || {}).sections)[i];
    if (!s) return '';
    const items = list(s.checklist).filter(filled).map((x, k) => field(`businessPlan.sections.${i}.checklist.${k}`, x));
    const mots = termesDe(`${t(s.title)} ${t(s.body)}`).map(({ g, i: k }) => puce('glossaire', k, t(g.terme)));
    /* Les sessions du programme qui portent sur ce thème : simple présence des
       mots du titre dans le titre ou la description d'une session. */
    const cles = t(s.title).toLowerCase().split(/[\s,'’]+/).filter((w) => w.length > 5);
    const sessions = list(state.data.programme).map((x, k) => ({ x, k }))
      .filter(({ x }) => cles.some((c) => `${t(x.title)} ${t(x.description)}`.toLowerCase().includes(c)))
      .slice(0, 4).map(({ x, k }) => puce('programme', k, t(x.title)));
    const liens = list(s.liens).map((x) => lien(x.url, x.label, 'link')).filter(Boolean).join('');
    /* Les paragraphes du détail sont séparés par des sauts de ligne dans la
       donnée : on les rend tels quels, sinon tout se colle en un pavé. */
    const paras = (v) => t(v).split(/\n{2,}/).filter(Boolean)
      .map((p) => `<p class="pan__p">${esc(p)}</p>`).join('');

    return { titre: field(`businessPlan.sections.${i}.title`, s.title),
             surtitre: ui('nav.business-plan'),
             corps:
      bloc(ui('bp.detail'), filled(s.detail) ? paras(s.detail)
             : (filled(s.body) ? `<p class="pan__p">${field(`businessPlan.sections.${i}.body`, s.body)}</p>` : ''))
      + bloc(ui('bp.cover'), liste(items))
      + (filled(s.pieges) ? `<section class="pan__b pan__warn"><p class="eyebrow">${esc(ui('bp.traps'))}</p>
          <p class="pan__p">${field(`businessPlan.sections.${i}.pieges`, s.pieges)}</p></section>` : '')
      + bloc(ui('label.resources'), liens ? `<div class="card__acts">${liens}</div>` : '')
      + bloc(ui('pan.sessions'), puces(sessions))
      + bloc(ui('pan.terms'), puces(mots)) };
  }

  const PANNEAUX = {
    glossaire: panneauGlossaire,
    installation: panneauEtape,
    visa: panneauVoieVisa,
    visaetape: panneauEtapeVisa,
    businessplan: panneauBusinessPlan,
    acteurs: panneauActeur,
    contacts: panneauContact,
    hotels: (i) => panneauLieu('hotels', i),
    marseille: (i) => panneauLieu('marseille', i),
    programme: panneauSession,
  };

  function afficherPanneau() {
    const boite = $('#panel');
    if (!state.panneau) { boite.hidden = true; document.body.classList.remove('paneled'); return; }
    const { section, index } = state.panneau;
    const fabrique = PANNEAUX[section];
    const contenu = fabrique && fabrique(index);
    if (!contenu) { state.panneau = null; boite.hidden = true; return; }

    $('#panel-body').innerHTML = `
      <p class="eyebrow">${esc(contenu.surtitre)}</p>
      <h2 class="pan__t">${contenu.titre}</h2>
      ${contenu.corps}`;
    boite.hidden = false;
    document.body.classList.add('paneled');
    $('#panel-close').focus();
  }

  function ouvrirPanneau(cle) {
    const [section, index] = String(cle).split('.');
    if (!PANNEAUX[section]) return;
    state.panneau = { section, index: Number(index) };
    afficherPanneau();
  }

  const fermerPanneau = () => { state.panneau = null; afficherPanneau(); };

  /* ═══════════════════════ Rendu et navigation ═══════════════════════ */

  function afficherNav() {
    /* Douze onglets à plat ne se lisent pas. Trois familles, séparées par un
       filet : ce qui se passe, ce qu'on doit faire, et le territoire. */
    const OUVRE_GROUPE = new Set(['installation', 'entreprises']);
    $('#nav').innerHTML = SECTIONS.map((id) => `
      <button type="button" class="nav__item" data-section="${id}"
              ${OUVRE_GROUPE.has(id) ? 'data-groupe="1"' : ''}
              ${state.section === id ? 'aria-current="page"' : ''}>
        <span class="nav__icon">${svg(id)}</span>
        <span>${esc(ui(`nav.${id}`))}</span>
      </button>`).join('');

    /* Le pied de page : la bande défilante ne clôturait rien. */
    const m = state.data.meta || {};
    const pied = $('#pied');
    if (pied) {
      pied.innerHTML = `
        <div class="pied__c"><p>${esc(ui('site.name'))}</p>
          <p>${esc(ui('foot.who'))}</p></div>
        <div class="pied__c"><p>${esc(ui('foot.update'))}</p>
          <p>${filled(m.updatedAt) ? esc(dateLongue(t(m.updatedAt))) : '—'}</p></div>
        <div class="pied__c"><p>${esc(ui('foot.private'))}</p>
          <p>${esc(ui('app.confidential'))}</p></div>
        <div class="pied__c"><p>${esc(ui('off.ready'))}</p>
          <p>${esc(ui('foot.offline'))}</p></div>`;
    }
  }

  function afficherSection() {
    /* Le conteneur de la carte est réécrit à chaque rendu : l'instance
       Leaflet qui pointait dessus devient orpheline. On la démonte, sinon
       elle laisse des écouteurs et des tuiles derrière elle. */
    if (carte.instance) {
      carte.instance.remove();
      carte.instance = null; carte.couche = null; carte.reperes = [];
    }
    SECTIONS.forEach((id) => {
      const vue = document.getElementById(`view-${id}`);
      if (!vue) return;
      const actif = id === state.section;
      vue.hidden = !actif;
      if (actif) vue.innerHTML = RENDUS[id]();
    });
    $('#topbar-title').textContent = ui(`nav.${state.section}`);
    if (state.panneau) afficherPanneau();
  }

  /* La bande défilante remplace la ligne de pied de page : elle fait tourner
     les partenaires, la date de mise à jour et la mention de confidentialité.
     La piste est écrite deux fois pour que la boucle soit invisible. */
  function afficherBande() {
    const m = state.data.meta || {};
    const noms = list(state.data.acteurs).map((a) => t(a.name)).filter(Boolean);
    const items = [
      ...noms,
      filled(m.updatedAt) ? `${ui('app.updated')} ${dateLongue(t(m.updatedAt))}` : '',
      ui('app.confidential'),
    ].filter(Boolean);
    if (!items.length) return;
    const piste = items.map((x) => `<span class="ticker__i">${esc(x)}</span>`).join('');
    $('#ticker-track').innerHTML = piste + piste;
    /* La durée suit le nombre d'éléments : sinon une longue liste défile trop vite. */
    $('#ticker-track').style.setProperty('--duree', `${Math.max(28, items.length * 4)}s`);
  }

  function afficherChrome() {
    const m = state.data.meta || {};
    /* Le nom de la promotion vivait au pied de la colonne de gauche, qui
       n'existe plus : il passe dans le bandeau, à côté du titre de section. */
    const promo = $('#promo');
    if (promo) promo.textContent = t(m.promotion) || '';
    $('#foot-updated').textContent = filled(m.updatedAt) ? `${ui('app.updated')} ${dateLongue(t(m.updatedAt))}` : '';
    afficherBande();
    $$('[data-i18n]').forEach((n) => { n.textContent = ui(n.dataset.i18n); });
    $$('[data-i18n-placeholder]').forEach((n) => { n.placeholder = ui(n.dataset.i18nPlaceholder); });
    $$('.langbtn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === state.lang)));
    document.documentElement.lang = state.lang;
    majBarreEdition();
    $('.findbtn__i').innerHTML = svg('search', 15);
    $('.find__headi').innerHTML = svg('search', 17);
    indexCache = null;   /* les libellés de section changent avec la langue */
  }

  function toutAfficher() { afficherChrome(); afficherNav(); afficherSection(); }

  function aller(section, { push = true } = {}) {
    if (!RENDUS[section]) section = 'accueil';
    if (section !== state.section) state.detail = null;
    state.panneau = null;
    afficherPanneau();
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

  function definirLangue(lang) {
    state.lang = lang === 'en' ? 'en' : 'fr';
    localStorage.setItem('slpac.lang', state.lang);
    if (state.data) toutAfficher();
    else {
      $$('[data-i18n]').forEach((n) => { n.textContent = ui(n.dataset.i18n); });
      $$('.langbtn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === state.lang)));
      document.documentElement.lang = state.lang;
    }
  }

  /* ═══════════════════════ Démarrage ═══════════════════════ */

  function demarrer(anime = false) {
    const porte = $('#gate');
    const app = $('#app');

    /* On rend d'abord, la porte encore visible par-dessus : le site est prêt
       au moment où elle s'efface, sinon on voit une page vide apparaître. */
    app.hidden = false;
    const h = location.hash.replace('#', '');
    state.section = RENDUS[h] ? h : 'accueil';
    toutAfficher();

    if (!anime || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      porte.hidden = true;
    } else {
      porte.classList.add('gate--part');
      app.classList.add('app--entre');
      setTimeout(() => { porte.hidden = true; porte.classList.remove('gate--part'); }, 420);
      setTimeout(() => app.classList.remove('app--entre'), 900);
    }

    if (state.timer) clearInterval(state.timer);
    state.timer = setInterval(() => {
      if (state.section === 'programme' && !state.editing) afficherSection();
    }, TICK_MS);
  }

  /* Les en-têtes de section collants doivent se poser SOUS le bandeau. Sa
     hauteur change avec la langue et la largeur : on la mesure au lieu de
     la deviner. */
  function mesurerBandeau() {
    const bar = $('#bar');
    if (!bar) return;
    document.documentElement.style.setProperty('--bar-h', `${Math.round(bar.offsetHeight)}px`);
  }

  function brancher() {
    mesurerBandeau();
    addEventListener('resize', mesurerBandeau);
    if (window.ResizeObserver && $('#bar')) new ResizeObserver(mesurerBandeau).observe($('#bar'));

    $('#gate-form').addEventListener('submit', (e) => {
      e.preventDefault();
      ouvrir($('#gate-password').value);
    });

    document.addEventListener('click', (e) => {
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

      /* Une puce n'est un filtre que si elle porte un filtre. Sans ce test,
         toute .chipbtn était avalée ici — c'est ce qui rendait muets les
         renvois « Voir aussi » du glossaire depuis leur création. */
      const epays = e.target.closest('[data-epays]');
      if (epays) { state.filters.entPays = epays.dataset.epays; afficherSection(); return; }

      if (e.target.closest('#map-go')) { allumerCarte(); return; }
      const fond = e.target.closest('[data-tuile]');
      if (fond) { changerFond(fond.dataset.tuile); return; }
      if (e.target.closest('#map-fit')) { poserReperes(); return; }

      /* Le filtre de la carte ne re-rend pas la section : recréer le
         conteneur détruirait la carte et le zoom en cours. */
      const ccat = e.target.closest('[data-ccat]');
      if (ccat) {
        state.filters.carteCat = ccat.dataset.ccat;
        document.querySelectorAll('[data-ccat]').forEach((b) =>
          b.setAttribute('aria-pressed', String(b.dataset.ccat === state.filters.carteCat)));
        const n = lieuxCartographies().filter((l) => !state.filters.carteCat || l.famille === state.filters.carteCat).length;
        const c = document.querySelector('.tools__c'); if (c) c.textContent = n;
        poserReperes();
        return;
      }

      const cat = e.target.closest('.chipbtn');
      if (cat && ('gcat' in cat.dataset || 'rcat' in cat.dataset || 'cat' in cat.dataset)) {
        if ('gcat' in cat.dataset) state.filters.glossaireCat = cat.dataset.gcat;
        else if ('rcat' in cat.dataset) state.filters.restaurantsCat = cat.dataset.rcat;
        else state.filters.marseilleCat = cat.dataset.cat;
        afficherSection();
        return;
      }

      const logo = e.target.closest('[data-logo]');
      if (logo) { choisirLogo(Number(logo.dataset.logo)); return; }
      const sansLogo = e.target.closest('[data-dellogo]');
      if (sansLogo) {
        ecrire(state.data, `entreprises.${sansLogo.dataset.dellogo}.logo`, '');
        marquerModifie(); afficherSection();
        return;
      }

      if (e.target.closest('#panel-close') || e.target.id === 'panel') { fermerPanneau(); return; }

      if (e.target.closest('#coche-reset')) {
        if (!confirm(ui('chk.resetAsk'))) return;
        localStorage.removeItem(CLE_PROGRESSION);
        afficherSection();
        return;
      }

      /* Un clic sur un lien ou un bouton DANS la carte garde sa fonction : le
         panneau ne s'ouvre que sur le reste de la surface. */
      const ouvrable = e.target.closest('[data-panel]');
      if (ouvrable && !e.target.closest('a, button:not([data-panel]), .ed')) {
        ouvrirPanneau(ouvrable.dataset.panel);
        return;
      }

      const ouvrirFiche = e.target.closest('[data-open]');
      if (ouvrirFiche) {
        const v = ouvrirFiche.dataset.open;
        state.detail = v === '' ? null : Number(v);
        afficherSection();
        window.scrollTo({ top: 0, behavior: 'instant' });
        return;
      }

      /* Ajout et suppression dans une sous-liste : fondateurs, rubriques. */
      const ajoutSub = e.target.closest('[data-addsub]');
      if (ajoutSub) {
        const chemin = ajoutSub.dataset.addsub;
        const liste = lire(state.data, chemin) || [];
        liste.push(chemin.endsWith('fondateurs')
          ? { nom: '', role: '' }
          : { titre: { fr: '', en: '' }, contenu: { fr: '', en: '' } });
        ecrire(state.data, chemin, liste);
        marquerModifie(); afficherSection();
        return;
      }
      const supprSub = e.target.closest('[data-delsub]');
      if (supprSub) {
        if (!confirm(ui('edit.removeAsk'))) return;
        const morceaux = supprSub.dataset.delsub.split('.');
        const index = Number(morceaux.pop());
        const liste = lire(state.data, morceaux.join('.'));
        if (Array.isArray(liste)) liste.splice(index, 1);
        marquerModifie(); afficherSection();
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
      if (cible) {
        fermerRecherche();
        aller(cible.dataset.goto);
        if ('fiche' in cible.dataset) { state.detail = Number(cible.dataset.fiche); afficherSection(); }
        return;
      }

      if (e.target.closest('#edit-toggle')) { basculerEdition(); return; }
      if (e.target.closest('#edit-json')) {
        telecharger('content.json', JSON.stringify(state.data, null, 2) + '\n', 'application/json');
        return;
      }
      if (e.target.closest('#edit-publish')) { publier(); return; }
      if (e.target.closest('#edit-cancel')) {
        if (!confirm(ui('edit.confirm'))) return;
        localStorage.removeItem(CLE_BROUILLON);
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

      if (e.target.closest('#edit-take')) {
        if (!confirm(ui('save.takeAsk'))) return;
        localStorage.removeItem(CLE_BROUILLON);
        location.reload();
        return;
      }

      if (e.target.closest('#lock')) {
        /* Verrouiller efface aussi le brouillon : c'est le geste à faire sur un
           poste partagé, et il est annoncé comme tel. */
        if (state.dirty && !confirm(ui('save.lockAsk'))) return;
        sessionStorage.removeItem(CLE_SESSION);
        localStorage.removeItem(CLE_BROUILLON);
        location.reload();
      }
    });

    document.addEventListener('change', (e) => {
      const c = e.target.closest('[data-coche]');
      if (!c) return;
      cocher(c.dataset.coche, c.checked);
      /* On met à jour sur place plutôt que de re-rendre la section : un
         re-rendu détruit les cases voisines et fait perdre le focus. */
      c.closest('.coche').classList.toggle('coche--ok', c.checked);
      majProgression();
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

      if (e.key === 'Escape' && state.panneau) { fermerPanneau(); return; }
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-panel]')) {
        e.preventDefault(); ouvrirPanneau(e.target.dataset.panel); return;
      }

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

    /* Plus de garde à la fermeture : tout est enregistré à chaque frappe, il
       n'y a plus rien à perdre — et la boîte de dialogue bloquait la
       navigation à chaque changement de page. */
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
