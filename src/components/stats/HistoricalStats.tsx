"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { YearlyProgressBar } from "./YearlyProgressBar";
import type { YearlyAnimeData } from "@/types/user";
import { cn } from "@/lib/utils";

/**
 * Props for the HistoricalStats component
 */
interface HistoricalStatsProps {
    /** Array of yearly data (excluding current year) */
    data: YearlyAnimeData[];
    /** Optional className for custom styling */
    className?: string;
}

/**
 * HistoricalStats component
 *
 * Displays a collapsible section with progress bars for previous years.
 * Hidden by default to keep focus on current year stats.
 */
export function HistoricalStats({ data, className }: HistoricalStatsProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Don't render if no historical data
    if (!data || data.length === 0) {
        return null;
    }

    return (
        <div className={cn("space-y-4", className)}>
            {/* Toggle button */}
            <Button
                variant="ghost"
                className="w-full justify-between"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span className="text-sm font-medium">
                    View Previous Years ({data.length})
                </span>
                {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                ) : (
                    <ChevronDown className="h-4 w-4" />
                )}
            </Button>

            {/* Collapsible content */}
            {isExpanded && (
                <Card>
                    <CardContent className="space-y-6 p-4">
                        {data.map((yearData) => (
                            <YearlyProgressBar
                                key={yearData.year}
                                data={yearData}
                                featured={false}
                            />
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

