-- =============================================
-- STREAMD Seed Data
-- Migration: 004_seed_data
-- Description: Initial seed data for genres and common studios
-- =============================================

-- =============================================
-- SEED GENRES
-- Common anime genres
-- =============================================
INSERT INTO public.genres (name, slug) VALUES
    ('Action', 'action'),
    ('Adventure', 'adventure'),
    ('Comedy', 'comedy'),
    ('Drama', 'drama'),
    ('Fantasy', 'fantasy'),
    ('Horror', 'horror'),
    ('Mecha', 'mecha'),
    ('Music', 'music'),
    ('Mystery', 'mystery'),
    ('Psychological', 'psychological'),
    ('Romance', 'romance'),
    ('Sci-Fi', 'sci-fi'),
    ('Slice of Life', 'slice-of-life'),
    ('Sports', 'sports'),
    ('Supernatural', 'supernatural'),
    ('Thriller', 'thriller'),
    ('Ecchi', 'ecchi'),
    ('Harem', 'harem'),
    ('Isekai', 'isekai'),
    ('Josei', 'josei'),
    ('Kids', 'kids'),
    ('Martial Arts', 'martial-arts'),
    ('Military', 'military'),
    ('Parody', 'parody'),
    ('Police', 'police'),
    ('School', 'school'),
    ('Seinen', 'seinen'),
    ('Shoujo', 'shoujo'),
    ('Shounen', 'shounen'),
    ('Space', 'space'),
    ('Super Power', 'super-power'),
    ('Vampire', 'vampire'),
    ('Yaoi', 'yaoi'),
    ('Yuri', 'yuri')
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- SEED STUDIOS
-- Major anime studios
-- =============================================
INSERT INTO public.studios (name, slug) VALUES
    ('A-1 Pictures', 'a-1-pictures'),
    ('Bones', 'bones'),
    ('CloverWorks', 'cloverworks'),
    ('CoMix Wave Films', 'comix-wave-films'),
    ('David Production', 'david-production'),
    ('Gainax', 'gainax'),
    ('J.C.Staff', 'jc-staff'),
    ('Khara', 'khara'),
    ('Kinema Citrus', 'kinema-citrus'),
    ('Kyoto Animation', 'kyoto-animation'),
    ('Lerche', 'lerche'),
    ('Madhouse', 'madhouse'),
    ('Manglobe', 'manglobe'),
    ('MAPPA', 'mappa'),
    ('Nippon Animation', 'nippon-animation'),
    ('OLM', 'olm'),
    ('P.A.Works', 'pa-works'),
    ('Pierrot', 'pierrot'),
    ('Production I.G', 'production-ig'),
    ('Shaft', 'shaft'),
    ('Silver Link', 'silver-link'),
    ('Studio Deen', 'studio-deen'),
    ('Studio Ghibli', 'studio-ghibli'),
    ('Studio Trigger', 'studio-trigger'),
    ('Sunrise', 'sunrise'),
    ('Toei Animation', 'toei-animation'),
    ('TMS Entertainment', 'tms-entertainment'),
    ('Ufotable', 'ufotable'),
    ('White Fox', 'white-fox'),
    ('Wit Studio', 'wit-studio')
ON CONFLICT (slug) DO NOTHING;

