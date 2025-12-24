-- =============================================
-- STREAMD Database Reset Script
-- WARNING: This will DROP all tables and data!
-- Only use in development/testing environments
-- =============================================

-- Drop triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_anime_updated_at ON public.anime;
DROP TRIGGER IF EXISTS update_user_anime_updated_at ON public.user_anime;
DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
DROP TRIGGER IF EXISTS recalculate_rating_on_change ON public.user_anime;
DROP TRIGGER IF EXISTS update_popularity_on_tracking ON public.user_anime;
DROP TRIGGER IF EXISTS sync_episode_count_on_change ON public.user_episodes;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS recalculate_anime_rating();
DROP FUNCTION IF EXISTS update_anime_popularity();
DROP FUNCTION IF EXISTS sync_user_anime_episode_count();
DROP FUNCTION IF EXISTS increment_review_helpful(UUID);

-- Drop tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS public.import_jobs CASCADE;
DROP TABLE IF EXISTS public.user_episodes CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.streaming_links CASCADE;
DROP TABLE IF EXISTS public.anime_studios CASCADE;
DROP TABLE IF EXISTS public.anime_genres CASCADE;
DROP TABLE IF EXISTS public.studios CASCADE;
DROP TABLE IF EXISTS public.genres CASCADE;
DROP TABLE IF EXISTS public.follows CASCADE;
DROP TABLE IF EXISTS public.user_anime CASCADE;
DROP TABLE IF EXISTS public.anime CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Note: This does NOT drop auth.users - that's managed by Supabase Auth

