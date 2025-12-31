/**
 * OpenAI module exports
 *
 * Generic OpenAI utilities for use across the application.
 *
 * @module lib/openai
 */

export {
    getOpenAIClient,
    chatCompletion,
    chatCompletionJson,
    chatCompletionStructured,
    DEFAULT_MODEL,
    FALLBACK_MODEL,
    type ChatCompletionOptions,
    type StructuredOutputOptions,
} from "./client";
