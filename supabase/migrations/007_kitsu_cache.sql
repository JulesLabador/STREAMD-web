-- =============================================
-- STREAMD Database Schema
-- Migration: 007_kitsu_cache
-- Description: Cache table for Kitsu API responses
-- =============================================

-- =============================================
-- KITSU RESPONSE CACHE TABLE
-- Stores raw Kitsu API responses to minimize API calls
-- =============================================
CREATE TABLE public.kitsu_response_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key TEXT UNIQUE NOT NULL,  -- e.g., "kitsu:anime:winter:2025:page:1"
    response JSONB NOT NULL,          -- raw Kitsu API response
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL   -- created_at + 30 days
);

-- Index for fast cache key lookups
CREATE INDEX idx_kitsu_cache_key ON public.kitsu_response_cache(cache_key);

-- Index for finding expired entries (for cleanup)
CREATE INDEX idx_kitsu_cache_expires ON public.kitsu_response_cache(expires_at);

COMMENT ON TABLE public.kitsu_response_cache IS 'Cache for Kitsu API responses to minimize external API calls';
COMMENT ON COLUMN public.kitsu_response_cache.cache_key IS 'Unique identifier for the cached request (e.g., kitsu:anime:winter:2025:page:1)';
COMMENT ON COLUMN public.kitsu_response_cache.response IS 'Raw JSON response from Kitsu API';
COMMENT ON COLUMN public.kitsu_response_cache.expires_at IS 'Timestamp when this cache entry expires (30 days from creation)';

