/**
 * OpenAI client for AI-generated content
 *
 * Generic OpenAI client that can be used across the application.
 * Requires OPENAI_API_KEY environment variable.
 *
 * @module lib/openai/client
 */

import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type { ZodType } from "zod";

/**
 * Singleton OpenAI client instance
 * Lazily initialized on first use
 */
let openaiClient: OpenAI | null = null;

/**
 * Gets or creates the OpenAI client instance
 *
 * @returns OpenAI client instance
 * @throws Error if OPENAI_API_KEY is not set
 */
export function getOpenAIClient(): OpenAI {
    if (openaiClient) {
        return openaiClient;
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        throw new Error(
            "OPENAI_API_KEY environment variable is required. " +
                "Please add it to your .env.local file."
        );
    }

    openaiClient = new OpenAI({
        apiKey,
    });

    return openaiClient;
}

/**
 * Default model for content generation
 * GPT-4o provides good quality at reasonable cost
 */
export const DEFAULT_MODEL = "gpt-5-mini";

/**
 * Fallback model for when GPT-4o is unavailable or for cost savings
 */
export const FALLBACK_MODEL = "gpt-5-nano";

/**
 * Common chat completion options
 */
export interface ChatCompletionOptions {
    /** OpenAI model to use */
    model?: string;
    /** Temperature for response randomness (0-2). Omit to use model default. */
    temperature?: number;
    /** Maximum tokens in response */
    maxTokens?: number;
    /** Whether to request JSON response format */
    jsonMode?: boolean;
}

/**
 * Sends a chat completion request to OpenAI
 *
 * @param systemPrompt - System message to set context
 * @param userPrompt - User message/query
 * @param options - Optional configuration
 * @returns The assistant's response content
 */
export async function chatCompletion(
    systemPrompt: string,
    userPrompt: string,
    options: ChatCompletionOptions = {}
): Promise<string> {
    const client = getOpenAIClient();

    const {
        model = DEFAULT_MODEL,
        temperature,
        maxTokens,
        jsonMode = false,
    } = options;

    const completion = await client.chat.completions.create({
        model,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        ...(temperature !== undefined && { temperature }),
        ...(maxTokens && { max_tokens: maxTokens }),
        ...(jsonMode && { response_format: { type: "json_object" as const } }),
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
        throw new Error("No content returned from OpenAI");
    }

    return content;
}

/**
 * Sends a chat completion request and parses JSON response
 *
 * @param systemPrompt - System message to set context
 * @param userPrompt - User message/query
 * @param options - Optional configuration (jsonMode is forced to true)
 * @returns Parsed JSON response
 */
export async function chatCompletionJson<T>(
    systemPrompt: string,
    userPrompt: string,
    options: Omit<ChatCompletionOptions, "jsonMode"> = {}
): Promise<T> {
    const content = await chatCompletion(systemPrompt, userPrompt, {
        ...options,
        jsonMode: true,
    });

    return JSON.parse(content) as T;
}

/**
 * Options for structured output chat completion
 */
export interface StructuredOutputOptions {
    /** OpenAI model to use */
    model?: string;
    /** Temperature for response randomness (0-2). Omit to use model default. */
    temperature?: number;
    /** Maximum tokens in response */
    maxTokens?: number;
    /** Name for the response format schema */
    schemaName?: string;
}

/**
 * Sends a chat completion request with structured output using Zod schema
 *
 * Uses OpenAI's Structured Outputs feature to guarantee the response
 * matches the provided Zod schema exactly.
 *
 * @param systemPrompt - System message to set context
 * @param userPrompt - User message/query
 * @param schema - Zod schema defining the expected response structure
 * @param options - Optional configuration
 * @returns Parsed and validated response matching the schema
 */
export async function chatCompletionStructured<T>(
    systemPrompt: string,
    userPrompt: string,
    schema: ZodType<T>,
    options: StructuredOutputOptions = {}
): Promise<T> {
    const client = getOpenAIClient();

    const {
        model = DEFAULT_MODEL,
        temperature,
        maxTokens,
        schemaName = "response",
    } = options;

    const completion = await client.chat.completions.parse({
        model,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        ...(temperature !== undefined && { temperature }),
        ...(maxTokens && { max_tokens: maxTokens }),
        response_format: zodResponseFormat(schema, schemaName),
    });

    const message = completion.choices[0]?.message;

    // Check for refusal first
    if (message?.refusal) {
        throw new Error(`OpenAI refused to respond: ${message.refusal}`);
    }

    const parsed = message?.parsed;

    if (!parsed) {
        throw new Error("No parsed content returned from OpenAI");
    }

    return parsed;
}
