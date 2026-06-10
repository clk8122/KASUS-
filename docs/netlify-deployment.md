# Deployment Netlify

KASUS peut etre heberge sur Netlify sans changer le domaine chez IONOS.

## Principe

- Le code est deploye sur Netlify depuis un depot Git.
- Netlify gere le build Next.js, les routes API et le HTTPS.
- IONOS reste seulement le gestionnaire DNS de `kasus.fr`.

## Ce qui est deja prepare dans le repo

- `netlify.toml`
- `output: "standalone"` dans `next.config.mjs`
- `start` de production dans `package.json`
- variables de base de production dans `.env.production.example`

## Variables a renseigner dans Netlify

Dans `Site settings` > `Environment variables`, ajouter:

- `NEXT_PUBLIC_APP_URL=https://kasus.fr`
- `APP_URL=https://kasus.fr`
- `NEXT_PUBLIC_SUPABASE_URL=https://tubywxeqgykfmsrouito.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
- `SUPABASE_SERVICE_ROLE_KEY=...`
- `ENABLE_SUPABASE_API_WRITES=false` au depart
- `OPENAI_API_KEY=...`
- `OPENAI_MODEL=gpt-4.1-mini`
- `STRIPE_SECRET_KEY=...`
- `NEXT_PUBLIC_STRIPE_PRICE_EXTRA_SEAT=...`

## Etapes Netlify

1. Connecter le depot Git du projet.
2. Laisser Netlify detecter Next.js.
3. Deploy.
4. Ajouter le domaine `kasus.fr` dans `Domain management`.
5. Lire les DNS demandes par Netlify.

## Etapes IONOS

Dans la zone DNS IONOS, creer les enregistrements demandes par Netlify:

- un enregistrement pour `www.kasus.fr`
- un enregistrement pour `kasus.fr`

Utilise exactement les valeurs indiquees par Netlify dans le panneau de domaine, car elles peuvent varier selon la configuration choisie.

## Verification

- `https://kasus.fr`
- `https://www.kasus.fr`
- `/systeme`

Le statut doit passer au vert lorsque les variables sont presentes.
