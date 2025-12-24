-- =============================================
-- STREAMD Database Schema
-- Migration: 005_remove_external_id_unique_constraints
-- Description: Remove unique constraints on external IDs (mal_id, anilist_id, kitsu_id)
--              to allow duplicate IDs from source data where sequels/movies
--              may incorrectly share the same external ID as their parent series
-- =============================================

-- Drop unique constraints on external IDs
-- Note: Constraint names are auto-generated as {table}_{column}_key
ALTER TABLE public.anime DROP CONSTRAINT IF EXISTS anime_mal_id_key;
ALTER TABLE public.anime DROP CONSTRAINT IF EXISTS anime_anilist_id_key;
ALTER TABLE public.anime DROP CONSTRAINT IF EXISTS anime_kitsu_id_key;

-- The indexes for lookups remain intact (idx_anime_mal_id, idx_anime_anilist_id, idx_anime_kitsu_id)
-- These are non-unique indexes that still allow efficient querying by external ID

COMMENT ON COLUMN public.anime.mal_id IS 'MyAnimeList numeric ID (non-unique, source data may have duplicates)';
COMMENT ON COLUMN public.anime.anilist_id IS 'AniList numeric ID (non-unique, source data may have duplicates)';
COMMENT ON COLUMN public.anime.kitsu_id IS 'Kitsu slug-based ID (non-unique, source data may have duplicates)';

