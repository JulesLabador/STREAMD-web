-- =============================================
-- Migration: Add short_id column to anime table
-- =============================================
-- This migration adds a short_id column for URL-friendly identifiers.
-- Short IDs are 8-character uppercase alphanumeric strings (e.g., "A1B2C3D4")
-- that provide stable, immutable URLs independent of title changes.
--
-- URL format: /anime/{shortId}/{slug}
-- Example: /anime/A1B2C3D4/koe-no-katachi
-- =============================================

-- Add short_id column to anime table
-- Initially nullable to allow migration of existing data
ALTER TABLE public.anime
ADD COLUMN short_id CHAR(8);

-- Create unique index for efficient lookups and uniqueness constraint
CREATE UNIQUE INDEX idx_anime_short_id ON public.anime(short_id)
WHERE short_id IS NOT NULL;

-- Add check constraint to ensure short_id format (uppercase alphanumeric, 8 chars)
ALTER TABLE public.anime
ADD CONSTRAINT short_id_format CHECK (short_id ~ '^[A-Z0-9]{8}$');

-- Comment explaining the column
COMMENT ON COLUMN public.anime.short_id IS 'URL-friendly 8-character uppercase alphanumeric identifier for stable URLs';

