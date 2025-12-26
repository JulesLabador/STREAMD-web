"use client";

import { useState } from "react";
import { Play, CheckCircle, Clock, Pause, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { UserAnimeCard } from "./UserAnimeCard";
import type { UserAnimeWithAnime, UserAnimeStatus } from "@/types/user";
import {
    USER_ANIME_STATUS_LABELS,
    USER_ANIME_STATUS_ORDER,
} from "@/types/user";

/**
 * Short labels for mobile view
 */
const STATUS_SHORT_LABELS: Record<UserAnimeStatus, string> = {
    WATCHING: "Watching",
    COMPLETED: "Completed",
    PLANNING: "Planning",
    PAUSED: "On Hold",
    DROPPED: "Dropped",
};

/**
 * Icon components mapped to each status
 */
const STATUS_ICONS: Record<UserAnimeStatus, React.ElementType> = {
    WATCHING: Play,
    COMPLETED: CheckCircle,
    PLANNING: Clock,
    PAUSED: Pause,
    DROPPED: XCircle,
};

/**
 * Props for the AnimeListTabs component
 */
interface AnimeListTabsProps {
    /** All user anime entries grouped by status */
    animeByStatus: Record<UserAnimeStatus, UserAnimeWithAnime[]>;
    /** Initial active tab */
    initialTab?: UserAnimeStatus;
}

/**
 * AnimeListTabs component
 *
 * Displays user's anime list organized in tabs by status:
 * - Watching
 * - Completed
 * - Planning
 * - On Hold (Paused)
 * - Dropped
 *
 * Each tab shows a grid of UserAnimeCard components
 */
export function AnimeListTabs({
    animeByStatus,
    initialTab = "WATCHING",
}: AnimeListTabsProps) {
    const [activeTab, setActiveTab] = useState<UserAnimeStatus>(initialTab);

    // Find first non-empty tab if initial tab is empty
    const getDefaultTab = (): UserAnimeStatus => {
        if (animeByStatus[initialTab]?.length > 0) {
            return initialTab;
        }
        for (const status of USER_ANIME_STATUS_ORDER) {
            if (animeByStatus[status]?.length > 0) {
                return status;
            }
        }
        return initialTab;
    };

    const defaultTab = getDefaultTab();

    return (
        <Tabs
            defaultValue={defaultTab}
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as UserAnimeStatus)}
            className="w-full"
        >
            {/* Tab list - scrollable on mobile */}
            <ScrollArea className="w-full">
                <TabsList className="inline-flex h-10 sm:h-12 w-max min-w-full sm:w-full">
                    {USER_ANIME_STATUS_ORDER.map((status) => {
                        const count = animeByStatus[status]?.length ?? 0;
                        return (
                            <TabsTrigger
                                key={status}
                                value={status}
                                className="flex-1 gap-1 sm:gap-1.5 px-2 sm:px-3 h-full hover:cursor-pointer hover:text-primary data-[state=inactive]:hover:text-primary text-xs sm:text-sm min-w-max"
                            >
                                <span className="sm:hidden">
                                    {STATUS_SHORT_LABELS[status]}
                                </span>
                                <span className="hidden sm:inline">
                                    {USER_ANIME_STATUS_LABELS[status]}
                                </span>
                                <span className="rounded-full bg-muted-foreground/20 px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-xs">
                                    {count}
                                </span>
                            </TabsTrigger>
                        );
                    })}
                </TabsList>
                <ScrollBar orientation="horizontal" className="h-1.5" />
            </ScrollArea>

            {/* Tab content */}
            {USER_ANIME_STATUS_ORDER.map((status) => (
                <TabsContent key={status} value={status} className="mt-4">
                    <AnimeGrid
                        anime={animeByStatus[status] ?? []}
                        status={status}
                    />
                </TabsContent>
            ))}
        </Tabs>
    );
}

/**
 * Grid component for displaying anime cards
 */
interface AnimeGridProps {
    anime: UserAnimeWithAnime[];
    status: UserAnimeStatus;
}

function AnimeGrid({ anime, status }: AnimeGridProps) {
    if (anime.length === 0) {
        return (
            <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed">
                <p className="text-muted-foreground">
                    No anime in{" "}
                    <span className="font-medium text-primary">
                        {USER_ANIME_STATUS_LABELS[status].toUpperCase()}
                    </span>
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {anime.map((userAnime) => (
                <UserAnimeCard key={userAnime.id} userAnime={userAnime} />
            ))}
        </div>
    );
}
