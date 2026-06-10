# Audit interne KASUS

## Ce qui a ete compris

KASUS est la marque mere. Elle doit accueillir des modules professionnels pour l'immobilier, avec une interface premium, sobre, blanc casse, inspiree Apple, sans surcharge et sans contenu fictif trompeur.

Deux modules sont prevus :
- ELIGIA : organisation, traitement, verification, synthese et pre-analyse indicative de dossiers locatifs.
- STUDIO : creation d'annonces immobilieres professionnelles, affiche pour l'instant comme en cours de creation.

ELIGIA ne doit jamais accepter, refuser ou classer definitivement un candidat. Le produit assiste l'agence, le bailleur, la gestionnaire ou l'assureur GLI. La decision finale reste humaine.

## Pages a creer

- `/` : entree KASUS avec connexion et inscription.
- `/kasus` : accueil connecte avec les deux modules uniquement.
- `/eligia` : menu ELIGIA avec Mes dossiers et Creation d'un dossier.
- `/eligia/dossiers` : liste simple des dossiers.
- `/eligia/dossiers/demo-dossier` : detail agence d'un dossier.
- `/eligia/creation` : choix du parcours.
- `/eligia/creation/interne` : creation par l'agence avec upload.
- `/eligia/creation/lien` : generation d'un lien candidat.
- `/candidat/demo-link` : portail candidat question par question.
- `/studio` : page sobre en cours de creation.
- `/profil`, `/reglages`, `/rgpd`.
- `/legal/mentions-legales`, `/legal/confidentialite`, `/legal/cgu`, `/legal/cgv`, `/legal/cookies`.

## Fonctionnalites

- Navigation premium et minimale.
- Menu profil avec profil, reglages, RGPD, retour KASUS et deconnexion selon le contexte.
- Liste des dossiers sans statistiques CRM.
- Creation de dossier par upload avec validation MIME, taille et nettoyage de nom.
- Generation d'un lien candidat avec expiration par defaut de 10 jours.
- Portail candidat en questions courtes.
- Liste des pieces par categories : identite, domicile, situation professionnelle, ressources.
- Detail agence avec pieces manquantes, revenus detectes, ratios, alerte GLI et telechargement prevu.

## Regles metier

- Les seuils 3x locataire et 4x garant sont indicatifs, configurables et non legaux.
- Le statut professionnel sert a adapter les pieces, jamais a refuser.
- Un seul justificatif de domicile doit etre demande lorsque la reglementation l'impose.
- Les informations inconnues doivent laisser le candidat transmettre les justificatifs disponibles.
- La GLI depend du contrat applicable et ne doit pas etre presentee comme une regle universelle.

## Zones sensibles RGPD

- Pieces d'identite, revenus, avis fiscaux, justificatifs de domicile.
- Uploads et stockage documentaire.
- Liens candidats partageables.
- Pre-analyse financiere et eventuel profilage.
- Journalisation technique.
- Conservation et suppression des dossiers.

## Points legaux a respecter

- Ne demander que les pieces autorisees.
- Ne pas reclamer de somme avant signature du bail.
- Ne pas prendre de decision entierement automatisee.
- Ne pas utiliser de criteres discriminatoires.
- Informer clairement sur les finalites, droits, durees de conservation et usage d'aide automatisee.
- Faire valider les pages legales par un juriste avant production.

## Choix UX

- Ecrans courts et centres.
- Deux modules visibles seulement sur l'accueil KASUS.
- Deux choix seulement dans ELIGIA.
- Parcours candidat question par question.
- Badges prudents : pre-analyse, points a verifier, pieces manquantes.
- Pas de graphiques, pas de fausses statistiques, pas d'avis clients.

## Points non inventes

- Les informations legales d'entreprise sont des placeholders.
- L'authentification Supabase/Google est preparee conceptuellement mais non connectee sans variables d'environnement.
- Les traitements IA, OCR, PDF, ZIP et stockage prive sont mockes et isoles dans `lib/document-processing.ts`.
- Les dossiers affiches servent a verifier les interfaces et devront etre remplaces par des donnees persistantes.
