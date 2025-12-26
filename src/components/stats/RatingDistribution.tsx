"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RatingBucket } from "@/types/user";

/**
 * Props for the RatingDistribution component
 */
interface RatingDistributionProps {
    /** Array of rating buckets (1-10) with counts */
    data: RatingBucket[];
    /** User's average rating (shown as indicator) */
    averageRating: number | null;
    /** Optional className for custom styling */
    className?: string;
}

/**
 * Chart configuration for the rating histogram
 * Using amber/gold color to represent ratings (star-like)
 */
const chartConfig = {
    count: {
        label: "Anime",
        color: "hsl(45 93% 47%)", // Amber/gold color for ratings
    },
} satisfies ChartConfig;

/**
 * RatingDistribution component
 *
 * Displays a histogram of user ratings from 1-10.
 * Shows the average rating as a reference point.
 */
export function RatingDistribution({
    data,
    averageRating,
    className,
}: RatingDistributionProps) {
    // Check if there are any ratings
    const hasRatings = data.some((bucket) => bucket.count > 0);

    if (!hasRatings) {
        return (
            <Card className={className}>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">
                        Rating Distribution
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        No ratings given yet
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">
                        Rating Distribution
                    </CardTitle>
                    {averageRating !== null && (
                        <span className="text-sm text-muted-foreground">
                            Avg:{" "}
                            <span className="font-medium text-foreground">
                                {averageRating.toFixed(1)}
                            </span>
                        </span>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[200px] w-full">
                    <BarChart
                        data={data}
                        margin={{ left: 0, right: 0, top: 8, bottom: 0 }}
                    >
                        <XAxis
                            dataKey="rating"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis hide />
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    labelFormatter={(value) => `Rating: ${value}`}
                                />
                            }
                        />
                        <Bar
                            dataKey="count"
                            fill="var(--color-count)"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

