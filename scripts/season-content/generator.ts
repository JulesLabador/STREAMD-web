/**
 * Season content generation using OpenAI
 *
 * Uses OpenAI Structured Outputs to guarantee response format.
 *
 * @module scripts/season-content/generator
 */

import { z } from "zod";
import { chatCompletionStructured, DEFAULT_MODEL } from "../../src/lib/openai";
import { SEASON_MONTHS } from "./config";
import type { SeasonContentInput, SeasonContentResponse } from "./types";

/**
 * Zod schema for season content response
 * Ensures structured output from OpenAI matches expected format
 */
const SeasonContentSchema = z.object({
    metaDescription: z
        .string()
        .describe("SEO meta description, exactly 150-160 characters"),
    introParagraph: z
        .string()
        .describe("Brief introduction, 1-2 sentences (~50-100 words)"),
    fullSummary: z
        .string()
        .describe("Detailed summary, 2-3 paragraphs (~150-250 words)"),
});

/**
 * System prompt for the AI content generator
 */
const SYSTEM_PROMPT = `You are writing for STREAMD, an anime tracking site. Your job is to write season previews that sound like they came from a knowledgeable friend, not a marketing department.

VOICE GUIDELINES:
- Write like you're texting a friend who asked "what's good this season?"
- Have opinions. Highlight the good parts, but don't mention the bad parts. Instead, focus on the positive aspects of the season.
- Don't summarize every data point - pick what actually matters
- Avoid: "electric", "buzz", "hype", "standout", "delivers", "drops", "vibes"
- Avoid: Starting sentences with "Whether you're into X or Y"
- Avoid: Ending with generic wrap-ups about "something for everyone"
- Use contractions naturally (it's, there's, we're)
- One exclamation mark per piece maximum
- Numbers don't need to be exhaustively listed - round them or skip minor categories

BAD EXAMPLE: "This season feels extra electric with 114 titles spanning TV, ONA, and MOVIE formats!"
GOOD EXAMPLE: "114 shows this fall, and honestly? A weird number of them look genuinely interesting."

BAD EXAMPLE: "SPY x FAMILY Season 3 keeps delivering the warm, spy-family comedy fans love"
GOOD EXAMPLE: "SPY x FAMILY's back for round three - at this point you already know if you're in or out"

Write content that a real person would actually want to read, not content that sounds optimized.`;

/**
 * Generates SEO-optimized content for a season page using OpenAI
 *
 * Uses Structured Outputs to guarantee the response matches
 * the expected schema exactly.
 *
 * @param input - Season data for content generation
 * @param model - OpenAI model to use (defaults to gpt-4o)
 * @returns Generated content with meta description, intro, and full summary
 */
export async function generateSeasonContent(
    input: SeasonContentInput,
    model: string = DEFAULT_MODEL
): Promise<SeasonContentResponse> {
    const prompt = buildSeasonPrompt(input);

    const response = await chatCompletionStructured(
        SYSTEM_PROMPT,
        prompt,
        SeasonContentSchema,
        {
            model,
            schemaName: "season_content",
        }
    );

    return response;
}

/**
 * Builds the prompt for season content generation
 *
 * @param input - Season data
 * @returns Formatted prompt string
 */
function buildSeasonPrompt(input: SeasonContentInput): string {
    const {
        season,
        year,
        timeContext,
        animeCount,
        formatBreakdown,
        topAnime,
        genreDistribution,
        sequelCount,
        newSeriesCount,
        notableStudios,
    } = input;

    const seasonName = season.charAt(0) + season.slice(1).toLowerCase();
    const months = SEASON_MONTHS[season];

    // Get top genres
    const topGenres = Object.entries(genreDistribution)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([genre]) => genre);

    // Build context-specific instructions
    let contextInstructions = "";
    if (timeContext === "future") {
        contextInstructions = `This is an UPCOMING season. Focus on anticipation, announcements, and what viewers can look forward to. Use future tense.`;
    } else if (timeContext === "current") {
        contextInstructions = `This is the CURRENT airing season. Focus on what's currently airing and generating buzz. Use present tense.`;
    } else {
        contextInstructions = `This is a PAST season. Focus on retrospective highlights, standout titles, and what made this season memorable. Use past tense.`;
    }

    return `Generate SEO content for the ${seasonName} ${year} anime season page.

${contextInstructions}

SEASON DATA:
- Season: ${seasonName} ${year} (${months})
- Total Anime: ${animeCount}
- Format Breakdown: ${Object.entries(formatBreakdown)
        .map(([format, count]) => `${format}: ${count}`)
        .join(", ")}
- Sequels/Continuations: ${sequelCount}
- New Original Series: ${newSeriesCount}

TOP ANIME TITLES (by popularity):
${topAnime
    .slice(0, 10)
    .map((title, i) => `${i + 1}. ${title}`)
    .join("\n")}

TOP GENRES: ${topGenres.join(", ")}

NOTABLE STUDIOS: ${notableStudios.slice(0, 5).join(", ") || "Various"}

REQUIREMENTS:
1. metaDescription: 150-160 characters. Include "${seasonName.toLowerCase()} ${year} anime" naturally. Mention the count but don't list every format.

2. introParagraph: 2-3 sentences max. Start with a general summary of the season. Mention 1-2 titles only if they're actually notable - don't force it.

3. fullSummary: 2-3 short paragraphs (~150-200 words total).
   - Lead with your actual impression of the season, not a data summary
   - Pick 3-4 titles worth mentioning and say something specific about each - not just that they exist
   - It's fine to be lukewarm about some things
   - Skip the "something for everyone" conclusion
   - ${
       timeContext === "future"
           ? "Be honest about what looks promising vs. what's a question mark"
           : timeContext === "current"
           ? "Talk about what's actually landing vs. what's disappointing"
           : "Be specific about what worked and what didn't"
   }

BANNED PHRASES (do not use these):
- "feels electric/exciting/packed"
- "driving the hype"
- "dominating hot takes"
- "social-media-ready"
- "something for everyone"
- "whether you're into X or Y"
- "keeps delivering"
- "sparks [emotion]"
- "cozy vibes"
- "worth checking out"

Return valid JSON only.`;
}

/**
 * Determines the time context for a season
 *
 * @param season - Season name (WINTER, SPRING, SUMMER, FALL)
 * @param year - Year
 * @returns Time context relative to current date
 */
export function getTimeContext(
    season: string,
    year: number
): "past" | "current" | "future" {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Determine current season
    let currentSeason: string;
    if (currentMonth >= 1 && currentMonth <= 3) {
        currentSeason = "WINTER";
    } else if (currentMonth >= 4 && currentMonth <= 6) {
        currentSeason = "SPRING";
    } else if (currentMonth >= 7 && currentMonth <= 9) {
        currentSeason = "SUMMER";
    } else {
        currentSeason = "FALL";
    }

    const seasonOrder = ["WINTER", "SPRING", "SUMMER", "FALL"];
    const targetSeasonIndex = seasonOrder.indexOf(season);
    const currentSeasonIndex = seasonOrder.indexOf(currentSeason);

    if (year > currentYear) {
        return "future";
    } else if (year < currentYear) {
        return "past";
    } else {
        // Same year - compare seasons
        if (targetSeasonIndex > currentSeasonIndex) {
            return "future";
        } else if (targetSeasonIndex < currentSeasonIndex) {
            return "past";
        } else {
            return "current";
        }
    }
}
