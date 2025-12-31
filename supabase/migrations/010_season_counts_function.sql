-- Migration: Add get_season_counts function
-- Purpose: Efficiently count anime per season/year combination using GROUP BY
-- This avoids the default row limit issue when fetching all rows

/**
 * Returns season/year combinations with their anime counts
 * Uses GROUP BY for efficient database-side aggregation
 */
CREATE OR REPLACE FUNCTION get_season_counts()
RETURNS TABLE (
    season TEXT,
    season_year INTEGER,
    anime_count BIGINT
)
LANGUAGE SQL
STABLE
AS $$
    SELECT
        season,
        season_year,
        COUNT(*) as anime_count
    FROM anime
    WHERE season IS NOT NULL
      AND season_year IS NOT NULL
    GROUP BY season, season_year
    ORDER BY season_year DESC, season;
$$;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION get_season_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION get_season_counts() TO anon;

