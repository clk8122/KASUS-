# ELIGIA - Dossier modele de comparaison documentaire

Objectif: aider l'analyse IA a comparer chaque piece recue avec un modele attendu. Une piece ne doit jamais etre validee uniquement par son nom de fichier. Elle doit contenir plusieurs marqueurs internes coherents et aucun marqueur incompatible.

## Regle generale

- Nom de fichier seul: indice faible.
- Contenu du document: preuve principale.
- Si une piece est ambigue, elle doit etre classee `autre` ou `illisible`.
- Une attestation annuelle de salaire, un cumul imposable ou un bulletin de paie ne remplace jamais un avis d'imposition.
- Une fiche de paie ne remplace jamais une quittance de loyer.
- Un avis d'imposition ne remplace pas un justificatif de domicile.

## Avis d'imposition

Marqueurs forts:
- Direction generale des Finances publiques, DGFiP ou impots.gouv.fr
- Avis d'impot / avis d'imposition / impot sur les revenus
- Numero fiscal
- Reference de l'avis
- Revenu fiscal de reference
- Nombre de parts
- Date de mise en recouvrement ou date limite de paiement

Marqueurs interdits:
- Attestation de salaire
- Certificat de salaire
- Bulletin de paie
- Cumul imposable
- Net imposable de fiche de paie

Sources:
- https://www.impots.gouv.fr/particulier/avis-dimpot-sur-le-revenu
- https://www.impots.gouv.fr/precisions-sur-le-service-de-verification-en-ligne

## Bulletin de salaire

Marqueurs forts:
- Bulletin de paie ou fiche de paie
- Nom/adresse de l'employeur
- SIRET, APE ou NAF
- Salarie
- Periode de paie
- Salaire brut
- Cotisations
- Net a payer
- Montant net social ou net imposable
- Mention de conservation du bulletin

Source:
- https://travail-emploi.gouv.fr/droit-du-travail/la-remuneration/article/le-bulletin-de-paie

## Contrat de travail / attestation employeur

Marqueurs forts:
- Contrat de travail, CDI, CDD, promesse d'embauche ou attestation employeur
- Identite employeur
- Identite salarie
- Poste ou emploi
- Date d'embauche / date d'effet
- Remuneration
- Duree du travail
- Signatures

Marqueurs interdits:
- Bulletin de paie seul
- Net a payer / cotisations comme preuve principale

Source:
- https://www.service-public.fr/particuliers/vosdroits/N19871

## Contrat d'apprentissage / alternance

Marqueurs forts:
- Contrat d'apprentissage
- Cerfa 10103
- Employeur
- Apprenti
- CFA ou organisme de formation
- Diplome ou titre prepare
- Maitre d'apprentissage
- Salaire par annee
- Dates de debut et de fin
- Signatures

Sources:
- https://www.service-public.fr/particuliers/vosdroits/F2918
- https://entreprendre.service-public.fr/vosdroits/R1319

## Quittance de loyer

Marqueurs forts:
- Quittance de loyer ou recu de loyer
- Bailleur
- Locataire
- Adresse du logement
- Periode concernee
- Loyer
- Charges
- Somme acquittee ou paiement recu

Marqueurs interdits:
- Bulletin de paie
- Salaire brut
- Net a payer
- Net imposable

Source:
- https://www.service-public.fr/particuliers/vosdroits/R54103

## Justificatif de domicile

Pieces possibles:
- Trois dernieres quittances de loyer
- Facture electricite, gaz, eau, telephone ou internet
- Attestation d'assurance habitation
- Dernier avis de taxe fonciere
- Titre de propriete
- Attestation d'hebergement accompagnee des pieces de l'hebergeur

Marqueurs forts facture:
- Fournisseur
- Titulaire
- Adresse de consommation
- Periode
- Montant
- Date recente

Sources:
- https://www.service-public.fr/particuliers/vosdroits/F1169
- https://www.service-public.fr/particuliers/vosdroits/F14807

## Attestation d'hebergement

Marqueurs forts:
- "Je soussigne"
- Identite de l'hebergeur
- Identite de la personne hebergee
- Adresse du domicile
- Date de debut d'hebergement
- Date et signature
- Piece d'identite de l'hebergeur
- Justificatif de domicile de l'hebergeur

Source:
- https://www.service-public.fr/simulateur/calcul/AttestationHebergement

## Taxe fonciere / titre de propriete

Taxe fonciere - marqueurs forts:
- Avis de taxe fonciere / taxes foncieres
- DGFiP ou impots.gouv.fr
- Numero fiscal ou reference de l'avis
- Proprietes baties / non baties
- Adresse du bien
- Montant a payer

Titre de propriete - marqueurs forts:
- Acte de propriete ou attestation notariale
- Notaire
- Proprietaire
- Adresse ou designation du bien
- Date de l'acte
- References cadastrales ou publication

Source:
- https://www.service-public.fr/particuliers/vosdroits/F1169

## Kbis

Marqueurs forts:
- Extrait Kbis
- Registre du commerce et des societes / RCS
- Greffe
- SIREN ou SIRET
- Denomination sociale
- Forme juridique
- Siege social
- Activite
- Dirigeant
- Date d'immatriculation

Sources:
- https://www.service-public.fr/particuliers/vosdroits/F1169
- https://support.monidenum.fr/hc/fr/articles/15957833187484-Que-contient-un-extrait-Kbis

## Bilan comptable

Marqueurs forts:
- Bilan
- Actif
- Passif
- Compte de resultat
- Exercice comptable
- Total bilan
- Chiffre d'affaires
- Resultat net
- Expert-comptable ou liasse fiscale

Source:
- https://www.service-public.fr/particuliers/vosdroits/F1169

## France Travail / chomage

Marqueurs forts:
- France Travail ou Pole emploi
- Attestation de paiement
- Demandeur d'emploi
- Identifiant demandeur
- Allocation / ARE
- Periode indemnisee
- Montant verse
- Date de paiement

Sources:
- https://www.francetravail.fr/faq/candidat/ma-recherche-demploi/laccompagnement-par-le-reseau-fr/lespace-personnel/attestation-france-travail.html
- https://www.francetravail.fr/candidat/vos-droits-et-demarches/vos-demarches-aupres-de-pole-emp/le-paiement-des-allocations.html

## RSA / prestations CAF-MSA

Marqueurs forts:
- CAF ou MSA
- RSA / revenu de solidarite active
- Allocataire
- Numero allocataire ou numero de dossier
- Attestation de paiement
- Periode
- Montant verse
- Montant net social si present

Sources:
- https://www.caf.fr/allocataires/caf-des-bouches-du-rhone/offre-de-service/vie-professionnelle/le-revenu-de-solidarite-active-rsa
- https://www.caf.fr/allocataires/caf-de-la-marne/offre-de-service/vie-personnelle/votre-dossier-et-vos-droits-en-libre-service

## Retraite

Marqueurs forts:
- Assurance retraite, Carsat, Agirc-Arrco ou caisse de retraite
- Releve de paiement
- Pension / retraite
- Beneficiaire
- Mensualites
- Montant verse
- Periode
- Attestation de prelevement a la source si fournie

Source:
- https://www.lassuranceretraite.fr/portail-info/hors-menu/annexe/services-en-ligne/demande-releve-paiement-retraite.html

## Etudiant / bourse

Carte etudiant ou certificat de scolarite:
- Etablissement
- Nom/prenom
- Annee universitaire
- Numero etudiant ou INE
- Formation

Avis de bourse:
- CROUS ou organisme payeur
- Avis ou notification d'attribution
- Etudiant
- Annee universitaire
- Echelon ou montant

Source:
- https://www.service-public.fr/particuliers/vosdroits/F1169
