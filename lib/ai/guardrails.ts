/**
 * Deterministic safety checks that run before a message reaches the model.
 * These checks reduce unsafe or irrelevant requests before model execution.
 *
 * The system prompt is the main guardrail, but it's probabilistic. These
 * patterns catch the clearest out-of-scope requests (medical advice, unrelated
 * topics, attempts to extract or override the configuration) and answer them
 * without calling the model at all. They are deliberately narrow: a false
 * positive blocks a legitimate clinic question, so anything ambiguous is left
 * for the model and its system prompt to handle.
 */

/** Longest message a user can send. */
export const MAX_MESSAGE_CHARS = 2000;

/** Most recent messages forwarded to the model as conversation history. */
export const MAX_HISTORY_MESSAGES = 12;

export type GuardrailCategory =
  "medical_advice" | "off_topic" | "prompt_injection";

export type GuardrailResult =
  | { allowed: true }
  | { allowed: false; category: GuardrailCategory; reply: string };

const RULES: Array<{ category: GuardrailCategory; patterns: RegExp[] }> = [
  {
    category: "prompt_injection",
    patterns: [
      /\b(ignore|disregard|forget|override)\b.{0,40}\b(previous|prior|above|earlier|all|your)\b.{0,30}\b(instructions?|rules|prompts?|guidelines)\b/,
      /\b(system prompt|your (instructions|prompt|rules|configuration)|developer message)\b/,
      /\b(api[\s_-]?key|xai_api_key|groq_api_key|secret key|access token|auth[\s_-]?secret|database_url|direct_url)\b/,
      /\b(jailbreak|dan mode|developer mode)\b/,
    ],
  },
  {
    category: "medical_advice",
    patterns: [
      /\b(give|make|provide|suggest|offer|tell me|what('?s| is))\b.{0,30}\bdiagnos\w*/,
      /\bdiagnos(e|ing)\b.{0,30}\b(me|him|her|them|patient|this|my|symptoms?)\b/,
      /\b(what|which)\b.{0,30}\b(medications?|medicines?|drugs?|antibiotics?|dosages?|doses?)\b.{0,30}\b(should|take|give|prescribe|use)\b/,
      /\bhow (much|many)\b.{0,25}\b(mg|milligrams?|pills?|tablets?|doses?)\b/,
      /\bsymptoms?\b.{0,40}\b(mean|cause|serious|could it be|do i have)\b/,
      /\bdo i have\b.{0,30}\b(cancer|diabetes|infection|covid|flu|disease|condition)\b/,
      /\bshould (i|he|she|they|the patient)\b.{0,25}\b(take|stop taking|start taking)\b/,
      /\b(treat|cure)\b.{0,20}\b(my|his|her|their|the patient'?s?)\b.{0,30}\b(pain|infection|disease|condition|symptoms?|illness)\b/,
    ],
  },
  {
    category: "off_topic",
    patterns: [
      /\b(write|compose|create|generate|make)\b.{0,25}\b(poem|song|story|haiku|limerick|essay|joke|rap|lyrics)\b/,
      /\b(poem|haiku|limerick|lyrics)\b/,
      /\b(who won|final score|match result|world cup|premier league|champions league|nba|nfl|ipl)\b/,
      /\b(football|soccer|cricket|basketball|baseball|tennis)\b.{0,30}\b(match|game|score|won|win|result|team)\b/,
      /\b(stock price|bitcoin|crypto(currency)?|weather forecast|horoscope)\b/,
    ],
  },
];

const REPLIES: Record<GuardrailCategory, string> = {
  medical_advice:
    "I can't help with **diagnoses, symptoms, treatments or medications** — that's for the treating provider. For an emergency, contact local emergency services.",
  off_topic:
    "I'm the ClinicOS operations assistant, so I only help with **appointments, schedules and clinic workflows**.",
  prompt_injection:
    "I can't share or change how I'm configured, but I can help with **appointments, schedules and clinic workflows**.",
};

/** Lower-case, strip zero-width characters and collapse whitespace. */
function normalize(text: string): string {
  return text
    .normalize("NFKC")
    .replace(/[​-‍﻿]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function checkMessage(text: string): GuardrailResult {
  const normalized = normalize(text);
  for (const rule of RULES) {
    if (rule.patterns.some((pattern) => pattern.test(normalized))) {
      return {
        allowed: false,
        category: rule.category,
        reply: REPLIES[rule.category],
      };
    }
  }
  return { allowed: true };
}
