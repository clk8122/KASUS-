# Production setup

Stack choisie:

- Supabase Free: Auth, Postgres, Storage prive.
- Stripe test mode: facturation des seats supplementaires, sans frais fixes.
- OpenAI Responses API: analyse IA des dossiers.

## Supabase

1. Creer un projet Supabase gratuit.
2. Ouvrir SQL Editor et executer `supabase/schema.sql`.
3. Copier dans `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

Le bucket prive `rental-documents` est cree par le schema.

## Stripe

1. Activer le mode test Stripe.
2. Creer un produit "Seat supplementaire".
3. Creer un prix mensuel, par exemple 19 EUR / mois.
4. Copier dans `.env.local`:
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PRICE_EXTRA_SEAT`

## Verification

Ouvrir `/systeme`.

Les cartes doivent passer en `Configure` quand les variables sont presentes.
