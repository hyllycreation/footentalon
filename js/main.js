(function () {
  "use strict";

  document.getElementById('yr').textContent = new Date().getFullYear();

  /* ---- ENDPOINT n8n : colle ici l'URL de ton webhook quand prêt ---- */
  var N8N_WEBHOOK_URL = "https://n8n.srv1031704.hstgr.cloud/webhook/lead-stades";

  var form = document.getElementById('leadForm');
  var emailInput = document.getElementById('email');
  var emailErr = document.getElementById('emailErr');
  var formErr = document.getElementById('formErr');
  var catBlock = document.getElementById('catBlock');
  var catLabel = document.getElementById('catLabel');
  var profilSeg = document.getElementById('profilSeg');
  var formView = document.getElementById('formView');
  var successView = document.getElementById('successView');
  var submitBtn = form.querySelector('.submit');

  /* ---- Sélection profil : style actif + affichage conditionnel catégorie ---- */
  var opts = profilSeg.querySelectorAll('.opt');
  opts.forEach(function (opt) {
    opt.addEventListener('click', function () {
      opts.forEach(function (o) { o.classList.remove('is-on'); });
      opt.classList.add('is-on');
      var val = opt.getAttribute('data-val');
      var input = opt.querySelector('input');
      input.checked = true;

      if (val === 'joueur' || val === 'parent') {
        catLabel.textContent = (val === 'parent')
          ? "Catégorie de ton enfant"
          : "Ta catégorie d'âge";
        catBlock.classList.add('show');
      } else {
        catBlock.classList.remove('show');
        // reset catégorie
        var sel = document.getElementById('categorie');
        if (sel) { sel.value = ""; }
      }
    });
  });

  /* ---- Validation email ---- */
  function validEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
  }
  emailInput.addEventListener('input', function () {
    if (validEmail(emailInput.value)) {
      emailInput.classList.remove('invalid');
      emailErr.classList.remove('show');
    }
  });

  /* ---- Submit ---- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!validEmail(emailInput.value)) {
      emailInput.classList.add('invalid');
      emailErr.classList.add('show');
      emailInput.focus();
      return;
    }

    var profilEl = form.querySelector('input[name="profil"]:checked');
    var catEl = document.getElementById('categorie');

    var payload = {
      email: emailInput.value.trim(),
      profil: profilEl ? profilEl.value : null,
      categorie: (catEl && catEl.value) ? catEl.value : null,
      source: "landing-50-secrets-stades",
      submitted_at: new Date().toISOString()
    };

    var defaultLabel = submitBtn.childNodes[0] ? submitBtn.childNodes[0].nodeValue : null;

    function setLoading(on) {
      submitBtn.disabled = on;
      submitBtn.style.opacity = on ? ".7" : "";
      if (submitBtn.childNodes[0]) {
        submitBtn.childNodes[0].nodeValue = on ? " Envoi… " : defaultLabel;
      }
    }

    function showSuccess() {
      formView.style.display = "none";
      successView.classList.add('show');
      window.scrollTo({ top: successView.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
    }

    function showError() {
      // L'envoi a réellement échoué : on garde le formulaire visible et on prévient l'utilisateur.
      setLoading(false);
      formErr.classList.add('show');
    }

    formErr.classList.remove('show');

    if (!N8N_WEBHOOK_URL) {
      console.warn("LEAD non envoyé : N8N_WEBHOOK_URL n'est pas configuré →", payload);
      showError();
      return;
    }

    setLoading(true);

    fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        // On attend la réponse du workflow : un statut HTTP non-2xx est traité comme une erreur.
        if (!res.ok) {
          throw new Error("Réponse n8n non OK : " + res.status);
        }
        showSuccess();
      })
      .catch(function (err) {
        // Erreur réseau ou statut non-2xx : on n'affiche PAS le succès.
        console.error("Échec de l'envoi du lead :", err);
        showError();
      });
  });
})();
