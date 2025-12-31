/**
 * Output formatting functions for verbose and comparison modes
 *
 * @module scripts/season-content/output
 */

import { MODEL_INFO } from "./config";
import type {
    SeasonData,
    SeasonContentResponse,
    ModelComparisonResult,
} from "./types";

/**
 * Prints detailed season data in a formatted way
 */
export function printSeasonData(data: SeasonData, timeContext: string): void {
    console.log("\n" + "─".repeat(60));
    console.log("📊 SEASON DATA");
    console.log("─".repeat(60));

    console.log(`\n  Season: ${data.season} ${data.year}`);
    console.log(`  Slug: ${data.slug}`);
    console.log(`  Time Context: ${timeContext.toUpperCase()}`);
    console.log(`  Total Anime: ${data.animeCount}`);

    // Format breakdown
    console.log("\n  📺 Format Breakdown:");
    const sortedFormats = Object.entries(data.formatBreakdown).sort(
        ([, a], [, b]) => b - a
    );
    for (const [format, count] of sortedFormats) {
        const percentage = ((count / data.animeCount) * 100).toFixed(1);
        console.log(`     ${format}: ${count} (${percentage}%)`);
    }

    // Sequel vs New
    console.log("\n  🔄 Series Types:");
    console.log(`     New Series: ${data.newSeriesCount}`);
    console.log(`     Sequels/Continuations: ${data.sequelCount}`);

    // Top anime
    console.log("\n  🏆 Top Anime (by popularity):");
    data.topAnime.slice(0, 10).forEach((title, i) => {
        console.log(`     ${(i + 1).toString().padStart(2)}. ${title}`);
    });

    // Genre distribution
    console.log("\n  🎭 Genre Distribution:");
    const sortedGenres = Object.entries(data.genreDistribution)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);
    for (const [genre, count] of sortedGenres) {
        const bar = "█".repeat(
            Math.min(20, Math.round((count / data.animeCount) * 40))
        );
        console.log(`     ${genre.padEnd(15)} ${bar} ${count}`);
    }

    // Studios
    if (data.notableStudios.length > 0) {
        console.log("\n  🎬 Notable Studios:");
        data.notableStudios.slice(0, 8).forEach((studio) => {
            console.log(`     • ${studio}`);
        });
    }

    console.log("\n" + "─".repeat(60));
}

/**
 * Prints generated content in a formatted way
 */
export function printGeneratedContent(
    content: SeasonContentResponse,
    model: string,
    duration: number
): void {
    const modelInfo = MODEL_INFO[model] || {
        name: model,
        description: "Unknown",
    };

    console.log("\n" + "─".repeat(60));
    console.log(`🤖 GENERATED CONTENT (${modelInfo.name})`);
    console.log(`   Model: ${model}`);
    console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log("─".repeat(60));

    // Meta description with character count
    console.log("\n  📝 Meta Description:");
    console.log(`     Length: ${content.metaDescription.length} chars`);
    console.log("     " + "─".repeat(50));
    console.log(`     ${content.metaDescription}`);
    console.log("     " + "─".repeat(50));

    // Intro paragraph
    console.log("\n  📖 Intro Paragraph:");
    console.log(
        `     Word count: ~${content.introParagraph.split(/\s+/).length} words`
    );
    console.log("     " + "─".repeat(50));
    wrapText(content.introParagraph, 55).forEach((line) => {
        console.log(`     ${line}`);
    });
    console.log("     " + "─".repeat(50));

    // Full summary
    console.log("\n  📄 Full Summary:");
    console.log(
        `     Word count: ~${content.fullSummary.split(/\s+/).length} words`
    );
    console.log(`     Paragraphs: ${content.fullSummary.split("\n\n").length}`);
    console.log("     " + "─".repeat(50));
    content.fullSummary.split("\n\n").forEach((para, i) => {
        console.log(`\n     [Paragraph ${i + 1}]`);
        wrapText(para, 55).forEach((line) => {
            console.log(`     ${line}`);
        });
    });
    console.log("\n     " + "─".repeat(50));

    console.log("\n" + "─".repeat(60));
}

/**
 * Wraps text to a specified width
 */
export function wrapText(text: string, width: number): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
        if (currentLine.length + word.length + 1 <= width) {
            currentLine += (currentLine ? " " : "") + word;
        } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
        }
    }
    if (currentLine) lines.push(currentLine);

    return lines;
}

/**
 * Prints a comparison table of multiple model outputs
 */
export function printModelComparison(results: ModelComparisonResult[]): void {
    console.log("\n" + "═".repeat(80));
    console.log("📊 MODEL COMPARISON RESULTS");
    console.log("═".repeat(80));

    // Summary table
    console.log("\n┌" + "─".repeat(78) + "┐");
    console.log(
        "│ " +
            "Model".padEnd(20) +
            "│ " +
            "Duration".padEnd(12) +
            "│ " +
            "Meta Len".padEnd(10) +
            "│ " +
            "Intro Words".padEnd(12) +
            "│ " +
            "Summary Words".padEnd(14) +
            "│"
    );
    console.log("├" + "─".repeat(78) + "┤");

    for (const { model, result } of results) {
        const modelInfo = MODEL_INFO[model] || { name: model };
        const duration = result.duration
            ? `${(result.duration / 1000).toFixed(2)}s`
            : "N/A";
        const metaLen =
            result.content?.metaDescription.length.toString() || "N/A";
        const introWords =
            result.content?.introParagraph.split(/\s+/).length.toString() ||
            "N/A";
        const summaryWords =
            result.content?.fullSummary.split(/\s+/).length.toString() || "N/A";

        console.log(
            "│ " +
                modelInfo.name.padEnd(20) +
                "│ " +
                duration.padEnd(12) +
                "│ " +
                metaLen.padEnd(10) +
                "│ " +
                introWords.padEnd(12) +
                "│ " +
                summaryWords.padEnd(14) +
                "│"
        );
    }
    console.log("└" + "─".repeat(78) + "┘");

    // Detailed comparison
    console.log("\n" + "═".repeat(80));
    console.log("DETAILED OUTPUT BY MODEL");
    console.log("═".repeat(80));

    for (const { model, modelInfo, result } of results) {
        if (!result.content) {
            console.log(`\n❌ ${modelInfo.name}: Failed - ${result.error}`);
            continue;
        }

        console.log("\n" + "▓".repeat(80));
        console.log(`  ${modelInfo.name} (${model})`);
        console.log(`  ${modelInfo.description}`);
        console.log(
            `  Duration: ${
                result.duration
                    ? (result.duration / 1000).toFixed(2) + "s"
                    : "N/A"
            }`
        );
        console.log("▓".repeat(80));

        console.log("\n  META DESCRIPTION:");
        console.log(`  [${result.content.metaDescription.length} chars]`);
        console.log(`  "${result.content.metaDescription}"`);

        console.log("\n  INTRO PARAGRAPH:");
        console.log(
            `  [${result.content.introParagraph.split(/\s+/).length} words]`
        );
        wrapText(result.content.introParagraph, 70).forEach((line) => {
            console.log(`  ${line}`);
        });

        console.log("\n  FULL SUMMARY:");
        console.log(
            `  [${result.content.fullSummary.split(/\s+/).length} words]`
        );
        result.content.fullSummary.split("\n\n").forEach((para, i) => {
            console.log(`\n  [P${i + 1}]`);
            wrapText(para, 70).forEach((line) => {
                console.log(`  ${line}`);
            });
        });
    }

    console.log("\n" + "═".repeat(80));
}
