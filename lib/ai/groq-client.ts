import "server-only";

/**
 * Minimal streaming client for Groq's chat completions API (OpenAI-compatible).
 * Server-only: GROQ_API_KEY never leaves the server, and callers get back a
 * stream of plain-text answer deltas.
 *
 * The default model, openai/gpt-oss-120b, is a reasoning model. Groq streams
 * its reasoning in a separate `delta.reasoning` field; only `delta.content` is
 * forwarded, so the model's internal reasoning is never shown to users.
 */

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b";
const REQUEST_TIMEOUT_MS = 45_000;

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** A failure the route can report with a status code and a user-safe message. */
export class AIServiceError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "AIServiceError";
  }
}

export async function streamChatCompletion(
  messages: ChatMessage[],
  { signal }: { signal?: AbortSignal } = {}
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new AIServiceError("The assistant isn't configured yet.", 503);
  }

  // One controller for the timeout, the caller's abort and stream cancellation.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  signal?.addEventListener("abort", () => controller.abort(), { once: true });

  let response: Response;
  try {
    response = await fetch(GROQ_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL,
        messages,
        stream: true,
        temperature: 0.2,
        // Reasoning tokens count toward this limit, so leave room for the answer.
        max_completion_tokens: 1024,
        reasoning_effort: "low",
      }),
      signal: controller.signal,
    });
  } catch {
    clearTimeout(timeout);
    throw new AIServiceError(
      "The assistant is temporarily unavailable. Please try again.",
      503
    );
  }

  if (!response.ok || !response.body) {
    clearTimeout(timeout);
    // Log the upstream status and error for operators; nothing upstream is
    // passed to the client, and the key is never part of an error body.
    const detail = await response.text().catch(() => "");
    console.error(
      `Assistant: Groq request failed (${response.status}): ${detail.slice(0, 200)}`
    );
    if (response.status === 429) {
      throw new AIServiceError(
        "The assistant is busy right now. Please try again in a moment.",
        429
      );
    }
    throw new AIServiceError(
      "The assistant is temporarily unavailable. Please try again later.",
      502
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  const finish = () => {
    clearTimeout(timeout);
    reader.cancel().catch(() => undefined);
  };

  return new ReadableStream<Uint8Array>({
    async pull(output) {
      try {
        // Read until at least one answer delta can be emitted, or the stream ends.
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            finish();
            output.close();
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          let emitted = false;
          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line.startsWith("data:")) continue;

            const data = line.slice(5).trim();
            if (data === "[DONE]") {
              finish();
              output.close();
              return;
            }

            try {
              const delta = JSON.parse(data)?.choices?.[0]?.delta?.content;
              if (typeof delta === "string" && delta.length > 0) {
                output.enqueue(encoder.encode(delta));
                emitted = true;
              }
            } catch {
              // Ignore keep-alive or malformed lines rather than failing the reply.
            }
          }

          if (emitted) return;
        }
      } catch (error) {
        finish();
        output.error(error);
      }
    },
    cancel() {
      controller.abort();
      finish();
    },
  });
}
