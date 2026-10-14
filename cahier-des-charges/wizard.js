/* Cahier des charges interactif — moteur partagé (questions + logique + envoi) */
(function () {
  var CFG = window.CAHIER_CONFIG || {};
  var EMAILJS_SERVICE_ID = CFG.serviceId || 'YOUR_SERVICE_ID';
  var EMAILJS_TEMPLATE_ID = CFG.templateId || 'YOUR_TEMPLATE_ID';
  var EMAILJS_PUBLIC_KEY = CFG.publicKey || 'YOUR_PUBLIC_KEY';
  var DEST_EMAIL = CFG.destinataireEmail || 'emiletaraud942@gmail.com';
  var PROJET_DEFAUT = CFG.projetDefaut || '';

  function emailjsReady() {
    return !!(window.emailjs
      && EMAILJS_SERVICE_ID !== 'YOUR_SERVICE_ID'
      && EMAILJS_TEMPLATE_ID !== 'YOUR_TEMPLATE_ID'
      && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY');
  }
  if (window.emailjs && emailjsReady()) {
    try { window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY }); } catch (e) {}
  }

  var params = new URLSearchParams(window.location.search);
  var projetParam = params.get('projet') || PROJET_DEFAUT;

  // ---------- Questions ----------
  // type: 'choice' (boutons) ou 'contact' (champs finaux)
  var STEPS = [
    { id: 'equipe_type', cat: 1, catLabel: 'Équipe & organisation', q: "Avez-vous une équipe ou des bénévoles à organiser au quotidien ?",
      options: ["Oui, des salariés", "Oui, des bénévoles", "Oui, les deux", "Non, pas de gestion d'équipe"] },
    { id: 'equipe_nb', cat: 1, catLabel: 'Équipe & organisation', q: "Combien de personnes à gérer, environ ?",
      options: ["1 à 5", "6 à 20", "21 à 50", "Plus de 50"],
      skipIf: function (a) { return a.equipe_type === "Non, pas de gestion d'équipe"; } },
    { id: 'equipe_sites', cat: 1, catLabel: 'Équipe & organisation', q: "Un seul site ou plusieurs ?",
      options: ["Un seul site", "Plusieurs sites ou boutiques"],
      skipIf: function (a) { return a.equipe_type === "Non, pas de gestion d'équipe"; } },
    { id: 'equipe_planning', cat: 1, catLabel: 'Équipe & organisation', q: "Comment gérez-vous les plannings aujourd'hui ?",
      options: ["Papier", "Excel / Sheets", "Un logiciel déjà en place", "Rien de formalisé"],
      skipIf: function (a) { return a.equipe_type === "Non, pas de gestion d'équipe"; } },

    { id: 'materiel_terrain', cat: 2, catLabel: 'Matériel & environnement', q: "Votre équipe dispose-t-elle d'un appareil connecté sur le terrain (tablette, téléphone, ordinateur) ?",
      options: ["Oui, un par personne ou par site", "Oui, partagé", "Non, aucun équipement dédié", "Je ne sais pas encore"] },
    { id: 'materiel_connexion', cat: 2, catLabel: 'Matériel & environnement', q: "Une connexion internet fiable est-elle disponible sur chaque site ?",
      options: ["Oui partout", "Variable", "Non", "Je ne sais pas"] },

    { id: 'activite_temps', cat: 3, catLabel: 'Activité à outiller', q: "Qu'est-ce qui occupe le plus de temps administratif aujourd'hui ?",
      options: ["Suivi de stock / matériel", "Suivi de dossiers, bénéficiaires, clients", "Prise de rendez-vous", "Autre chose"] },
    { id: 'activite_suivi', cat: 3, catLabel: 'Activité à outiller', q: "Comment faites-vous ce suivi aujourd'hui ?",
      options: ["Cahier papier", "Tableur", "Logiciel existant", "Rien de formalisé"] },

    { id: 'finances_besoin', cat: 4, catLabel: 'Finances & facturation', q: "Avez-vous besoin de devis, factures ou suivi de frais dans l'outil ?",
      options: ["Oui", "Non", "Je ne sais pas encore"] },
    { id: 'finances_droits', cat: 4, catLabel: 'Finances & facturation', q: "Qui doit pouvoir les créer ou valider ?",
      options: ["Une seule personne", "Plusieurs avec droits différents"],
      skipIf: function (a) { return a.finances_besoin !== "Oui"; } },

    { id: 'communication_avec', cat: 5, catLabel: 'Communication', q: "Avec qui communiquez-vous le plus dans le cadre de cette activité ?",
      options: ["Clients", "Familles ou proches", "Bénévoles ou salariés", "Fournisseurs ou partenaires"] },
    { id: 'communication_moyen', cat: 5, catLabel: 'Communication', q: "Par quel moyen aujourd'hui ?",
      options: ["Téléphone", "Email", "SMS", "En personne uniquement"] },

    { id: 'donnees_sensibles', cat: 6, catLabel: 'Données & accès', q: "Votre activité implique-t-elle des données sensibles (santé, mineurs, situation financière) ?",
      options: ["Oui", "Non", "Je ne sais pas"] },
    { id: 'donnees_acces', cat: 6, catLabel: 'Données & accès', q: "Qui doit avoir accès à ces données ?",
      options: ["Direction uniquement", "Toute l'équipe", "Selon le rôle de chacun"],
      skipIf: function (a) { return a.donnees_sensibles !== "Oui"; } },

    { id: 'budget_determine', cat: 7, catLabel: 'Contraintes & priorités', q: "Votre budget est-il déjà déterminé ?",
      options: ["Oui, montant fixe", "Oui, fourchette", "Pas encore, à définir ensemble"] },

    { id: 'contact', cat: 8, catLabel: 'Vos coordonnées', type: 'contact' }
  ];

  var TOTAL_CATS = 8;
  var answers = {};
  var history = []; // indices réellement affichés

  var root = document.getElementById('cdcWizard');
  if (!root) return;
  root.innerHTML =
    '<div class="cdc-progress"><div class="cdc-progress-bar" id="cdcProgressBar"></div></div>' +
    '<div class="cdc-top-row">' +
      '<button type="button" class="cdc-back" id="cdcBack">← Retour</button>' +
      '<span class="cdc-stage" id="cdcStageLabel"></span>' +
    '</div>' +
    '<div class="cdc-step-mount" id="cdcMount"></div>' +
    '<div class="cdc-done" id="cdcDone" hidden>' +
      '<div class="cdc-done-icon">✓</div>' +
      '<h3>Merci, c\'est envoyé.</h3>' +
      '<p>On revient vers vous avec une proposition sur mesure.</p>' +
    '</div>';

  var mount = document.getElementById('cdcMount');
  var backBtn = document.getElementById('cdcBack');
  var stageLabel = document.getElementById('cdcStageLabel');
  var progressBar = document.getElementById('cdcProgressBar');
  var doneEl = document.getElementById('cdcDone');

  function shouldSkip(step) {
    return typeof step.skipIf === 'function' && step.skipIf(answers);
  }

  function findNextIndex(fromIndex) {
    var i = fromIndex + 1;
    while (i < STEPS.length && shouldSkip(STEPS[i])) i++;
    return i;
  }

  function updateProgress(step) {
    stageLabel.textContent = step.type === 'contact'
      ? 'Dernière étape'
      : 'Catégorie ' + step.cat + ' / 7 — ' + step.catLabel;
    var pct = Math.min(100, Math.round((step.cat / TOTAL_CATS) * 100));
    progressBar.style.width = pct + '%';
  }

  function renderChoice(step) {
    var wrap = document.createElement('div');
    wrap.className = 'cdc-step';
    var h = document.createElement('h3');
    h.className = 'cdc-q';
    h.textContent = step.q;
    wrap.appendChild(h);
    var opts = document.createElement('div');
    opts.className = 'cdc-options';
    step.options.forEach(function (label) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'cdc-option';
      b.textContent = label;
      b.addEventListener('click', function () {
        answers[step.id] = label;
        goNext();
      });
      opts.appendChild(b);
    });
    wrap.appendChild(opts);
    return wrap;
  }

  function renderContact(step) {
    var wrap = document.createElement('div');
    wrap.className = 'cdc-step';
    wrap.innerHTML =
      '<h3 class="cdc-q">Pour finir, vos coordonnées</h3>' +
      '<form id="cdcContactForm" class="cdc-contact-form">' +
        '<div class="cdc-contact-grid">' +
          '<div class="cdc-field"><label for="cdcNom">Votre nom</label><input id="cdcNom" name="nom" type="text" required></div>' +
          '<div class="cdc-field"><label for="cdcEmail">Email</label><input id="cdcEmail" name="email" type="email" required></div>' +
          '<div class="cdc-field"><label for="cdcTel">Téléphone (facultatif)</label><input id="cdcTel" name="telephone" type="tel"></div>' +
          '<div class="cdc-field"><label for="cdcStructure">Structure / projet</label><input id="cdcStructure" name="structure" type="text" value="' +
            (projetParam ? projetParam.replace(/"/g, '&quot;') : '') + '"></div>' +
        '</div>' +
        '<div class="cdc-field cdc-field-wide"><label for="cdcMessage">Autre chose à préciser (facultatif)</label>' +
          '<textarea id="cdcMessage" name="message" rows="3"></textarea></div>' +
        '<button type="submit" class="cdc-submit">Envoyer à Maison Émile</button>' +
        '<p class="cdc-note" id="cdcSendNote"></p>' +
      '</form>';
    return wrap;
  }

  function showStep(index) {
    var step = STEPS[index];
    updateProgress(step);
    mount.innerHTML = '';
    mount.appendChild(step.type === 'contact' ? renderContact(step) : renderChoice(step));
    backBtn.style.visibility = history.length > 1 ? 'visible' : 'hidden';
    if (step.type === 'contact') {
      var form = document.getElementById('cdcContactForm');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        handleSubmit(form);
      });
    }
  }

  function goNext() {
    var current = history[history.length - 1];
    var next = findNextIndex(current);
    if (next >= STEPS.length) return;
    history.push(next);
    showStep(next);
  }

  function goBack() {
    if (history.length <= 1) return;
    history.pop();
    showStep(history[history.length - 1]);
  }

  backBtn.addEventListener('click', goBack);

  function formatRecap(contact) {
    var lignes = [];
    STEPS.forEach(function (step) {
      if (step.type === 'contact') return;
      if (answers[step.id] === undefined) return;
      lignes.push(step.q);
      lignes.push('→ ' + answers[step.id]);
      lignes.push('');
    });
    lignes.push('Structure / projet : ' + (contact.structure || '—'));
    lignes.push('Message complémentaire : ' + (contact.message || '—'));
    return lignes.join('\n');
  }

  function handleSubmit(form) {
    var contact = {
      nom: form.nom.value,
      email: form.email.value,
      telephone: form.telephone.value,
      structure: form.structure.value,
      message: form.message.value
    };
    var recap = formatRecap(contact);
    var note = document.getElementById('cdcSendNote');

    if (emailjsReady()) {
      note.textContent = 'Envoi en cours…';
      window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        to_email: DEST_EMAIL,
        from_name: contact.nom,
        from_email: contact.email,
        from_phone: contact.telephone || '—',
        projet: contact.structure || '—',
        message: recap
      }).then(function () {
        mount.hidden = true;
        document.querySelector('.cdc-progress').hidden = true;
        document.querySelector('.cdc-top-row').hidden = true;
        doneEl.hidden = false;
      }).catch(function (err) {
        note.textContent = "L'envoi a échoué, ouverture de votre messagerie à la place.";
        fallbackMailto(contact, recap);
      });
    } else {
      fallbackMailto(contact, recap);
    }
  }

  function fallbackMailto(contact, recap) {
    var sujet = encodeURIComponent('Cahier des charges — ' + (contact.structure || contact.nom));
    var corpsLignes = [
      'Nom : ' + contact.nom,
      'Email : ' + contact.email,
      'Téléphone : ' + (contact.telephone || '—'),
      'Structure / projet : ' + (contact.structure || '—'),
      '',
      recap
    ];
    var corps = encodeURIComponent(corpsLignes.join('\n'));
    window.location.href = 'mailto:' + DEST_EMAIL + '?subject=' + sujet + '&body=' + corps;
  }

  history.push(0);
  showStep(0);
})();
