-- =============================================
-- STREAMD Database Schema
-- Migration: 001_initial_schema
-- Description: Initial database schema setup
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE (extends Supabase auth.users)
-- =============================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ,

    -- Username must be 3-30 characters
    CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
    -- Username can only contain alphanumeric characters and underscores
    CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$')
);

-- Indexes for users table
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_deleted_at ON public.users(deleted_at) WHERE deleted_at IS NULL;

COMMENT ON TABLE public.users IS 'User profiles extending Supabase auth.users';
COMMENT ON COLUMN public.users.preferences IS 'User preferences stored as JSON: { theme, notifications, privacy settings }';

-- =============================================
-- ANIME TABLE
-- =============================================
CREATE TABLE public.anime (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    titles JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- titles structure: { "english": string | null, "romaji": string, "japanese": string | null }
    format TEXT NOT NULL CHECK (format IN ('TV', 'MOVIE', 'OVA', 'ONA', 'SPECIAL', 'MUSIC')),
    episode_count INT,
    episode_duration INT, -- in minutes
    season TEXT CHECK (season IN ('WINTER', 'SPRING', 'SUMMER', 'FALL')),
    season_year INT,
    start_date DATE,
    end_date DATE,
    synopsis TEXT,
    average_rating DECIMAL(3, 2) CHECK (average_rating >= 0 AND average_rating <= 10),
    popularity INT DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('FINISHED', 'RELEASING', 'NOT_YET_RELEASED', 'CANCELLED', 'HIATUS')),
    -- External IDs as separate columns for efficient querying
    mal_id INT UNIQUE,           -- MyAnimeList ID
    anilist_id INT UNIQUE,       -- AniList ID
    kitsu_id TEXT UNIQUE,        -- Kitsu ID (slug-based)
    edition JSONB DEFAULT '{}'::jsonb,
    -- edition structure: { "type": "TV" | "DIRECTORS_CUT" | "THEATRICAL", "parent_id": uuid | null }
    cover_image_url TEXT,
    banner_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ,

    -- Slug must be lowercase alphanumeric with hyphens
    CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Indexes for anime table
CREATE INDEX idx_anime_slug ON public.anime(slug);
CREATE INDEX idx_anime_status ON public.anime(status);
CREATE INDEX idx_anime_format ON public.anime(format);
CREATE INDEX idx_anime_season ON public.anime(season, season_year);
CREATE INDEX idx_anime_popularity ON public.anime(popularity DESC);
CREATE INDEX idx_anime_rating ON public.anime(average_rating DESC NULLS LAST);
CREATE INDEX idx_anime_deleted_at ON public.anime(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_anime_titles_gin ON public.anime USING GIN (titles);
-- External ID indexes for lookups
CREATE INDEX idx_anime_mal_id ON public.anime(mal_id) WHERE mal_id IS NOT NULL;
CREATE INDEX idx_anime_anilist_id ON public.anime(anilist_id) WHERE anilist_id IS NOT NULL;
CREATE INDEX idx_anime_kitsu_id ON public.anime(kitsu_id) WHERE kitsu_id IS NOT NULL;

COMMENT ON TABLE public.anime IS 'Anime catalog with metadata from external sources';
COMMENT ON COLUMN public.anime.titles IS 'Titles in multiple languages: { english, romaji, japanese }';
COMMENT ON COLUMN public.anime.edition IS 'Edition info: { type, parent_id } for variants like Director''s Cut';
COMMENT ON COLUMN public.anime.mal_id IS 'MyAnimeList numeric ID';
COMMENT ON COLUMN public.anime.anilist_id IS 'AniList numeric ID';
COMMENT ON COLUMN public.anime.kitsu_id IS 'Kitsu slug-based ID';

-- =============================================
-- USER ANIME (TRACKING) TABLE
-- =============================================
CREATE TABLE public.user_anime (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    anime_id UUID NOT NULL REFERENCES public.anime(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('PLANNING', 'WATCHING', 'COMPLETED', 'PAUSED', 'DROPPED')),
    current_episode INT DEFAULT 0 CHECK (current_episode >= 0),
    rating DECIMAL(3, 2) CHECK (rating >= 0 AND rating <= 10),
    rewatch_count INT DEFAULT 0 CHECK (rewatch_count >= 0),
    last_rewatch_at TIMESTAMPTZ,
    started_at DATE,
    completed_at DATE,
    notes TEXT,
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Each user can only have one tracking entry per anime
    UNIQUE(user_id, anime_id)
);

-- Indexes for user_anime table
CREATE INDEX idx_user_anime_user_id ON public.user_anime(user_id);
CREATE INDEX idx_user_anime_anime_id ON public.user_anime(anime_id);
CREATE INDEX idx_user_anime_status ON public.user_anime(user_id, status);
CREATE INDEX idx_user_anime_updated ON public.user_anime(user_id, updated_at DESC);

COMMENT ON TABLE public.user_anime IS 'User anime tracking/watchlist entries';
COMMENT ON COLUMN public.user_anime.status IS 'Tracking status: PLANNING, WATCHING, COMPLETED, PAUSED, DROPPED';

-- =============================================
-- FOLLOWS TABLE (Social Graph)
-- =============================================
CREATE TABLE public.follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Prevent duplicate follows
    UNIQUE(follower_id, following_id),
    -- Prevent self-following
    CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Indexes for follows table
CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

COMMENT ON TABLE public.follows IS 'Social follow relationships between users';

-- =============================================
-- GENRES TABLE
-- =============================================
CREATE TABLE public.genres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,

    CONSTRAINT genre_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

COMMENT ON TABLE public.genres IS 'Anime genre categories';

-- =============================================
-- STUDIOS TABLE
-- =============================================
CREATE TABLE public.studios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,

    CONSTRAINT studio_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

COMMENT ON TABLE public.studios IS 'Animation studios';

-- =============================================
-- ANIME-GENRES JUNCTION TABLE
-- =============================================
CREATE TABLE public.anime_genres (
    anime_id UUID NOT NULL REFERENCES public.anime(id) ON DELETE CASCADE,
    genre_id UUID NOT NULL REFERENCES public.genres(id) ON DELETE CASCADE,
    PRIMARY KEY (anime_id, genre_id)
);

CREATE INDEX idx_anime_genres_genre ON public.anime_genres(genre_id);

COMMENT ON TABLE public.anime_genres IS 'Many-to-many relationship between anime and genres';

-- =============================================
-- ANIME-STUDIOS JUNCTION TABLE
-- =============================================
CREATE TABLE public.anime_studios (
    anime_id UUID NOT NULL REFERENCES public.anime(id) ON DELETE CASCADE,
    studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
    PRIMARY KEY (anime_id, studio_id)
);

CREATE INDEX idx_anime_studios_studio ON public.anime_studios(studio_id);

COMMENT ON TABLE public.anime_studios IS 'Many-to-many relationship between anime and studios';

-- =============================================
-- STREAMING LINKS TABLE
-- =============================================
CREATE TABLE public.streaming_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anime_id UUID NOT NULL REFERENCES public.anime(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('CRUNCHYROLL', 'FUNIMATION', 'NETFLIX', 'HULU', 'AMAZON', 'HIDIVE', 'OTHER')),
    url TEXT NOT NULL,
    region TEXT DEFAULT 'US',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_streaming_links_anime ON public.streaming_links(anime_id);

COMMENT ON TABLE public.streaming_links IS 'Links to streaming platforms for each anime';

-- =============================================
-- REVIEWS TABLE
-- =============================================
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    anime_id UUID NOT NULL REFERENCES public.anime(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) >= 50),
    is_spoiler BOOLEAN DEFAULT FALSE,
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ,

    -- One review per user per anime
    UNIQUE(user_id, anime_id)
);

CREATE INDEX idx_reviews_anime ON public.reviews(anime_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reviews_user ON public.reviews(user_id) WHERE deleted_at IS NULL;

COMMENT ON TABLE public.reviews IS 'User reviews for anime';
COMMENT ON COLUMN public.reviews.content IS 'Review content, minimum 50 characters';

-- =============================================
-- USER EPISODES TABLE (Episode-Level Tracking)
-- =============================================
CREATE TABLE public.user_episodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    anime_id UUID NOT NULL REFERENCES public.anime(id) ON DELETE CASCADE,
    episode_number INT NOT NULL CHECK (episode_number > 0),
    watched BOOLEAN DEFAULT TRUE,
    watched_at TIMESTAMPTZ DEFAULT NOW(),
    rewatch_count INT DEFAULT 0,

    -- Each user can only have one entry per episode per anime
    UNIQUE(user_id, anime_id, episode_number)
);

CREATE INDEX idx_user_episodes_user_anime ON public.user_episodes(user_id, anime_id);

COMMENT ON TABLE public.user_episodes IS 'Individual episode watch tracking';

-- =============================================
-- IMPORT JOBS TABLE
-- =============================================
CREATE TABLE public.import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (source IN ('MAL', 'ANILIST', 'KITSU')),
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    metadata JSONB DEFAULT '{}'::jsonb,
    -- metadata structure: { "total_items": number, "processed_items": number, "file_url": string | null }
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_import_jobs_user ON public.import_jobs(user_id);
CREATE INDEX idx_import_jobs_status ON public.import_jobs(status);

COMMENT ON TABLE public.import_jobs IS 'Background import jobs for MAL/AniList/Kitsu data';
COMMENT ON COLUMN public.import_jobs.metadata IS 'Job metadata: { total_items, processed_items, file_url }';

