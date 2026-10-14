# Maison Émile — site

Micro-entreprise de développement web (Émile Taraud, Rouen/Malaunay). Le site (`index.html`) est une page unique statique — HTML/CSS/JS vanilla, aucune dépendance, aucun build, déployée sur Vercel (`maison-emile.vercel.app`).

## Positionnement

L'offre principale est l'**automatisation/gestion** (stock, planning d'équipe, alertes, tableaux de bord) pour des structures avec une vraie complexité de gestion (entrepôts, logistique, distribution). Les **sites vitrines classiques restent proposés mais comme point d'entrée**, pas comme l'activité principale. Toute nouvelle copie doit respecter cette priorité, sauf instruction contraire explicite.

## Structure technique

- Un seul fichier `index.html` contenant 4 "pages" (accueil, CGV, mentions légales, politique de confidentialité), affichées/masquées en JS via `data-nav`.
- Brand strictement monochrome : `--black:#0c0b0a` / `--cream:#f4f1ea` (voir `:root` pour les autres tokens). Polices : Caveat (titres manuscrits), Cormorant Garamond (eyebrows/serif), Hanken Grotesk (texte courant).
- Pas de React/Tailwind/TypeScript/shadcn. Un composant fourni dans l'un de ces écosystèmes doit être **recréé en JS/CSS vanilla** (déjà fait pour l'effet "trou noir" du hero et le carrousel coverflow des Réalisations).

## Sous-agents du projet (`.claude/agents/`)

- **`code`** — implémente les changements sur `index.html`.
- **`qa`** — à utiliser après tout changement visuel/interactif, avant de considérer que c'est fini : sert le site en local et vérifie réellement le rendu (pas une relecture de diff).
- **`security-reviewer`** — à utiliser avant de merger un changement touchant le formulaire de devis, des liens/iframes externes, une insertion DOM via `innerHTML`, ou les pages légales (CGV/mentions légales/confidentialité) — vérifie XSS, secrets, cohérence juridique.

Flux recommandé pour un changement non trivial : `code` implémente → `qa` vérifie le rendu → `security-reviewer` relit si le changement touche formulaire/liens/pages légales → l'utilisateur valide avant merge.

## Git

Chaque changement part sur une branche, est poussé, puis une Pull Request est ouverte vers `main`. **Ne jamais merger sans que l'utilisateur l'ait explicitement demandé** — même après avoir ouvert la PR, attendre sa confirmation.
