import { NextRequest, NextResponse } from "next/server";
import { buildLocalAnalysis, RentalDossier } from "@/lib/rental-flow";
import { readJsonBody, sanitizePositiveNumber, sanitizeText } from "@/lib/security";

export async function POST(request: NextRequest) {
  const { data: rawDossier, response: invalidJson } = await readJsonBody<RentalDossier>(request);
  if (invalidJson) return invalidJson;
  if (!rawDossier) return NextResponse.json({ error: "Dossier invalide" }, { status: 400 });

  const dossier: RentalDossier = {
    ...rawDossier,
    address: sanitizeText(rawDossier.address, 280),
    rent: sanitizePositiveNumber(rawDossier.rent, 100_000),
    applicants: Array.isArray(rawDossier.applicants) ? rawDossier.applicants.slice(0, 12) : []
  };
  const fallback = buildLocalAnalysis(dossier);

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ ...fallback, source: "local" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "Tu analyses des dossiers locatifs francais. Tu ne prends jamais de decision finale. Tu produis une synthese claire, prudente et exploitable par une agence immobiliere."
          },
          {
            role: "user",
            content: `Analyse ce dossier et reponds uniquement en JSON avec les champs solvencyScore, solvencyLabel, globalRatio, summary, missingDocuments, applicantSignals. Dossier: ${JSON.stringify(dossier)}`
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "rental_analysis",
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                solvencyScore: { type: "number" },
                solvencyLabel: { type: "string" },
                globalRatio: { type: "number" },
                summary: { type: "string" },
                missingDocuments: { type: "array", items: { type: "string" } },
                applicantSignals: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      applicantId: { type: "string" },
                      name: { type: "string" },
                      ratio: { type: "number" },
                      status: { type: "string" }
                    },
                    required: ["applicantId", "name", "ratio", "status"]
                  }
                }
              },
              required: ["solvencyScore", "solvencyLabel", "globalRatio", "summary", "missingDocuments", "applicantSignals"]
            }
          }
        }
      })
    });

    if (!response.ok) {
      return NextResponse.json({ ...fallback, source: "local" });
    }

    const payload = await response.json();
    const text = payload.output_text ?? payload.output?.flatMap((item: { content?: Array<{ text?: string }> }) => item.content ?? []).map((content: { text?: string }) => content.text ?? "").join("");
    return NextResponse.json({ ...JSON.parse(text), source: "openai" });
  } catch {
    return NextResponse.json({ ...fallback, source: "local" });
  }
}
