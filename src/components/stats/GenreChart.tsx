"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GenreCount } from "@/types/user";

/**
 * Props for the GenreChart component
 */
interface GenreChartProps {
    /** Array of genre counts to display */
    data: GenreCount[];
    /** Optional className for custom styling */
    className?: string;
}

/**
 * Chart configuration for the genre bar chart
 * Using a vibrant blue/purple color for genres
 */
const chartConfig = {
    count: {
        label: "Anime",
        color: "hsl(220 70% 55%)", // Bright blue for genres
    },
} satisfies ChartConfig;

/**
 * GenreChart component
 *
 * Displays a horizontal bar chart of top genres by anime count.
 * Uses Recharts with the existing chart UI components.
 */
export function GenreChart({ data, className }: GenreChartProps) {
    // Don't render if no data
    if (!data || data.length === 0) {
        return (
            <Card className={className}>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">
                        Top Genres
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        No genre data available
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Top Genres</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[200px] w-full">
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
                    >
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            tickLine={false}
                            axisLine={false}
                            width={80}
                            tick={{ fontSize: 12 }}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Bar
                            dataKey="count"
                            fill="var(--color-count)"
                            radius={[0, 4, 4, 0]}
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

