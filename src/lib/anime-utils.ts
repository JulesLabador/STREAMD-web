import type { Anime } from "@/types/anime";

/**
 * Formats the anime status for display
 * @param status - The anime status enum value
 * @returns Human-readable status string
 */
export function formatStatus(status: Anime["status"]): string {
    const statusMap: Record<Anime["status"], string> = {
        FINISHED: "Finished",
        RELEASING: "Currently Airing",
        NOT_YET_RELEASED: "Not Yet Released",
        CANCELLED: "Cancelled",
        HIATUS: "On Hiatus",
    };
    return statusMap[status] || status;
}

/**
 * Gets the badge variant for anime status
 * Maps anime status to badge color variants
 * @param status - The anime status enum value
 * @returns Badge variant string
 */
export function getStatusVariant(
    status: Anime["status"],
): "watching" | "completed" | "planned" | "onHold" | "secondary" {
    switch (status) {
        case "RELEASING":
            return "watching";
        case "FINISHED":
            return "completed";
        case "NOT_YET_RELEASED":
            return "planned";
        case "HIATUS":
            return "onHold";
        default:
            return "secondary";
    }
}

/**
 * Formats season and year for display
 * @param season - The anime season (WINTER, SPRING, SUMMER, FALL)
 * @param year - The year of the season
 * @returns Formatted season string (e.g., "Winter 2024")
 */
export function formatSeason(
    season: Anime["season"],
    year: number | null,
): string {
    if (!season && !year) return "TBA";
    if (!season) return String(year);
    if (!year) return season.charAt(0) + season.slice(1).toLowerCase();
    return `${season.charAt(0)}${season.slice(1).toLowerCase()} ${year}`;
}

/**
 * Formats a date string for display
 * @param dateString - ISO date string or null
 * @returns Formatted date string (e.g., "Jan 15, 2024") or "TBA"
 */
export function formatDate(dateString: string | null): string {
    if (!dateString) return "TBA";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

/**
 * Gets a display name for streaming platform
 * @param platform - The platform enum value
 * @returns Human-readable platform name
 */
export function getPlatformName(platform: string): string {
    const platformNames: Record<string, string> = {
        CRUNCHYROLL: "Crunchyroll",
        FUNIMATION: "Funimation",
        NETFLIX: "Netflix",
        HULU: "Hulu",
        AMAZON: "Prime Video",
        HIDIVE: "HIDIVE",
        OTHER: "Other",
    };
    return platformNames[platform] || platform;
}
