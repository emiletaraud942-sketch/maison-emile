/* Secours populaire — démos Maison Émile : chrome commun aux 6 pages.
   Écrit en synchrone (document.write) pour rester à la même place dans le
   DOM qu'avant ce refactor, sans flash de contenu ni changement de rendu. */
(function (window, document) {
  "use strict";

  var LOGO_FALLBACK =
    "data:image/svg+xml;utf8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 64 64%27%3E%3Cpath d=%27M32 52C18 42 8 32 8 20c0-7 5-12 12-12 5 0 9 3 12 8 3-5 7-8 12-8 7 0 12 5 12 12 0 12-10 22-24 32z%27 fill=%27%23E2182F%27/%3E%3Cpath d=%27M32 52C22 44 14 36 10 27c3 2 7 3 11 3 7 0 11-5 11-11 0 6 4 11 11 11 4 0 8-1 11-3-4 9-12 17-22 25z%27 fill=%27%23000F9F%27/%3E%3C/svg%3E";

  var PAGES = [
    { key: "index", href: "index.html", label: "Boutique solidaire" },
    { key: "admin", href: "admin.html", label: "Gestion du stock" },
    { key: "planning", href: "planning.html", label: "Planning & RDV" },
    { key: "familles", href: "familles.html", label: "Suivi des familles" },
    { key: "dons-matching", href: "dons-matching.html", label: "Dons ↔ Besoins" },
    { key: "benevoles-onboarding", href: "benevoles-onboarding.html", label: "Nouveaux bénévoles" }
  ];

  function ribbonHtml(context) {
    return (
      '<div class="demo-ribbon"><div class="container">' +
      "<span>Maquette de démonstration — <strong>préparée par Maison Émile</strong>, " +
      context +
      ". Non en ligne officiellement.</span>" +
      '<a href="mailto:emiletaraud942@gmail.com">En discuter avec Émile →</a>' +
      "</div></div>"
    );
  }

  function suiteNavHtml(currentKey) {
    var links = PAGES.map(function (p) {
      return (
        '<a href="' + p.href + '"' + (p.key === currentKey ? ' class="current"' : "") + ">" + p.label + "</a>"
      );
    }).join("");
    return '<div class="suite-nav"><div class="wrap">' + links + "</div></div>";
  }

  function fabHtml(fab) {
    return (
      '<div class="pitch-fab"><b>' +
      fab.title +
      "</b>" +
      fab.body +
      '<br><a href="mailto:emiletaraud942@gmail.com">Écrire à Maison Émile</a></div>'
    );
  }

  window.SPFDemo = {
    // Ribbon + suite-nav: called once, right at the top of <body>.
    chrome: function (config) {
      document.write(ribbonHtml(config.ribbonContext) + suiteNavHtml(config.current));
    },
    // Floating pitch bubble: called once, right before </body>.
    fab: function (config) {
      document.write(fabHtml(config));
    },
    // Used as the onerror handler on the header logo <img>.
    logoFallback: function (img) {
      img.onerror = null;
      img.src = LOGO_FALLBACK;
    }
  };
})(window, document);
