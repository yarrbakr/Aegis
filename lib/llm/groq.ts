// Groq LLM client — the "kitchen" that calls the model (D4: Groq / Llama 3.3 70B).
//
// Groq exposes an OpenAI-compatible Chat Completions API, so we hit it with a
// plain `fetch` — no SDK dependency (keeps the locked library list clean).
// Mistral is wired as the fallback in Phase 3; this file keeps a single entry
// point (`chatJSON`) so adding that fallback is a one-line change.

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// Primary model (D4). Groq's current production Llama 3.3 70B slug.
export const GROQ_MODEL = "llama-3.3-70b-versatile";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export class LLMError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "LLMError";
  }
}

/**
 * Call Groq in JSON mode and return the raw JSON string the model produced.
 * Low temperature for consistent, parseable output (Rules.md §5.5). The caller
 * is responsible for parsing + Zod-validating — we never trust this blindly.
 */
export async function chatJSON(
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number; signal?: AbortSignal } = {},
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new LLMError("GROQ_API_KEY is not set on the server.");
  }

  let res: Response;
  try {
    res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: opts.temperature ?? 0.3,
        max_tokens: opts.maxTokens ?? 8000,
        // Force valid JSON output (the system prompt still describes the shape).
        response_format: { type: "json_object" },
      }),
      signal: opts.signal,
    });
  } catch (err) {
    // Network / timeout / abort.
    throw new LLMError(
      `Failed to reach the model: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new LLMError(
      `Groq returned ${res.status}: ${body.slice(0, 300)}`,
      res.status,
    );
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new LLMError("Groq returned an empty response.");
  }
  return content;
}
