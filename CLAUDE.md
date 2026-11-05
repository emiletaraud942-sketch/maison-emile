# Maison Émile — site

Micro-entreprise de développement web (Émile Taraud, Rouen/Malaunay). Le site (`index.html`) est une page unique statique — HTML/CSS/JS vanilla, aucune dépendance, aucun build, déployée sur Vercel (`maison-emile.vercel.app`).

## Positionnement

L'offre principale est l'**automatisation/gestion** (stock, planning d'équipe, alertes, tableaux de bord) pour des structures avec une vraie complexité de gestion (entrepôts, logistique, distribution). Les **sites vitrines classiques restent proposés mais comme point d'entrée**, pas comme l'activité principale. Toute nouvelle copie doit respecter cette priorité, sauf instruction contraire explicite.

## Structure technique

- Un seul fichier `index.html` contenant 4 "pages" (accueil, CGV, mentions légales, politique de confidentialité), affichées/masquées en JS via `data-nav`.
- Brand strictement monochrome : `--black:#0c0b0a` / `--cream:#f4f1ea` (voir `:root` pour les autres tokens). Polices : Caveat (titres manuscrits), Cormorant Garamond (eyebrows/serif), Hanken Grotesk (texte courant).
- Pas de React/Tailwind/TypeScript/shadcn. Un composant fourni dans l'un de ces écosystèmes doit être **recréé en JS/CSS vanilla** (déjà fait pour l'effet "trou noir" du hero et le carrousel coverflow des Réalisations).

## Ce repo sert aussi de hub pour des démos prospects

Au-delà du site vitrine, ce repo accueille régulièrement des **démos construites pour des prospects/clients sur des branches dédiées** (ex. Secours Populaire, Union B brasserie). Quand une tâche porte sur une de ces démos, le projet concerné est celui de ce client-là, pas Maison Émile — voir les agents `rh`/`compta`/`marketing` ci-dessous.

## Sous-agents du projet (`.claude/agents/`)

- **`code`** — implémente les changements sur `index.html`.
- **`qa`** — à utiliser après tout changement visuel/interactif, avant de considérer que c'est fini : sert le site en local et vérifie réellement le rendu (pas une relecture de diff).
- **`security-reviewer`** — à utiliser avant de merger un changement touchant le formulaire de devis, des liens/iframes externes, une insertion DOM via `innerHTML`, les pages légales (CGV/mentions légales/confidentialité), ou la config de déploiement — vérifie XSS, secrets, cohérence juridique, et audite aussi périodiquement la posture sécurité globale (en-têtes HTTP via `vercel.json`, actuellement absent, exposition de données, ressources externes non épinglées).
- **`rh`**, **`compta`**, **`marketing`** — agents métier consultés quand une démo/un projet client dans ce repo touche à la gestion d'équipe, à la facturation/devis, ou au contenu marketing **du client concerné** (jamais de Maison Émile elle-même, qui n'a ni salariés ni comptabilité gérée ici). Ils conseillent et rédigent, ne remplacent jamais un vrai comptable/juriste/RH pour une question à conséquence légale réelle.
- **`prospection`** — à part des trois précédents : celui-ci travaille **pour Maison Émile elle-même**, pas pour un client. Aide à cibler des segments de prospects (salons, garages, artisans, associations en Normandie/Rouen), qualifier des leads à partir de sources publiques, rédiger des premiers messages et relances, préparer un pitch de démo et un script d'appel/visite, et tenir le pipeline. Ne contacte, n'appelle ni ne réserve jamais rien lui-même : pour un email il peut déposer un **brouillon Gmail** (jamais un envoi direct) qu'Émile relit et envoie d'un clic ; pour les autres canaux (SMS, LinkedIn), il livre un texte qu'Émile envoie manuellement.
- **Studio TikTok** (pour Maison Émile elle-même, comme `prospection`) — chaîne en 4 agents :
  - **`tiktok-strategie`** — ligne éditoriale, piliers, calendrier (`tiktok/calendrier.md`), idées classées, veille, bilan des stats qu'Émile colle.
  - **`tiktok-script`** — script (hook, texte à l'écran, légende, hashtags) + brief JSON `tiktok/briefs/<slug>.json`.
  - **`video`** — rend la vidéo 1080×1920 avec `node tiktok/make-video.mjs tiktok/briefs/<slug>.json` (Playwright + ffmpeg), puis la contrôle image par image. Sortie dans `tiktok/out/<slug>/` (non versionné).
  - **`tiktok-publication`** — prépare `PUBLIER.md` (légende, hashtags, créneau, checklist conformité). **Ne publie jamais** : Émile poste lui-même depuis son téléphone. Aucun client ni démo montré sans accord écrit.

Flux TikTok : `tiktok-strategie` → `tiktok-script` → `video` → `tiktok-publication` → Émile publie.

## Cockpit des agents (`ops/`)

Interface en direct de tous les agents : `node ops/cockpit.mjs` puis http://localhost:4949. Les hooks de `.claude/settings.json` appellent `.claude/hooks/ops-event.mjs`, qui écrit chaque prompt / délégation / appel d'outil dans `.claude/ops/events.jsonl` (local, non versionné) ; le cockpit le diffuse en temps réel. Le hook ne doit jamais bloquer ni écrire sur la sortie. `ops/`, `tiktok/` et `.claude/` sont exclus du déploiement Vercel (`.vercelignore`).

Flux recommandé pour un changement non trivial : `code` implémente → `qa` vérifie le rendu → `security-reviewer` relit si le changement touche formulaire/liens/pages légales → `rh`/`compta`/`marketing` apportent leur avis métier si la démo en a besoin → l'utilisateur valide avant merge.

## Git

Chaque changement part sur une branche, est poussé, puis une Pull Request est ouverte vers `main`. **Ne jamais merger sans que l'utilisateur l'ait explicitement demandé** — même après avoir ouvert la PR, attendre sa confirmation.
