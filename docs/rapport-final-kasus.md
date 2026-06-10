# Rapport final KASUS

## Fichiers crees

- Configuration projet : `package.json`, `tsconfig.json`, `next.config.mjs`, `eslint.config.mjs`, `next-env.d.ts`.
- UI globale : `app/globals.css`.
- Layout : `app/layout.tsx`, `components/layout/TopBar.tsx`, `components/layout/ProfileMenu.tsx`, `components/ui/ButtonLink.tsx`.
- Donnees et logique : `data/rental-documents.ts`, `lib/mock-data.ts`, `lib/document-processing.ts`, `lib/financial-analysis.ts`.
- Documentation : `docs/audit-kasus.md`, `docs/recherches-conformite-marche.md`, `docs/rapport-final-kasus.md`.

## Pages creees

- `/`
- `/kasus`
- `/eligia`
- `/eligia/dossiers`
- `/eligia/dossiers/demo-dossier`
- `/eligia/creation`
- `/eligia/creation/interne`
- `/eligia/creation/lien`
- `/candidat/demo-link`
- `/studio`
- `/profil`
- `/reglages`
- `/rgpd`
- `/legal/mentions-legales`
- `/legal/confidentialite`
- `/legal/cgu`
- `/legal/cgv`
- `/legal/cookies`

## Choix UX et design

- Interface blanc casse, cartes verre leger, typographie system-ui/SF Pro compatible.
- Accueil KASUS limite aux deux modules.
- ELIGIA limite a Mes dossiers et Creation d'un dossier.
- Parcours candidat question par question.
- Aucun graphique CRM, aucun faux avis, aucune promesse excessive.
- Focus visible, contrastes sobres, responsive mobile/tablette/desktop.

## Choix legaux

- Aucune decision automatique.
- Indicateurs presentes comme non decisionnels.
- Pieces configurees selon les categories autorisees.
- Un seul justificatif de domicile dans les groupes applicables.
- Pages legales avec placeholders uniquement.

## Sources consultees

Voir `docs/recherches-conformite-marche.md`.

## Adaptations realisees

- Remplacement du vocabulaire de scoring par pre-analyse/indicateur.
- Ajout de notices decision humaine.
- Ajout d'une alerte GLI prudente.
- Isolation des traitements IA/PDF/ZIP en mocks.

## Limites

- Authentification non connectee.
- Supabase non installe et schema non cree.
- Upload non envoye a un stockage prive.
- OCR, classification, fusion PDF, ZIP et notifications sont des stubs.
- Les donnees dossiers sont des exemples de demonstration UI.

## Variables d'environnement necessaires

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` cote serveur uniquement si necessaire.
- Variables fournisseur IA/OCR a ajouter cote serveur uniquement.

## Commandes lancees

- `npm install`
- `npm audit --audit-level=moderate`
- `npm audit fix --force`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npx -p playwright playwright screenshot --viewport-size=1440,1000 http://localhost:3000/kasus docs\kasus-desktop.png`
- `npx -p playwright playwright screenshot --viewport-size=390,844 http://localhost:3000/candidat/demo-link docs\candidat-mobile.png`
- Scan `rg` des formulations interdites.

## Erreurs corrigees

- Remplacement de `next lint`, non compatible Next 16, par `eslint .`.
- Passage en configuration plate ESLint 9 via `eslint.config.mjs`.
- Mise a jour Next/React/ESLint/TypeScript et override PostCSS pour obtenir `npm audit` a zero vulnerabilite.
- Ajustement du script `typecheck` avec `next typegen`.
- Correction d'un doublon visuel dans l'en-tete KASUS.
- Reformulation du rapport conformite pour ne pas reprendre les expressions interdites.

## Verification finale

- `npm run lint` : OK.
- `npm run typecheck` : OK.
- `npm run build` : OK.
- `npm audit --audit-level=moderate` : 0 vulnerabilite.
- Captures desktop et mobile generees dans `docs/`.
- Le navigateur integre Codex n'a pas pu demarrer a cause d'un echec sandbox du runtime ; verification realisee avec Playwright CLI.

## Points a valider humainement

- Mentions legales et documents contractuels.
- Registre RGPD et politique de conservation.
- Liste documentaire definitive par avocat/juriste.
- Architecture Supabase RLS.
- Choix des sous-traitants IA/OCR.
