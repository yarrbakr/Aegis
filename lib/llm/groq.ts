// LLM client — Groq (Llama 3.3 70B) primary, Mistral fallback (D4).
//
// Both providers expose an OpenAI-compatible Chat Completions API, so we hit
// them with a plain `fetch` — no SDK dependency (keeps the locked library list
// clean). `chatJSON` is the single entry point: it tries Groq, and on any
// failure falls back to Mistral when MISTRAL_API_KEY is configured. The fallback
// is optional — with only a Groq key set, behavior is unchanged.

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";

// Primary model (D4). Groq's current production Llama 3.3 70B slug.
export const GROQ_MODEL = "llama-3.3-70b-versatile";
// Fallback model. Mistral's flagship, also JSON-mode capable.
export const MISTRAL_MODEL = "mistral-large-latest";

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

type CallOpts = { temperature?: number; maxTokens?: number; signal?: AbortSignal };

// One OpenAI-compatible chat call. Returns the raw JSON string the model
// produced (caller parses + Zod-validates — we never trust it blindly).
async function callChat(
  provider: string,
  url: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  opts: CallOpts,
): Promise<string> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: opts.temperature ?? 0.3,
        max_tokens: opts.maxTokens ?? 8000,
        // Force valid JSON output (the system prompt still describes the shape).
        response_format: { type: "json_object" },
      }),
      signal: opts.signal,
    });
  } catch (err) {
    throw new LLMError(
      `${provider}: failed to reach the model: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new LLMError(`${provider} returned ${res.status}: ${body.slice(0, 300)}`, res.status);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new LLMError(`${provider} returned an empty response.`);
  }
  return content;
}

/**
 * Call the LLM in JSON mode: Groq first, Mistral as fallback. Low temperature
 * for consistent, parseable output (Rules.md §5.5).
 */
export async function chatJSON(
  messages: ChatMessage[],
  opts: CallOpts = {},
): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY;
  const mistralKey = process.env.MISTRAL_API_KEY;

  if (!groqKey && !mistralKey) {
    throw new LLMError("No LLM API key set on the server (GROQ_API_KEY / MISTRAL_API_KEY).");
  }

  let primaryError: LLMError | null = null;

  if (groqKey) {
    try {
      return await callChat("Groq", GROQ_URL, groqKey, GROQ_MODEL, messages, opts);
    } catch (err) {
      primaryError = err instanceof LLMError ? err : new LLMError(String(err));
      if (mistralKey) {
        console.warn(`[llm] Groq failed (${primaryError.message}); falling back to Mistral.`);
      }
    }
  }

  if (mistralKey) {
    try {
      return await callChat("Mistral", MISTRAL_URL, mistralKey, MISTRAL_MODEL, messages, opts);
    } catch (err) {
      const mistralError = err instanceof LLMError ? err : new LLMError(String(err));
      throw new LLMError(
        `Both providers failed. Groq: ${primaryError?.message ?? "n/a"} | Mistral: ${mistralError.message}`,
      );
    }
  }

  throw primaryError ?? new LLMError("LLM call failed.");
}
