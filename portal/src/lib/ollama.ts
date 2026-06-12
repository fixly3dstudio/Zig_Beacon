export type CoachMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type OllamaChunk = {
  message?: {
    role?: string;
    content?: string;
  };
  done?: boolean;
};

export function getOllamaConfig() {
  return {
    url: process.env.OLLAMA_URL ?? "http://localhost:11434",
    model: process.env.OLLAMA_MODEL ?? "gemma4",
    visionModel: process.env.OLLAMA_VISION_MODEL ?? "qwen2.5vl:3b",
  };
}

export async function callOllama(messages: CoachMessage[]) {
  const { url, model } = getOllamaConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    return await fetch(`${url}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: true,
        messages,
        options: {
          temperature: 0.25,
          top_p: 0.9,
        },
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export function parseOllamaLine(line: string): OllamaChunk | null {
  if (!line.trim()) return null;
  try {
    return JSON.parse(line) as OllamaChunk;
  } catch {
    return null;
  }
}
