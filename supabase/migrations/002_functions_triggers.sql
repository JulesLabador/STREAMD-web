-- =============================================
-- STREAMD Database Functions and Triggers
-- Migration: 002_functions_triggers
-- Description: Database functions and triggers for automated operations
-- =============================================

-- =============================================
-- FUNCTION: Update updated_at timestamp
-- Automatically sets updated_at to current timestamp on row update
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column IS 'Automatically updates the updated_at column on row modification';

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_anime_updated_at
    BEFORE UPDATE ON public.anime
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_anime_updated_at
    BEFORE UPDATE ON public.user_anime
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCTION: Handle new user signup
-- Creates a user profile when a new auth.users entry is created
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, username, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        -- Generate temporary username from email prefix + first 8 chars of UUID
        LOWER(SPLIT_PART(NEW.email, '@', 1)) || '_' || SUBSTR(NEW.id::text, 1, 8),
        -- Use full name from OAuth metadata or email prefix as display name
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user IS 'Creates a user profile automatically when a new user signs up';

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- FUNCTION: Recalculate anime average rating
-- Updates the anime average_rating when user_anime ratings change
-- =============================================
CREATE OR REPLACE FUNCTION recalculate_anime_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the average rating for the affected anime
    UPDATE public.anime
    SET average_rating = (
        SELECT ROUND(AVG(rating)::numeric, 2)
        FROM public.user_anime
        WHERE anime_id = COALESCE(NEW.anime_id, OLD.anime_id)
        AND rating IS NOT NULL
    )
    WHERE id = COALESCE(NEW.anime_id, OLD.anime_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION recalculate_anime_rating IS 'Recalculates anime average rating when user ratings change';

-- Trigger to recalculate rating on user_anime changes
CREATE TRIGGER recalculate_rating_on_change
    AFTER INSERT OR UPDATE OR DELETE ON public.user_anime
    FOR EACH ROW EXECUTE FUNCTION recalculate_anime_rating();

-- =============================================
-- FUNCTION: Update anime popularity
-- Increments popularity count when anime is added to a user's list
-- =============================================
CREATE OR REPLACE FUNCTION update_anime_popularity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment popularity when anime is added to a list
        UPDATE public.anime
        SET popularity = popularity + 1
        WHERE id = NEW.anime_id;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement popularity when anime is removed from a list
        UPDATE public.anime
        SET popularity = GREATEST(0, popularity - 1)
        WHERE id = OLD.anime_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_anime_popularity IS 'Updates anime popularity count based on user tracking';

-- Trigger to update popularity on user_anime insert/delete
CREATE TRIGGER update_popularity_on_tracking
    AFTER INSERT OR DELETE ON public.user_anime
    FOR EACH ROW EXECUTE FUNCTION update_anime_popularity();

-- =============================================
-- FUNCTION: Sync episode count with user_anime
-- Updates current_episode in user_anime when user_episodes change
-- =============================================
CREATE OR REPLACE FUNCTION sync_user_anime_episode_count()
RETURNS TRIGGER AS $$
DECLARE
    max_episode INT;
BEGIN
    -- Get the highest watched episode number
    SELECT MAX(episode_number) INTO max_episode
    FROM public.user_episodes
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    AND anime_id = COALESCE(NEW.anime_id, OLD.anime_id)
    AND watched = TRUE;

    -- Update the current_episode in user_anime
    UPDATE public.user_anime
    SET current_episode = COALESCE(max_episode, 0)
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    AND anime_id = COALESCE(NEW.anime_id, OLD.anime_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sync_user_anime_episode_count IS 'Syncs user_anime.current_episode with user_episodes watched count';

-- Trigger to sync episode count
CREATE TRIGGER sync_episode_count_on_change
    AFTER INSERT OR UPDATE OR DELETE ON public.user_episodes
    FOR EACH ROW EXECUTE FUNCTION sync_user_anime_episode_count();

-- =============================================
-- FUNCTION: Increment review helpful count
-- Safely increments the helpful_count for a review
-- =============================================
CREATE OR REPLACE FUNCTION increment_review_helpful(review_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.reviews
    SET helpful_count = helpful_count + 1
    WHERE id = review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_review_helpful IS 'Increments the helpful count for a review';

