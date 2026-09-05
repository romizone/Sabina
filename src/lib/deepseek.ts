import { DEEPSEEK_BASE_URL, DEEPSEEK_MODEL } from "./config";

export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail?: "original" | "low" } };

export type LlmMessage = {
  role: "system" | "user" | "assistant";
  content: string | ContentPart[];
};

export function hasDeepseekKey(): boolean {
  return Boolean(process.env.DEEPSEEK_API_KEY);
}

export async function streamDeepseek(messages: LlmMessage[]): Promise<ReadableStream<Uint8Array>> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    throw new Error("DEEPSEEK_API_KEY belum diatur");
  }

  const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages,
      stream: true,
      temperature: 0.3,
      thinking: { type: "disabled" },
    }),
  });

  if (!response.ok || !response.body) {
    const err = await response.text();
    throw new Error(`Layanan DeepRomeo sedang sibuk (${response.status}).`);
  }

  return response.body;
}

export function modelName(): string {
  return "DeepRomeo";
}
