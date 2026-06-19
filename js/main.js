(function () {
  "use strict";

  document.getElementById('yr').textContent = new Date().getFullYear();

  /* ---- ENDPOINT n8n : colle ici l'URL de ton webhook quand prêt ---- */
  var N8N_WEBHOOK_URL = "https://n8n.srv1031704.hstgr.cloud/webhook/lead-stades";
  var PDF_URL = "#"; // ex: lien direct vers le PDF si tu veux un fallback de téléchargement

  var form = document.getElementById('leadForm');
  var emailInput = document.getElementById('email');
  var emailErr = document.getElementById('emailErr');
  var catBlock = document.getElementById('catBlock');
  var catLabel = document.getElementById('catLabel');
  var profilSeg = document.getElementById('profilSeg');
  var formView = document.getElementById('formView');
  var successView = document.getElementById('successView');
  var dlBtn = document.getElementById('dlBtn');
  var submitBtn = form.querySelector('.submit');

  if (PDF_URL && PDF_URL !== "#") dlBtn.setAttribute('href', PDF_URL);

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

    submitBtn.disabled = true;
    submitBtn.style.opacity = ".7";
    submitBtn.firstChild && (submitBtn.childNodes[0].nodeValue = " Envoi… ");

    function showSuccess() {
      formView.style.display = "none";
      successView.classList.add('show');
      window.scrollTo({ top: successView.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
    }

    if (N8N_WEBHOOK_URL) {
      fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function () { showSuccess(); })
        .catch(function () {
          // En cas d'échec réseau on affiche quand même le succès pour ne pas perdre le lead côté UX,
          // (à ajuster selon ta logique n8n / retry).
          showSuccess();
        });
    } else {
      // Pas encore branché à n8n : on logge et on montre le succès.
      console.log("LEAD (n8n non branché) →", payload);
      setTimeout(showSuccess, 350);
    }
  });
})();
