"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronsUpDown, Search, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import type { GenreWithCount } from "@/types/anime";

/**
 * Props for the AnimeFilters component
 */
interface AnimeFiltersProps {
    /** Available genres for filtering */
    genres: GenreWithCount[];
    /** Available years for filtering */
    years: number[];
    /** Current filter values from URL */
    currentFilters: {
        genres: string[];
        years: string[];
        seasons: string[];
        formats: string[];
        statuses: string[];
        search: string | null;
    };
}

/**
 * Season options for the season filter
 */
const SEASON_OPTIONS = [
    { value: "WINTER", label: "Winter" },
    { value: "SPRING", label: "Spring" },
    { value: "SUMMER", label: "Summer" },
    { value: "FALL", label: "Fall" },
] as const;

/**
 * Format options for the format filter
 */
const FORMAT_OPTIONS = [
    { value: "TV", label: "TV" },
    { value: "MOVIE", label: "Movie" },
    { value: "OVA", label: "OVA" },
    { value: "ONA", label: "ONA" },
    { value: "SPECIAL", label: "Special" },
    { value: "MUSIC", label: "Music" },
] as const;

/**
 * Status options for the status filter
 */
const STATUS_OPTIONS = [
    { value: "RELEASING", label: "Airing" },
    { value: "FINISHED", label: "Finished" },
    { value: "NOT_YET_RELEASED", label: "Upcoming" },
    { value: "HIATUS", label: "On Hiatus" },
    { value: "CANCELLED", label: "Cancelled" },
] as const;

/**
 * AnimeFilters component
 *
 * Provides filtering controls for browsing anime with:
 * - Search input with debounce
 * - Multi-select dropdowns for genres, years, seasons, formats, and statuses
 * - Active filters display with remove buttons
 *
 * Updates URL search params for SEO-friendly filtering
 */
export function AnimeFilters({
    genres,
    years,
    currentFilters,
}: AnimeFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // Local state for search input (for debouncing)
    const [searchValue, setSearchValue] = useState(currentFilters.search || "");

    // Local state for popover open states
    const [genreOpen, setGenreOpen] = useState(false);
    const [yearOpen, setYearOpen] = useState(false);
    const [seasonOpen, setSeasonOpen] = useState(false);
    const [formatOpen, setFormatOpen] = useState(false);
    const [statusOpen, setStatusOpen] = useState(false);

    /**
     * Updates URL with new filter params
     * Preserves existing params and removes empty values
     */
    const updateFilters = useCallback(
        (updates: Record<string, string | string[] | null>) => {
            const params = new URLSearchParams(searchParams.toString());

            // Reset to page 1 when filters change
            params.delete("page");

            // Apply updates
            Object.entries(updates).forEach(([key, value]) => {
                if (value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
                    params.delete(key);
                } else if (Array.isArray(value)) {
                    params.delete(key);
                    value.forEach((v) => params.append(key, v));
                } else {
                    params.set(key, value);
                }
            });

            // Navigate with new params
            startTransition(() => {
                router.push(`/browse?${params.toString()}`, { scroll: false });
            });
        },
        [router, searchParams]
    );

    /**
     * Handles search input change with debounce
     */
    const handleSearchChange = useCallback(
        (value: string) => {
            setSearchValue(value);

            // Debounce the URL update
            const timeoutId = setTimeout(() => {
                updateFilters({ search: value || null });
            }, 300);

            return () => clearTimeout(timeoutId);
        },
        [updateFilters]
    );

    /**
     * Handles search form submission
     */
    const handleSearchSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            updateFilters({ search: searchValue || null });
        },
        [searchValue, updateFilters]
    );

    /**
     * Toggles a value in a multi-select filter
     */
    const toggleFilter = useCallback(
        (filterKey: string, value: string, currentValues: string[]) => {
            const newValues = currentValues.includes(value)
                ? currentValues.filter((v) => v !== value)
                : [...currentValues, value];

            updateFilters({ [filterKey]: newValues });
        },
        [updateFilters]
    );

    /**
     * Removes a specific filter value
     */
    const removeFilter = useCallback(
        (filterKey: string, value?: string) => {
            if (filterKey === "search") {
                setSearchValue("");
                updateFilters({ search: null });
            } else if (value) {
                // For array filters, remove the specific value
                const currentValues = currentFilters[filterKey as keyof typeof currentFilters];
                if (Array.isArray(currentValues)) {
                    const newValues = currentValues.filter((v) => v !== value);
                    updateFilters({ [filterKey]: newValues });
                }
            } else {
                // Clear all values for this filter
                updateFilters({ [filterKey]: [] });
            }
        },
        [currentFilters, updateFilters]
    );

    /**
     * Clears all filters
     */
    const clearAllFilters = useCallback(() => {
        setSearchValue("");
        updateFilters({
            genres: [],
            years: [],
            seasons: [],
            formats: [],
            statuses: [],
            search: null,
        });
    }, [updateFilters]);

    // Check if any filters are active
    const hasActiveFilters =
        currentFilters.genres.length > 0 ||
        currentFilters.years.length > 0 ||
        currentFilters.seasons.length > 0 ||
        currentFilters.formats.length > 0 ||
        currentFilters.statuses.length > 0 ||
        currentFilters.search;

    // Get display labels for active filters
    const getGenreName = (slug: string) =>
        genres.find((g) => g.slug === slug)?.name || slug;

    const getSeasonLabel = (value: string) =>
        SEASON_OPTIONS.find((s) => s.value === value)?.label || value;

    const getFormatLabel = (value: string) =>
        FORMAT_OPTIONS.find((f) => f.value === value)?.label || value;

    const getStatusLabel = (value: string) =>
        STATUS_OPTIONS.find((s) => s.value === value)?.label || value;

    /**
     * Helper to get button label for multi-select filters
     */
    const getMultiSelectLabel = (
        count: number,
        singular: string,
        plural: string,
        defaultLabel: string
    ) => {
        if (count === 0) return defaultLabel;
        if (count === 1) return `1 ${singular}`;
        return `${count} ${plural}`;
    };

    return (
        <div className="space-y-4">
            {/* Filter controls row */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Search input */}
                <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-auto sm:min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search"
                        value={searchValue}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-9 bg-input/30"
                    />
                </form>

                {/* Genre multi-select */}
                <Popover open={genreOpen} onOpenChange={setGenreOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={genreOpen}
                            className={cn(
                                "justify-between min-w-[120px] bg-input/30",
                                currentFilters.genres.length > 0 && "border-primary/50"
                            )}
                        >
                            {getMultiSelectLabel(
                                currentFilters.genres.length,
                                "Genre",
                                "Genres",
                                "Genres"
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[250px] p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Search genres..." />
                            <CommandList>
                                <CommandEmpty>No genre found.</CommandEmpty>
                                <CommandGroup>
                                    {genres.map((genre) => (
                                        <CommandItem
                                            key={genre.id}
                                            value={genre.name}
                                            onSelect={() =>
                                                toggleFilter("genres", genre.slug, currentFilters.genres)
                                            }
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    currentFilters.genres.includes(genre.slug)
                                                        ? "opacity-100"
                                                        : "opacity-0"
                                                )}
                                            />
                                            {genre.name}
                                            <span className="ml-auto text-xs text-muted-foreground">
                                                {genre.animeCount}
                                            </span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                {/* Year multi-select */}
                <Popover open={yearOpen} onOpenChange={setYearOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={yearOpen}
                            className={cn(
                                "justify-between min-w-[100px] bg-input/30",
                                currentFilters.years.length > 0 && "border-primary/50"
                            )}
                        >
                            {getMultiSelectLabel(
                                currentFilters.years.length,
                                "Year",
                                "Years",
                                "Year"
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[150px] p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Search years..." />
                            <CommandList>
                                <CommandEmpty>No year found.</CommandEmpty>
                                <CommandGroup>
                                    {years.map((year) => (
                                        <CommandItem
                                            key={year}
                                            value={year.toString()}
                                            onSelect={() =>
                                                toggleFilter("years", year.toString(), currentFilters.years)
                                            }
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    currentFilters.years.includes(year.toString())
                                                        ? "opacity-100"
                                                        : "opacity-0"
                                                )}
                                            />
                                            {year}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                {/* Season multi-select */}
                <Popover open={seasonOpen} onOpenChange={setSeasonOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={seasonOpen}
                            className={cn(
                                "justify-between min-w-[110px] bg-input/30",
                                currentFilters.seasons.length > 0 && "border-primary/50"
                            )}
                        >
                            {getMultiSelectLabel(
                                currentFilters.seasons.length,
                                "Season",
                                "Seasons",
                                "Season"
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[150px] p-0" align="start">
                        <Command>
                            <CommandList>
                                <CommandGroup>
                                    {SEASON_OPTIONS.map((option) => (
                                        <CommandItem
                                            key={option.value}
                                            value={option.label}
                                            onSelect={() =>
                                                toggleFilter("seasons", option.value, currentFilters.seasons)
                                            }
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    currentFilters.seasons.includes(option.value)
                                                        ? "opacity-100"
                                                        : "opacity-0"
                                                )}
                                            />
                                            {option.label}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                {/* Format multi-select */}
                <Popover open={formatOpen} onOpenChange={setFormatOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={formatOpen}
                            className={cn(
                                "justify-between min-w-[110px] bg-input/30",
                                currentFilters.formats.length > 0 && "border-primary/50"
                            )}
                        >
                            {getMultiSelectLabel(
                                currentFilters.formats.length,
                                "Format",
                                "Formats",
                                "Format"
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[150px] p-0" align="start">
                        <Command>
                            <CommandList>
                                <CommandGroup>
                                    {FORMAT_OPTIONS.map((option) => (
                                        <CommandItem
                                            key={option.value}
                                            value={option.label}
                                            onSelect={() =>
                                                toggleFilter("formats", option.value, currentFilters.formats)
                                            }
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    currentFilters.formats.includes(option.value)
                                                        ? "opacity-100"
                                                        : "opacity-0"
                                                )}
                                            />
                                            {option.label}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                {/* Status multi-select */}
                <Popover open={statusOpen} onOpenChange={setStatusOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={statusOpen}
                            className={cn(
                                "justify-between min-w-[130px] bg-input/30",
                                currentFilters.statuses.length > 0 && "border-primary/50"
                            )}
                        >
                            {getMultiSelectLabel(
                                currentFilters.statuses.length,
                                "Status",
                                "Statuses",
                                "Airing Status"
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[150px] p-0" align="start">
                        <Command>
                            <CommandList>
                                <CommandGroup>
                                    {STATUS_OPTIONS.map((option) => (
                                        <CommandItem
                                            key={option.value}
                                            value={option.label}
                                            onSelect={() =>
                                                toggleFilter("statuses", option.value, currentFilters.statuses)
                                            }
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    currentFilters.statuses.includes(option.value)
                                                        ? "opacity-100"
                                                        : "opacity-0"
                                                )}
                                            />
                                            {option.label}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                {/* Filter indicator button (for mobile) */}
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={clearAllFilters}
                        className="ml-auto sm:hidden"
                        title="Clear all filters"
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Active filters display */}
            {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">Active filters:</span>

                    {/* Search filter badge */}
                    {currentFilters.search && (
                        <Badge variant="secondary" className="gap-1 pr-1">
                            Search: &quot;{currentFilters.search}&quot;
                            <button
                                onClick={() => removeFilter("search")}
                                className="ml-1 rounded-full p-0.5 hover:bg-muted"
                                aria-label="Remove search filter"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}

                    {/* Genre filter badges */}
                    {currentFilters.genres.map((genreSlug) => (
                        <Badge key={genreSlug} variant="secondary" className="gap-1 pr-1">
                            {getGenreName(genreSlug)}
                            <button
                                onClick={() => removeFilter("genres", genreSlug)}
                                className="ml-1 rounded-full p-0.5 hover:bg-muted"
                                aria-label={`Remove ${getGenreName(genreSlug)} filter`}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}

                    {/* Year filter badges */}
                    {currentFilters.years.map((year) => (
                        <Badge key={year} variant="secondary" className="gap-1 pr-1">
                            {year}
                            <button
                                onClick={() => removeFilter("years", year)}
                                className="ml-1 rounded-full p-0.5 hover:bg-muted"
                                aria-label={`Remove ${year} filter`}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}

                    {/* Season filter badges */}
                    {currentFilters.seasons.map((season) => (
                        <Badge key={season} variant="secondary" className="gap-1 pr-1">
                            {getSeasonLabel(season)}
                            <button
                                onClick={() => removeFilter("seasons", season)}
                                className="ml-1 rounded-full p-0.5 hover:bg-muted"
                                aria-label={`Remove ${getSeasonLabel(season)} filter`}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}

                    {/* Format filter badges */}
                    {currentFilters.formats.map((format) => (
                        <Badge key={format} variant="secondary" className="gap-1 pr-1">
                            {getFormatLabel(format)}
                            <button
                                onClick={() => removeFilter("formats", format)}
                                className="ml-1 rounded-full p-0.5 hover:bg-muted"
                                aria-label={`Remove ${getFormatLabel(format)} filter`}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}

                    {/* Status filter badges */}
                    {currentFilters.statuses.map((status) => (
                        <Badge key={status} variant="secondary" className="gap-1 pr-1">
                            {getStatusLabel(status)}
                            <button
                                onClick={() => removeFilter("statuses", status)}
                                className="ml-1 rounded-full p-0.5 hover:bg-muted"
                                aria-label={`Remove ${getStatusLabel(status)} filter`}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}

                    {/* Clear all button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                        Clear all
                    </Button>
                </div>
            )}

            {/* Loading indicator */}
            {isPending && (
                <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-1/3 animate-pulse bg-primary" />
                </div>
            )}
        </div>
    );
}
