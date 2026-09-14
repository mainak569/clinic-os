import "server-only";

import { formatClinicDateTime } from "@/lib/clinic-time";
import { buildClinicContext, type AssistantUser } from "./clinic-context";
import { streamChatCompletion, type ChatMessage } from "./groq-client";
import { MAX_HISTORY_MESSAGES } from "./guardrails";
import { buildSystemPrompt } from "./system-prompt";

/**
 * Assistant orchestration: role-scoped context, system prompt, then the model.
 *
 * Authentication, validation and the guardrail checks happen in the API route
 * before this is called. The model has no tools and no database access. If
 * tools are added later (for example "confirm this appointment"), they should
 * call the existing services (appointmentService and so on) after the same
 * authorization checks the Server Actions use, and require explicit user
 * confirmation in the UI before any write.
 */

export interface AssistantConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export async function createAssistantReply({
  user,
  messages,
  signal,
}: {
  user: AssistantUser;
  messages: AssistantConversationMessage[];
  signal?: AbortSignal;
}): Promise<ReadableStream<Uint8Array>> {
  const now = new Date();
  const clinicData = await buildClinicContext(user, now);

  const conversation: ChatMessage[] = [
    {
      role: "system",
      content: buildSystemPrompt({
        role: user.role,
        clinicData,
        now: formatClinicDateTime(now),
      }),
    },
    ...messages.slice(-MAX_HISTORY_MESSAGES),
  ];

  return streamChatCompletion(conversation, { signal });
}
