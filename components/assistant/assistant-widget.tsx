"use client";

import * as React from "react";
import {
  AlertCircle,
  Bot,
  RotateCcw,
  Send,
  Sparkles,
  Square,
  X,
} from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";

import { cn } from "@/lib/utils";

/**
 * Floating ClinicOS Assistant, rendered by the dashboard layout only.
 *
 * Talks to POST /api/assistant, which checks the session, role, rate limit and
 * guardrails before streaming a plain-text reply. Nothing here holds a secret;
 * the role prop only chooses the suggested questions.
 */

type ChatRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  /** Guardrail replies are shown but not sent back as conversation history. */
  guardrail?: boolean;
}

interface FailedSend {
  content: string;
  messageIds: string[];
}

const MAX_INPUT_CHARS = 2000;
const HISTORY_TO_SEND = 12;

const SUGGESTIONS: Record<string, string[]> = {
  FRONT_DESK: [
    "What appointments are scheduled today?",
    "Explain appointment statuses",
    "How does cancellation work?",
    "How do I add a new provider?",
  ],
  PROVIDER: [
    "What appointments are scheduled today?",
    "Explain appointment statuses",
    "How does cancellation work?",
    "What can I do as a provider?",
  ],
};

let messageCounter = 0;
const newId = () => `msg-${Date.now()}-${messageCounter++}`;

/**
 * Assistant replies are Markdown. react-markdown builds React elements and
 * never renders raw HTML, so model output can't inject markup; images are
 * dropped as well. Styles are kept small to fit a chat bubble.
 */
const MARKDOWN_COMPONENTS: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="mb-2 list-disc space-y-1 pl-4 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-4 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="pl-0.5 marker:text-[#A855F7]">{children}</li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-900">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  code: ({ children }) => (
    <code className="rounded bg-purple-50 px-1 py-0.5 font-mono text-[0.85em] text-purple-800">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mb-2 overflow-x-auto rounded-lg bg-purple-50 p-2 text-xs last:mb-0">
      {children}
    </pre>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-[#A855F7] underline underline-offset-2"
    >
      {children}
    </a>
  ),
  h1: ({ children }) => (
    <p className="mb-1 font-semibold text-gray-900">{children}</p>
  ),
  h2: ({ children }) => (
    <p className="mb-1 font-semibold text-gray-900">{children}</p>
  ),
  h3: ({ children }) => (
    <p className="mb-1 font-semibold text-gray-900">{children}</p>
  ),
};

export function AssistantWidget({ role }: { role: string }) {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "waiting" | "streaming">(
    "idle"
  );
  const [error, setError] = React.useState<string | null>(null);
  const [failed, setFailed] = React.useState<FailedSend | null>(null);

  const abortRef = React.useRef<AbortController | null>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const launcherRef = React.useRef<HTMLButtonElement>(null);

  const busy = status !== "idle";
  const suggestions = SUGGESTIONS[role] ?? SUGGESTIONS.PROVIDER;
  const roleLabel = role === "FRONT_DESK" ? "Front Desk" : "Provider";

  // Keep the latest message in view.
  React.useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  }, [messages, status, error]);

  // Focus the composer when the panel opens, and return focus to the launcher
  // when it closes. The launcher is only rendered while the panel is closed,
  // so this has to run after that render rather than in the close handler.
  const wasOpenRef = React.useRef(false);
  React.useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      inputRef.current?.focus();
    } else if (wasOpenRef.current) {
      launcherRef.current?.focus();
    }
  }, [open]);

  // Grow the textarea with its content, up to a limit.
  React.useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [input]);

  // Stop any in-flight request when the widget unmounts (e.g. sign-out).
  React.useEffect(() => () => abortRef.current?.abort(), []);

  const send = React.useCallback(
    async (text: string) => {
      const content = text.trim().slice(0, MAX_INPUT_CHARS);
      if (!content || busy) return;

      setError(null);
      setFailed(null);

      const userMessage: ChatMessage = { id: newId(), role: "user", content };
      const assistantId = newId();
      const history = [...messages.filter((m) => !m.guardrail), userMessage]
        .slice(-HISTORY_TO_SEND)
        .map(({ role: r, content: c }) => ({ role: r, content: c }));

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setStatus("waiting");

      const controller = new AbortController();
      abortRef.current = controller;
      let started = false;

      try {
        const response = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          const data = await response.json().catch(() => null);
          throw new Error(
            response.status === 401
              ? "Your session has expired. Please sign in again."
              : data?.error || "Something went wrong. Please try again."
          );
        }

        const guardrail = response.headers.has("X-Assistant-Guardrail");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let reply = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          reply += decoder.decode(value, { stream: true });
          if (!reply) continue;

          if (!started) {
            started = true;
            setStatus("streaming");
            setMessages((prev) => [
              ...prev,
              { id: assistantId, role: "assistant", content: reply, guardrail },
            ]);
          } else {
            const current = reply;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: current } : m
              )
            );
          }
        }

        if (!started) {
          throw new Error(
            "The assistant didn't return a response. Please try again."
          );
        }
      } catch (err) {
        if (controller.signal.aborted) return; // Stopped by the user: keep what arrived.
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again."
        );
        setFailed({ content, messageIds: [userMessage.id, assistantId] });
      } finally {
        abortRef.current = null;
        setStatus("idle");
      }
    },
    [busy, messages]
  );

  const retry = () => {
    if (!failed) return;
    const { content, messageIds } = failed;
    setMessages((prev) => prev.filter((m) => !messageIds.includes(m.id)));
    setFailed(null);
    setError(null);
    // Let the removal render before resending the same message.
    setTimeout(() => void send(content), 0);
  };

  const stop = () => abortRef.current?.abort();

  const reset = () => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setFailed(null);
    setInput("");
    inputRef.current?.focus();
  };

  const close = () => setOpen(false);

  return (
    <>
      {!open && (
        <button
          ref={launcherRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open ClinicOS Assistant"
          aria-haspopup="dialog"
          className="group fixed bottom-5 right-5 z-[60] h-14 w-14 rounded-full [perspective:24em] [transform-style:preserve-3d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A855F7] focus-visible:ring-offset-2 sm:bottom-6 sm:right-6"
        >
          <span className="absolute inset-0 rounded-full bg-[#A855F7] shadow-xl shadow-purple-500/30 transition-[transform,background-color] duration-300 [transition-timing-function:cubic-bezier(0.83,0,0.17,1)] [will-change:transform] group-hover:bg-[#9333EA] group-hover:[transform:rotate(8deg)_translate3d(-0.2em,-0.2em,0)]" />
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-white/15 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)] backdrop-blur-md transition-transform duration-300 [transition-timing-function:cubic-bezier(0.83,0,0.17,1)] [will-change:transform] group-hover:[transform:translate3d(0,0,0.5em)_scale(1.05)]">
            <Sparkles className="h-6 w-6 drop-shadow-sm" />
          </span>
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="ClinicOS Assistant"
          onKeyDown={(e) => {
            if (e.key === "Escape") close();
          }}
          className="fixed inset-0 z-[60] flex flex-col bg-white/95 backdrop-blur-xl duration-200 animate-in fade-in slide-in-from-bottom-4 sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[min(620px,calc(100vh-7rem))] sm:w-[400px] sm:overflow-hidden sm:rounded-3xl sm:border sm:border-white/60 sm:bg-white/85 sm:shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-purple-100/70 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:pt-3">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
              <div className="absolute inset-0 rounded-xl bg-[#A855F7] shadow-md" />
              <div className="absolute inset-0 rounded-xl bg-white/15 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)] backdrop-blur-md" />
              <Sparkles className="relative h-4 w-4 text-white drop-shadow-sm" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">
                ClinicOS Assistant
              </p>
              <p className="truncate text-xs text-gray-500">
                Clinic operations help · {roleLabel}
              </p>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={reset}
                aria-label="Start a new conversation"
                title="New conversation"
                className="rounded-full p-2 text-gray-500 transition-colors hover:bg-purple-50 hover:text-[#A855F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A855F7]/50"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={close}
              aria-label="Close assistant"
              className="rounded-full p-2 text-gray-500 transition-colors hover:bg-purple-50 hover:text-[#A855F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A855F7]/50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Conversation */}
          <div
            ref={listRef}
            aria-live="polite"
            className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
          >
            {messages.length === 0 && !error ? (
              <div className="my-auto flex flex-col items-center px-2 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A855F7]/10">
                  <Bot className="h-6 w-6 text-[#A855F7]" />
                </div>
                <p className="font-semibold text-gray-900">How can I help?</p>
                <p className="mt-1 text-sm text-gray-500">
                  Ask about appointments, schedules and clinic workflows.
                </p>
                <div className="mt-5 flex w-full flex-col gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => void send(suggestion)}
                      className="rounded-2xl border border-purple-100 bg-white/80 px-3.5 py-2.5 text-left text-sm text-gray-700 transition-colors hover:border-[#A855F7]/40 hover:bg-purple-50 hover:text-[#7E22CE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A855F7]/50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, index) => {
                const isLastAssistant =
                  message.role === "assistant" && index === messages.length - 1;
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "max-w-[85%] break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm",
                      message.role === "user"
                        ? "ml-auto whitespace-pre-wrap rounded-br-md bg-[#A855F7] text-white"
                        : message.guardrail
                          ? "mr-auto rounded-bl-md border border-amber-200 bg-amber-50/90 text-amber-900"
                          : "mr-auto rounded-bl-md border border-purple-100/80 bg-white/90 text-gray-800 backdrop-blur-sm"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <ReactMarkdown
                        components={MARKDOWN_COMPONENTS}
                        disallowedElements={["img"]}
                        unwrapDisallowed
                        skipHtml
                      >
                        {message.content}
                      </ReactMarkdown>
                    ) : (
                      message.content
                    )}
                    {isLastAssistant && status === "streaming" && (
                      <span
                        aria-hidden="true"
                        className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse rounded-sm bg-[#A855F7]/60"
                      />
                    )}
                  </div>
                );
              })
            )}

            {status === "waiting" && (
              <div
                role="status"
                aria-label="Assistant is typing"
                className="mr-auto flex items-center gap-1 rounded-2xl rounded-bl-md border border-purple-100/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-sm"
              >
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#A855F7]"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50/90 px-3.5 py-2.5 text-sm text-red-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="flex-1">
                  <p>{error}</p>
                  {failed && (
                    <button
                      type="button"
                      onClick={retry}
                      className="mt-1 font-medium underline underline-offset-2 hover:text-red-800"
                    >
                      Try again
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="border-t border-purple-100/70 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3"
          >
            <div className="flex items-end gap-2 rounded-2xl border border-purple-100 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm focus-within:border-[#A855F7]/50 focus-within:ring-2 focus-within:ring-[#A855F7]/20">
              <label htmlFor="assistant-input" className="sr-only">
                Message the assistant
              </label>
              <textarea
                id="assistant-input"
                ref={inputRef}
                rows={1}
                value={input}
                maxLength={MAX_INPUT_CHARS}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !e.nativeEvent.isComposing
                  ) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                placeholder="Ask about appointments, schedules…"
                className="max-h-32 min-h-[24px] flex-1 resize-none bg-transparent py-1 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
              {busy ? (
                <button
                  type="button"
                  onClick={stop}
                  aria-label="Stop generating"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-800 text-white transition-colors hover:bg-gray-900"
                >
                  <Square className="h-3 w-3 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  aria-label="Send message"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#A855F7] text-white transition-colors hover:bg-[#9333EA] disabled:bg-purple-200"
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="mt-2 px-1 text-[11px] leading-snug text-gray-400">
              Operational help only, not medical advice. The assistant
              can&apos;t change records.
            </p>
          </form>
        </div>
      )}
    </>
  );
}
