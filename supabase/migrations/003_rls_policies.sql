-- =============================================
-- STREAMD Row Level Security Policies
-- Migration: 003_rls_policies
-- Description: RLS policies for all tables
-- =============================================

-- =============================================
-- USERS TABLE RLS
-- =============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Anyone can view non-deleted user profiles
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.users FOR SELECT
    USING (deleted_at IS NULL);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Users can soft delete their own profile
CREATE POLICY "Users can delete own profile"
    ON public.users FOR DELETE
    USING (auth.uid() = id);

-- =============================================
-- ANIME TABLE RLS
-- =============================================
ALTER TABLE public.anime ENABLE ROW LEVEL SECURITY;

-- Anyone can view non-deleted anime
CREATE POLICY "Anime is viewable by everyone"
    ON public.anime FOR SELECT
    USING (deleted_at IS NULL);

-- Only authenticated users can insert anime (admin check would be added in production)
CREATE POLICY "Authenticated users can insert anime"
    ON public.anime FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users can update anime (admin check would be added in production)
CREATE POLICY "Authenticated users can update anime"
    ON public.anime FOR UPDATE
    USING (auth.role() = 'authenticated');

-- =============================================
-- USER ANIME TABLE RLS
-- =============================================
ALTER TABLE public.user_anime ENABLE ROW LEVEL SECURITY;

-- Users can view their own tracking data
CREATE POLICY "Users can view own tracking"
    ON public.user_anime FOR SELECT
    USING (auth.uid() = user_id);

-- Public tracking is viewable by everyone (when not private)
CREATE POLICY "Public tracking is viewable"
    ON public.user_anime FOR SELECT
    USING (is_private = FALSE);

-- Users can insert their own tracking
CREATE POLICY "Users can insert own tracking"
    ON public.user_anime FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own tracking
CREATE POLICY "Users can update own tracking"
    ON public.user_anime FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own tracking
CREATE POLICY "Users can delete own tracking"
    ON public.user_anime FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================
-- FOLLOWS TABLE RLS
-- =============================================
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Anyone can view follows
CREATE POLICY "Follows are viewable by everyone"
    ON public.follows FOR SELECT
    USING (TRUE);

-- Users can follow others
CREATE POLICY "Users can follow"
    ON public.follows FOR INSERT
    WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow
CREATE POLICY "Users can unfollow"
    ON public.follows FOR DELETE
    USING (auth.uid() = follower_id);

-- =============================================
-- GENRES TABLE RLS
-- =============================================
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;

-- Anyone can view genres
CREATE POLICY "Genres are viewable by everyone"
    ON public.genres FOR SELECT
    USING (TRUE);

-- Only authenticated users can insert genres
CREATE POLICY "Authenticated users can insert genres"
    ON public.genres FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- =============================================
-- STUDIOS TABLE RLS
-- =============================================
ALTER TABLE public.studios ENABLE ROW LEVEL SECURITY;

-- Anyone can view studios
CREATE POLICY "Studios are viewable by everyone"
    ON public.studios FOR SELECT
    USING (TRUE);

-- Only authenticated users can insert studios
CREATE POLICY "Authenticated users can insert studios"
    ON public.studios FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- =============================================
-- ANIME_GENRES TABLE RLS
-- =============================================
ALTER TABLE public.anime_genres ENABLE ROW LEVEL SECURITY;

-- Anyone can view anime-genre relationships
CREATE POLICY "Anime genres are viewable by everyone"
    ON public.anime_genres FOR SELECT
    USING (TRUE);

-- Only authenticated users can insert anime-genre relationships
CREATE POLICY "Authenticated users can insert anime genres"
    ON public.anime_genres FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- =============================================
-- ANIME_STUDIOS TABLE RLS
-- =============================================
ALTER TABLE public.anime_studios ENABLE ROW LEVEL SECURITY;

-- Anyone can view anime-studio relationships
CREATE POLICY "Anime studios are viewable by everyone"
    ON public.anime_studios FOR SELECT
    USING (TRUE);

-- Only authenticated users can insert anime-studio relationships
CREATE POLICY "Authenticated users can insert anime studios"
    ON public.anime_studios FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- =============================================
-- STREAMING_LINKS TABLE RLS
-- =============================================
ALTER TABLE public.streaming_links ENABLE ROW LEVEL SECURITY;

-- Anyone can view streaming links
CREATE POLICY "Streaming links are viewable by everyone"
    ON public.streaming_links FOR SELECT
    USING (TRUE);

-- Only authenticated users can insert streaming links
CREATE POLICY "Authenticated users can insert streaming links"
    ON public.streaming_links FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- =============================================
-- REVIEWS TABLE RLS
-- =============================================
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view non-deleted reviews
CREATE POLICY "Reviews are viewable by everyone"
    ON public.reviews FOR SELECT
    USING (deleted_at IS NULL);

-- Users can create reviews
CREATE POLICY "Users can create reviews"
    ON public.reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
    ON public.reviews FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
    ON public.reviews FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================
-- USER_EPISODES TABLE RLS
-- =============================================
ALTER TABLE public.user_episodes ENABLE ROW LEVEL SECURITY;

-- Users can view their own episode tracking
CREATE POLICY "Users can view own episodes"
    ON public.user_episodes FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own episode tracking
CREATE POLICY "Users can insert own episodes"
    ON public.user_episodes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own episode tracking
CREATE POLICY "Users can update own episodes"
    ON public.user_episodes FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own episode tracking
CREATE POLICY "Users can delete own episodes"
    ON public.user_episodes FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================
-- IMPORT_JOBS TABLE RLS
-- =============================================
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own import jobs
CREATE POLICY "Users can view own imports"
    ON public.import_jobs FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create import jobs
CREATE POLICY "Users can create imports"
    ON public.import_jobs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

