-- Fix rating column precision to allow values up to 10.00
-- Previous: DECIMAL(3, 2) only allowed 0.00 to 9.99
-- New: DECIMAL(4, 2) allows 0.00 to 99.99 (we still constrain to 0-10 via CHECK)

-- Fix user_anime rating column
ALTER TABLE public.user_anime
    ALTER COLUMN rating TYPE DECIMAL(4, 2);

-- Fix anime average_rating column
ALTER TABLE public.anime
    ALTER COLUMN average_rating TYPE DECIMAL(4, 2);

