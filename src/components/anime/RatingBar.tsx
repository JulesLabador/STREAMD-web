/**
 * Props for rating bar components
 */
interface RatingBarProps {
    /** The rating value (0-10 scale) */
    rating: number;
}

/**
 * Rating bar component - Gradient fill with score marker
 *
 * A horizontal bar that fills with a gradient from red to green,
 * with a white marker notch at the score position. The gradient
 * visually indicates the quality tier (red = low, amber = mid, green = high).
 *
 * @example
 * <RatingBarGradient rating={8.5} />
 */
export function RatingBarGradient({ rating }: RatingBarProps) {
    const fillPercent = (rating / 10) * 100;

    return (
        <div className="w-full space-y-1.5">
            {/* Header with label and score */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Rating</span>
                <span className="font-mono">{rating.toFixed(1)} / 10</span>
            </div>
            {/* Bar container */}
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
                {/* Gradient fill */}
                <div
                    className="h-full rounded-full bg-linear-to-r from-rose-500 via-amber-400 to-emerald-400"
                    style={{ width: `${fillPercent}%` }}
                />
                {/* Score marker notch */}
                <div
                    className="absolute top-0 h-full w-1 rounded-full bg-white shadow-md"
                    style={{ left: `calc(${fillPercent}% - 2px)` }}
                />
            </div>
        </div>
    );
}

/**
 * Rating bar component - Segmented blocks
 *
 * Displays 10 blocks where filled blocks represent whole points,
 * partial blocks represent decimal values, and empty blocks are unfilled.
 * This creates a clear visual "meter" effect.
 *
 * @example
 * <RatingBarSegmented rating={8.5} />
 * // Shows 8 filled blocks, 1 partially filled, 1 empty
 */
export function RatingBarSegmented({ rating }: RatingBarProps) {
    return (
        <div className="w-full space-y-1.5">
            {/* Header with label and score */}
            <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Score</span>
                <span className="text-lg font-black tabular-nums">
                    {rating.toFixed(1)}
                </span>
            </div>
            {/* Segmented blocks */}
            <div className="flex gap-1">
                {[...Array(10)].map((_, i) => {
                    // Block is fully filled if rating >= block number (1-indexed)
                    const filled = rating >= i + 1;
                    // Block is partially filled if rating is between i and i+1
                    const partial = !filled && rating > i;

                    return (
                        <div
                            key={i}
                            className={`h-2.5 flex-1 rounded-sm ${
                                filled
                                    ? "bg-linear-to-r from-amber-400 to-amber-500"
                                    : partial
                                      ? "bg-linear-to-r from-amber-400/50 to-amber-500/50"
                                      : "bg-secondary"
                            }`}
                        />
                    );
                })}
            </div>
        </div>
    );
}

