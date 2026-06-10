# Deployment IONOS

KASUS est une application Next.js avec des routes API. Elle doit donc tourner sur un hebergement Node.js. Un hebergement web statique ou PHP seul ne suffit pas.

## Ce qu'il faut pour `kasus.fr`

- Un serveur IONOS compatible Node.js, typiquement un VPS ou un Cloud Server.
- L'acces SSH au serveur.
- L'acces DNS du domaine `kasus.fr` pour pointer le domaine vers l'IP du serveur.
- Les variables d'environnement de production.

## Variables de production

Minimum pour lancer l'application:

- `NEXT_PUBLIC_APP_URL=https://kasus.fr`
- `APP_URL=https://kasus.fr`
- `NEXT_PUBLIC_SUPABASE_URL=...`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
- `SUPABASE_SERVICE_ROLE_KEY=...`
- `OPENAI_API_KEY=...`
- `OPENAI_MODEL=gpt-4.1-mini`
- `STRIPE_SECRET_KEY=...`
- `NEXT_PUBLIC_STRIPE_PRICE_EXTRA_SEAT=...`

Si les ecritures Supabase ne sont pas encore branchees:

- `ENABLE_SUPABASE_API_WRITES=false`
- `KASUS_API_TOKEN` peut rester vide le temps de la mise au point.

## Build et demarrage

Le projet est configure avec `output: "standalone"` pour simplifier le deploiement.

Commande standard sur le serveur:

```bash
npm ci
npm run build
npm start
```

Le script `start` lance le serveur standalone genere par Next.js.

Alternative Docker:

```bash
docker build -t kasus .
docker run -d --restart unless-stopped -p 80:3000 -p 443:3000 --name kasus kasus
```

Si tu utilises Nginx en frontal, mappe plutot le conteneur sur un port local comme `3000` et laisse Nginx gerer TLS.

Si tu preferes un service systemd/PM2 sans Docker, la cible reste la meme: `npm ci`, `npm run build`, puis `npm start`.

## DNS

Pointer:

- `kasus.fr` vers l'IP publique du serveur.
- `www.kasus.fr` vers `kasus.fr` ou la meme IP.

Ensuite, brancher un reverse proxy HTTPS si tu utilises Nginx ou un autre frontal.

## Supabase

1. Creer un projet Supabase.
2. Ouvrir SQL Editor.
3. Executer `supabase/schema.sql`.
4. Recuperer:
   - l'URL du projet
   - la cle publishable/anon
   - la cle service role
5. Ajouter ces valeurs au fichier d'environnement du serveur.

Le schema cree:

- les tables metier
- les policies RLS de base
- le bucket prive `rental-documents`

## Verification apres mise en ligne

- Ouvrir `https://kasus.fr`.
- Verifier `/systeme`.
- Confirmer que Supabase, OpenAI et Stripe passent en configuration quand les secrets sont renseignes.

## Limite importante

Je ne peux pas pousser le code sur IONOS ni creer le projet Supabase sans tes acces. Si tu veux, je peux encore preparer le repository pour un depot SSH/Git exact et te donner la checklist d'execution cote serveur.
