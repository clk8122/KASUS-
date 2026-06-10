import { NextRequest, NextResponse } from "next/server";
import { DetectedPerson } from "@/lib/rental-flow";
import { jsonError, validateUploadFiles } from "@/lib/security";

const supportedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const supportedFileTypes = new Set(["application/pdf"]);

type ResponseContent =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string; detail?: "low" | "high" | "auto" }
  | { type: "input_file"; filename: string; file_data: string };

function normalizePersonName(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/\b(piece|identite|avis|impot|salaire|bulletin|contrat|travail|justificatif|domicile|quittance|loyer|garant|locataire|candidat)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitName(fullName: string) {
  const parts = fullName.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] ?? "", lastName: "" };
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.at(-1) ?? ""
  };
}

function uniquePeople(people: DetectedPerson[]) {
  const seen = new Set<string>();
  return people.filter((person) => {
    const key = person.fullName.toLocaleLowerCase("fr-FR");
    if (!person.fullName || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fallbackPeople(files: File[]): DetectedPerson[] {
  const people = files.flatMap((file, index) => {
    const fullName = normalizePersonName(file.name);
    if (!fullName || fullName.length < 3) return [];
    const { firstName, lastName } = splitName(fullName);
    return [{
      id: `detected-local-${index}`,
      firstName,
      lastName,
      fullName,
      confidence: 0.25,
      evidenceDocuments: [file.name]
    }];
  });

  return uniquePeople(people);
}

async function fileToContent(file: File): Promise<ResponseContent[]> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const base64 = bytes.toString("base64");

  if (supportedImageTypes.has(file.type)) {
    return [{
      type: "input_image",
      image_url: `data:${file.type};base64,${base64}`,
      detail: "high"
    }];
  }

  if (supportedFileTypes.has(file.type)) {
    return [{
      type: "input_file",
      filename: file.name,
      file_data: `data:${file.type};base64,${base64}`
    }];
  }

  return [{
    type: "input_text",
    text: `Fichier non lisible directement par l'IA: ${file.name}. Utilise seulement ce nom comme indice faible.`
  }];
}

function extractOutputText(payload: {
  output_text?: string;
  output?: Array<{ content?: Array<{ text?: string }> }>;
}) {
  return payload.output_text ?? payload.output?.flatMap((item) => item.content ?? []).map((content) => content.text ?? "").join("") ?? "";
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);
  const uploadError = validateUploadFiles(files, { maxFiles: 12 });
  if (uploadError) return jsonError(uploadError, 413);

  if (!files.length) {
    return NextResponse.json({ people: [], source: "empty" });
  }

  const fallback = fallbackPeople(files);

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ people: fallback, source: "local" });
  }

  try {
    const fileContents = (await Promise.all(files.slice(0, 12).map(fileToContent))).flat();
    const fileList = files.map((file, index) => `${index + 1}. ${file.name}`).join("\n");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "Tu extrais uniquement les personnes physiques mentionnees dans des pieces de dossier locatif francais. Ne deduis pas un role. Ne retourne pas les organismes, agences, employeurs, administrations ni adresses."
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  `Analyse toutes les pieces jointes et recense chaque prenom + nom trouve sur les documents. ` +
                  `Fusionne les doublons. Pour chaque personne, indique les fichiers ou elle apparait et une confiance entre 0 et 1. ` +
                  `N'invente aucun nom. Fichiers recus:\n${fileList}`
              },
              ...fileContents
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "detected_rental_people",
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                people: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      firstName: { type: "string" },
                      lastName: { type: "string" },
                      fullName: { type: "string" },
                      confidence: { type: "number" },
                      evidenceDocuments: { type: "array", items: { type: "string" } }
                    },
                    required: ["firstName", "lastName", "fullName", "confidence", "evidenceDocuments"]
                  }
                }
              },
              required: ["people"]
            }
          }
        }
      })
    });

    if (!response.ok) {
      return NextResponse.json({ people: fallback, source: "local" });
    }

    const payload = await response.json();
    const parsed = JSON.parse(extractOutputText(payload)) as { people: Omit<DetectedPerson, "id">[] };
    const people = uniquePeople(parsed.people.map((person, index) => ({
      ...person,
      id: `detected-openai-${index}`,
      fullName: person.fullName || `${person.firstName} ${person.lastName}`.trim()
    })));

    return NextResponse.json({ people, source: "openai" });
  } catch {
    return NextResponse.json({ people: fallback, source: "local" });
  }
}
