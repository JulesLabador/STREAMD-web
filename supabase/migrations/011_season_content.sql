-- Migration: Add season_content table for AI-generated SEO content
-- This table stores AI-generated descriptions and summaries for season pages
-- to improve SEO targeting queries like "anime winter 2026"

-- Create season_content table
CREATE TABLE IF NOT EXISTS season_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Season identification
    season TEXT NOT NULL CHECK (season IN ('WINTER', 'SPRING', 'SUMMER', 'FALL')),
    year INTEGER NOT NULL CHECK (year >= 1900 AND year <= 2100),
    slug TEXT NOT NULL UNIQUE,

    -- AI-generated content
    meta_description TEXT,          -- 150-160 chars for search results
    intro_paragraph TEXT,           -- 1-2 sentences for page intro
    full_summary TEXT,              -- 2-3 paragraphs with highlights

    -- Content generation metadata
    generated_at TIMESTAMPTZ,
    model_used TEXT,                -- 'gpt-4o', 'gpt-4o-mini', etc.

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Ensure unique season/year combination
    CONSTRAINT season_content_season_year_unique UNIQUE (season, year)
);

-- Create index for slug lookups (primary access pattern)
CREATE INDEX IF NOT EXISTS idx_season_content_slug ON season_content(slug);

-- Create index for season/year lookups
CREATE INDEX IF NOT EXISTS idx_season_content_season_year ON season_content(season, year);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_season_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_season_content_updated_at
    BEFORE UPDATE ON season_content
    FOR EACH ROW
    EXECUTE FUNCTION update_season_content_updated_at();

-- Add RLS policies for season_content
ALTER TABLE season_content ENABLE ROW LEVEL SECURITY;

-- Allow public read access (content is public)
CREATE POLICY "Allow public read access to season_content"
    ON season_content
    FOR SELECT
    TO public
    USING (true);

-- Only service role can insert/update/delete (via scripts)
CREATE POLICY "Allow service role full access to season_content"
    ON season_content
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE season_content IS 'Stores AI-generated SEO content for anime season pages';
COMMENT ON COLUMN season_content.meta_description IS 'SEO meta description (150-160 chars) for search results';
COMMENT ON COLUMN season_content.intro_paragraph IS 'Short intro paragraph (1-2 sentences) displayed on page';
COMMENT ON COLUMN season_content.full_summary IS 'Full season summary (2-3 paragraphs) with highlights';
COMMENT ON COLUMN season_content.model_used IS 'OpenAI model used to generate content (e.g., gpt-4o)';

