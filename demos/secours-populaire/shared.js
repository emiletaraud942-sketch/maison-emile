/* Secours populaire — démos Maison Émile : chrome commun aux 6 pages.
   Écrit en synchrone (document.write) pour rester à la même place dans le
   DOM qu'avant ce refactor, sans flash de contenu ni changement de rendu. */
(function (window, document) {
  "use strict";

  const LOGO_FALLBACK =
    "data:image/svg+xml;utf8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 64 64%27%3E%3Cpath d=%27M32 52C18 42 8 32 8 20c0-7 5-12 12-12 5 0 9 3 12 8 3-5 7-8 12-8 7 0 12 5 12 12 0 12-10 22-24 32z%27 fill=%27%23E2182F%27/%3E%3Cpath d=%27M32 52C22 44 14 36 10 27c3 2 7 3 11 3 7 0 11-5 11-11 0 6 4 11 11 11 4 0 8-1 11-3-4 9-12 17-22 25z%27 fill=%27%23000F9F%27/%3E%3C/svg%3E";

  const ANTENNE_EMAIL = "boutique.solidarite@secourspopulaire-exemple.org";
  const CAHIER_URL = `https://maison-emile.vercel.app/?projet=${encodeURIComponent("Boutique Solidarité — Secours populaire")}#cahier`;

  const PAGES = [
    { key: "index", href: "index.html", label: "Boutique solidaire" },
    { key: "admin", href: "admin.html", label: "Gestion du stock" },
    { key: "planning", href: "planning.html", label: "Planning & RDV" },
    { key: "familles", href: "familles.html", label: "Suivi des familles" },
    { key: "dons-matching", href: "dons-matching.html", label: "Dons ↔ Besoins" },
    { key: "benevoles-onboarding", href: "benevoles-onboarding.html", label: "Nouveaux bénévoles" }
  ];

  function ribbonHtml(context) {
    return `<div class="demo-ribbon"><div class="container">
      <span>Maquette de démonstration — <strong>préparée par Maison Émile</strong>, ${context}. Non en ligne officiellement.</span>
      <a href="mailto:emiletaraud942@gmail.com">En discuter avec Émile →</a>
    </div></div>`;
  }

  function suiteNavHtml(currentKey) {
    const links = PAGES.map((page) => {
      const currentAttr = page.key === currentKey ? ' class="current"' : "";
      return `<a href="${page.href}"${currentAttr}>${page.label}</a>`;
    }).join("");
    return `<div class="suite-nav"><div class="wrap">${links}</div></div>`;
  }

  function fabHtml({ title, body }) {
    return `<div class="pitch-fab">
      <b>${title}</b>${body}
      <br><a href="mailto:emiletaraud942@gmail.com">Écrire à Maison Émile</a>
    </div>`;
  }

  function cahierCtaHtml() {
    return `<section class="cahier-cta">
      <div class="wrap" style="margin:0 auto">
        <p class="chip">Et après ?</p>
        <h2>On continue d'en discuter ?</h2>
        <p>Cette maquette donne une direction — mais chaque antenne a ses propres contraintes (budget, équipe, données).
           Le cahier des charges guidé prend 5 minutes et m'aide à vous faire une proposition qui colle vraiment à votre réalité.</p>
        <a class="btn btn-primary" href="${CAHIER_URL}" target="_blank" rel="noopener">Remplir le cahier des charges guidé →</a>
      </div>
    </section>`;
  }

  window.SPFDemo = {
    ANTENNE_EMAIL,

    // Ribbon + suite-nav: called once, right at the top of <body>.
    chrome(config) {
      document.write(ribbonHtml(config.ribbonContext) + suiteNavHtml(config.current));
    },
    // Floating pitch bubble: called once, right before </body>.
    fab(config) {
      document.write(fabHtml(config));
    },
    // Banner mise en avant à la fin de la visite : called once, right after </main>.
    cahierCta() {
      document.write(cahierCtaHtml());
    },
    // Used as the onerror handler on the header logo <img>.
    logoFallback(img) {
      img.onerror = null;
      img.src = LOGO_FALLBACK;
    }
  };
})(window, document);
