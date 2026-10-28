export type GeminiBrowserConfig = { apiKey: string; model: string };

const storageKey = "btl-gemini-browser-config";
const defaultModel = "gemini-3.7-flash";

export function readGeminiBrowserConfig(): GeminiBrowserConfig {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? "{}") as Partial<GeminiBrowserConfig>;
    return { apiKey: saved.apiKey?.trim() ?? "", model: saved.model?.trim() || defaultModel };
  } catch {
    return { apiKey: "", model: defaultModel };
  }
}

export function saveGeminiBrowserConfig(config: GeminiBrowserConfig) {
  localStorage.setItem(storageKey, JSON.stringify({ apiKey: config.apiKey.trim(), model: config.model.trim() || defaultModel }));
}

export async function generateGeminiText(prompt: string, systemInstruction: string) {
  const config = readGeminiBrowserConfig();
  if (!config.apiKey) throw new Error("Ajoutez votre clé Gemini dans Paramètres avant de générer un commentaire.");

  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": config.apiKey },
    body: JSON.stringify({
      model: config.model,
      input: prompt,
      system_instruction: systemInstruction,
      generation_config: { temperature: 0.35, thinking_level: "low" },
    }),
  });
  const payload = await response.json() as Record<string, unknown>;
  if (!response.ok) throw new Error(typeof payload.error === "object" && payload.error && "message" in payload.error ? String(payload.error.message) : "La génération Gemini a échoué.");

  const findText = (value: unknown): string[] => {
    if (typeof value === "string") return [value];
    if (Array.isArray(value)) return value.flatMap(findText);
    if (!value || typeof value !== "object") return [];
    const record = value as Record<string, unknown>;
    const direct = typeof record.text === "string" ? [record.text] : [];
    return [...direct, ...Object.values(record).flatMap(findText)];
  };
  const candidates = [payload.output_text, payload.outputText, payload.steps, payload.output, payload];
  const text = candidates.flatMap(findText).map((entry) => entry.trim()).find((entry) => entry.length > 30);
  if (!text) throw new Error("Gemini n’a renvoyé aucun texte exploitable.");
  return text.replace(/^['"«]|['"»]$/g, "").trim();
}
