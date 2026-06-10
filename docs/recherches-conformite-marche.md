# Recherches conformite et marche

## Sources consultees

- Service-Public, "Futur locataire d'un logement prive : justificatifs a donner au proprietaire" : https://www.service-public.gouv.fr/particuliers/vosdroits/F1169
- Legifrance, decret n° 2015-1437 du 5 novembre 2015 : https://www.legifrance.gouv.fr/loda/id/JORFTEXT000031444493/2021-01-06
- CNIL, "Profilage et decision entierement automatisee" : https://cnil.fr/fr/profilage-et-decision-entierement-automatisee
- CNIL, "Les six grands principes du RGPD" : https://cnil.fr/fr/comprendre-le-rgpd/les-six-grands-principes-du-rgpd
- CNIL, "Cookies et autres traceurs" : https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles
- Defenseur des droits, "Discriminations a la location de logement" : https://www.defenseurdesdroits.fr/discriminations-la-location-de-logement-338
- DossierFacile : https://www.dossierfacile.logement.gouv.fr/
- DossierFacile aide, securisation des donnees locataires : https://aide.dossierfacile.logement.gouv.fr/fr/article/conseils-pour-securiser-ses-donnees-locataires-1dyh1va/

## Regles importantes

- Service-Public rappelle qu'il existe une liste de justificatifs autorises et que le proprietaire ou son representant a interdiction d'en exiger d'autres.
- Le decret n° 2015-1437 fixe une liste limitative des pieces pouvant etre demandees au candidat et a sa caution.
- Pour le locataire, une seule piece d'identite et un seul justificatif de domicile sont exiges parmi les options autorisees.
- Les justificatifs professionnels et de ressources peuvent varier selon la situation, mais doivent rester dans la liste autorisee.
- La CNIL rappelle le principe de minimisation : collecter seulement ce qui est necessaire a la finalite.
- La CNIL encadre fortement les decisions entierement automatisees produisant des effets juridiques ou significatifs.
- Le Defenseur des droits rappelle l'interdiction de refuser un locataire en raison de criteres discriminatoires.
- DossierFacile met en avant la constitution d'un dossier clair, complet, securise et la protection des documents.

## Implications pour KASUS

- La configuration documentaire est dans `data/rental-documents.ts`.
- Les libelles parlent de pre-analyse, points a verifier, indicateur interne et decision humaine.
- Le portail candidat adapte la liste des pieces au profil mais ne porte aucun jugement sur les statuts.
- Les pages RGPD et legal affichent des placeholders a completer plutot que des informations inventees.
- Les uploads sont limites aux types attendus et aux tailles prevues.
- Le stockage documentaire devra etre prive, segmente par organisation et protege par RLS Supabase en production.

## Elements a eviter

- Tout libelle indiquant une acceptation, un refus, une decision par IA ou un indicateur definitif.
- Filtres ou indicateurs bases sur l'origine, le sexe, l'age, la nationalite, la sante, le handicap, la religion, les opinions, l'orientation sexuelle, la situation familiale ou tout critere discriminatoire.
- Demander plusieurs justificatifs de domicile obligatoires.
- Demander des pieces non autorisees ou "au cas ou".
- Affirmer une regle GLI universelle.
- Cookies ou traceurs non essentiels sans consentement.
- Logs contenant des donnees sensibles.

## Adaptations legales realisees

- Le "scoring" devient "indicateur dossier", "pre-analyse" ou "lecture financiere".
- Les seuils revenus/loyer sont presentes comme indicatifs et configurables.
- Les situations comme RSA, chomage, etudiant, retraite ou independant n'entrainent aucun refus automatique.
- La liste de pieces est configuree par categories autorisees et avec un groupe "oneOf" pour le domicile.
- Les ecrans candidat indiquent que l'agence pourra demander les elements manquants si necessaire.
- La page RGPD mentionne l'aide automatisee non decisionnelle.

## Points a faire valider humainement

- Liste exacte des pieces selon la version en vigueur du decret au moment de la mise en production.
- Base legale du traitement et modele d'information candidat.
- Durees de conservation par statut de dossier.
- Contrats de sous-traitance IA/OCR/PDF/stockage.
- Politique GLI par assureur si une integration est ajoutee.
- Pages legales, CGU, CGV et politique cookies.
- DPIA ou analyse d'impact si le traitement documentaire et la pre-analyse creent un risque eleve.
