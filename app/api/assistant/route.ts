import { NextResponse } from "next/server";
import { z } from "zod";

import { getApiSession } from "@/lib/auth-helpers";
import { assistantRateLimit } from "@/lib/rate-limit";
import { checkMessage, MAX_MESSAGE_CHARS } from "@/lib/ai/guardrails";
import { createAssistantReply } from "@/lib/ai/assistant.service";
import { AIServiceError } from "@/lib/ai/groq-client";

/**
 * POST /api/assistant
 *
 * Streams the ClinicOS Assistant's reply as plain text.
 *
 * Order of checks: session → role → rate limit → input validation →
 * guardrails → model. The middleware doesn't cover /api, so this route checks
 * the session itself. GROQ_API_KEY is only read on the server.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(8000),
      })
    )
    .min(1)
    .max(40),
});

const PLAIN_TEXT_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

export async function POST(request: Request) {
  const session = await getApiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role, providerId, id: userId } = session.user;
  if (role !== "FRONT_DESK" && role !== "PROVIDER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (role === "PROVIDER" && !providerId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limit = assistantRateLimit(userId);
  if (!limit.success) {
    return NextResponse.json(
      {
        error:
          "You're sending messages too quickly. Please wait a moment and try again.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil(
            (limit.reset - Date.now()) / 1000
          ).toString(),
        },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { messages } = parsed.data;
  const latest = messages[messages.length - 1];
  if (latest.role !== "user") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (latest.content.length > MAX_MESSAGE_CHARS) {
    return NextResponse.json(
      { error: `Messages can be at most ${MAX_MESSAGE_CHARS} characters.` },
      { status: 400 }
    );
  }

  const guardrail = checkMessage(latest.content);
  if (!guardrail.allowed) {
    return new Response(guardrail.reply, {
      status: 200,
      headers: {
        ...PLAIN_TEXT_HEADERS,
        "X-Assistant-Guardrail": guardrail.category,
      },
    });
  }

  try {
    const stream = await createAssistantReply({
      user: { role, providerId: providerId ?? null },
      messages,
      signal: request.signal,
    });
    return new Response(stream, { status: 200, headers: PLAIN_TEXT_HEADERS });
  } catch (error) {
    if (error instanceof AIServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error(
      "Assistant: unexpected error",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
