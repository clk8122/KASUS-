$BaseUrl = "http://localhost:3000/api/eligia/analyze-documents"
$Root = Join-Path $env:TEMP ("eligia-api-tests-" + [guid]::NewGuid())
New-Item -ItemType Directory -Path $Root | Out-Null

function Get-FakeDocumentContent {
  param([string] $FileName)

  if ($FileName -match "avis_imposition") {
    return @"
Direction generale des Finances publiques - impots.gouv.fr
Avis d'impot sur les revenus 2025
Numero fiscal : 1234567890123
Reference de l'avis : 25 54 1234567 90
Revenu fiscal de reference : 30000 euros
Nombre de parts : 1
Impot sur les revenus soumis au bareme
Date de mise en recouvrement : 31/07/2025
"@
  }

  if ($FileName -match "attestation_salaire") {
    return @"
Attestation annuelle de salaire
Employeur : Societe Exemple
Salarie : Camille Martin
Net imposable annuel : 32000 euros
Cumul imposable issu des bulletins de paie
Ce document est une attestation de salaire et ne constitue pas un avis d'imposition.
"@
  }

  if ($FileName -match "bulletin|fiche_de_paie") {
    $period = "mars 2026"
    if ($FileName -match "janvier") { $period = "janvier 2026" }
    if ($FileName -match "fevrier") { $period = "fevrier 2026" }
    if ($FileName -match "mars") { $period = "mars 2026" }
    return @"
Bulletin de paie
Employeur : Societe Exemple - SIRET 12345678900011 - APE 7022Z
Salarie : Camille Martin
Periode de paie : $period
Salaire brut : 3100 euros
Cotisations salariales
Net a payer : 2400 euros
Montant net social : 2350 euros
Ce bulletin est a conserver sans limitation de duree.
"@
  }

  if ($FileName -match "contrat") {
    return @"
Contrat de travail a duree indeterminee
Employeur : Societe Exemple
Salarie : Camille Martin
Poste : assistante de gestion
Date d'embauche : 01/09/2025
Remuneration mensuelle brute : 3100 euros
Duree du travail : 35 heures
Signatures de l'employeur et du salarie
"@
  }

  if ($FileName -match "piece_identite") {
    return @"
Carte nationale d'identite - Republique francaise
Nom : Martin
Prenom : Camille
Date de naissance : 12/04/1994
Lieu de naissance : Nancy
Numero du document : 123456789
Date d'expiration : 12/04/2030
"@
  }

  if ($FileName -match "quittance_fiche_de_paie") {
    return @"
Bulletin de paie
Employeur : Societe Exemple - SIRET 12345678900011
Salarie : Camille Martin
Periode de paie : avril 2026
Salaire brut : 3100 euros
Net a payer : 2400 euros
Net imposable : 2450 euros
"@
  }

  if ($FileName -match "quittance") {
    return @"
Quittance de loyer
Bailleur : Agence Demo
Locataire : Camille Martin
Adresse du logement : 12 rue du Test, 54000 Nancy
Periode concernee : mars 2026
Loyer : 700 euros
Charges : 100 euros
Somme acquittee : 800 euros
"@
  }

  return "Document test $FileName"
}

function Invoke-Scenario {
  param(
    [string] $Name,
    [string[]] $Files
  )

  $dir = Join-Path $Root ($Name -replace "[^a-zA-Z0-9-]", "-")
  New-Item -ItemType Directory -Path $dir | Out-Null
  $curlArgs = @("-s", "-X", "POST", "-F", "address=12 rue du Test, 54000 Nancy", "-F", "rent=800")

  foreach ($file in $Files) {
    $path = Join-Path $dir $file
    Set-Content -LiteralPath $path -Value (Get-FakeDocumentContent $file) -Encoding UTF8
    $curlArgs += "-F"
    $curlArgs += "files=@$path;type=text/plain"
  }

  $raw = & curl.exe @curlArgs $BaseUrl
  $json = $raw | ConvertFrom-Json

  [pscustomobject]@{
    scenario = $Name
    people = @($json.people | ForEach-Object {
      [pscustomobject]@{
        name = $_.name
        taxNoticeIncome = $_.taxNoticeIncome
        monthlyIncome = $_.monthlyIncome
        warnings = $_.warnings
      }
    })
    missing = $json.report.missingDocuments
    checklist = @($json.report.documentChecklist | ForEach-Object {
      [pscustomobject]@{
        id = $_.id
        status = $_.status
        type = $_.documentType
        evidence = ($_.evidence -join ", ")
        reason = $_.evidenceReason
      }
    })
    risks = $json.report.riskPoints
    summary = $json.report.humanSummary
  }
}

$results = @()
$results += Invoke-Scenario "attestation-salaire-sans-avis" @(
  "camille_piece_identite.txt",
  "camille_contrat_travail_cdi.txt",
  "camille_bulletin_salaire_janvier.txt",
  "camille_bulletin_salaire_fevrier.txt",
  "camille_bulletin_salaire_mars.txt",
  "camille_attestation_salaire_annuelle_2024_net_imposable_32000.txt",
  "camille_quittance_loyer_mars.txt"
)
$results += Invoke-Scenario "vrai-avis-imposition-simule" @(
  "camille_piece_identite.txt",
  "camille_contrat_travail_cdi.txt",
  "camille_bulletin_salaire_janvier.txt",
  "camille_bulletin_salaire_fevrier.txt",
  "camille_bulletin_salaire_mars.txt",
  "camille_avis_imposition_dgfip_revenu_fiscal_reference_2025.txt",
  "camille_quittance_loyer_mars.txt"
)
$results += Invoke-Scenario "fiche-paie-nommee-quittance-piege" @(
  "camille_piece_identite.txt",
  "camille_contrat_travail_cdi.txt",
  "camille_bulletin_salaire_janvier.txt",
  "camille_bulletin_salaire_fevrier.txt",
  "camille_bulletin_salaire_mars.txt",
  "camille_avis_imposition_dgfip_revenu_fiscal_reference_2025.txt",
  "camille_quittance_fiche_de_paie_loyer.txt"
)
$results += Invoke-Scenario "dossier-tres-incomplet" @(
  "camille_bulletin_salaire_janvier.txt",
  "camille_attestation_salaire_annuelle.txt"
)

$results | ConvertTo-Json -Depth 8
