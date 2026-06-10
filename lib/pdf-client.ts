import { RentalAnalysis, RentalDossier, applicantFullName } from "@/lib/rental-flow";

function pdfEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildLines(dossier: RentalDossier, analysis: RentalAnalysis) {
  return [
    "DOSSIER LOCATIF ELIGIA",
    "",
    `Adresse: ${dossier.address}`,
    `Loyer CC: ${dossier.rent} EUR`,
    `Solvabilite: ${analysis.solvencyLabel} (${analysis.solvencyScore}/100)`,
    "",
    "PERSONNES",
    ...dossier.applicants.flatMap((applicant) => [
      `${applicant.role === "tenant" ? "Locataire" : "Garant"}: ${applicantFullName(applicant)}`,
      `Revenu mensuel: ${applicant.monthlyIncome} EUR`,
      `Avis d'imposition: ${applicant.taxNoticeIncome} EUR / an`,
      `Pieces: ${applicant.documents.map((document) => document.name).join(", ") || "Aucune piece ajoutee"}`,
      ""
    ]),
    "RESUME",
    analysis.summary
  ];
}

export function downloadUnifiedPdf(dossier: RentalDossier, analysis: RentalAnalysis) {
  const lines = buildLines(dossier, analysis).flatMap((line) => {
    if (line.length <= 92) return [line];
    const chunks = [];
    for (let index = 0; index < line.length; index += 92) chunks.push(line.slice(index, index + 92));
    return chunks;
  });
  const content = [
    "BT",
    "/F1 11 Tf",
    "46 790 Td",
    ...lines.map((line, index) => `${index === 0 ? "" : "0 -17 Td"}(${pdfEscape(line)}) Tj`),
    "ET"
  ].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "dossier-locatif-eligia.pdf";
  link.click();
  URL.revokeObjectURL(url);
}
