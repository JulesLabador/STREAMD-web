-- =============================================
-- STREAMD Database Schema
-- Migration: 008_anime_relations
-- Description: Add anime relations table for sequels, prequels, etc.
-- =============================================

-- =============================================
-- ANIME RELATIONS TABLE
-- =============================================
CREATE TABLE public.anime_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_anime_id UUID NOT NULL REFERENCES public.anime(id) ON DELETE CASCADE,
    target_anime_id UUID NOT NULL REFERENCES public.anime(id) ON DELETE CASCADE,
    relation_type TEXT NOT NULL CHECK (relation_type IN (
        'SEQUEL',
        'PREQUEL',
        'SIDE_STORY',
        'ALTERNATIVE',
        'SPIN_OFF',
        'CHARACTER',
        'PARENT',
        'OTHER',
        'SUMMARY',
        'ADAPTATION',
        'SOURCE',
        'CONTAINS'
    )),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Prevent duplicate relations
    UNIQUE(source_anime_id, target_anime_id, relation_type),
    -- Prevent self-referencing relations
    CONSTRAINT no_self_relation CHECK (source_anime_id != target_anime_id)
);

-- Indexes for efficient lookups
CREATE INDEX idx_anime_relations_source ON public.anime_relations(source_anime_id);
CREATE INDEX idx_anime_relations_target ON public.anime_relations(target_anime_id);
CREATE INDEX idx_anime_relations_type ON public.anime_relations(relation_type);

COMMENT ON TABLE public.anime_relations IS 'Relationships between anime (sequels, prequels, side stories, etc.)';
COMMENT ON COLUMN public.anime_relations.source_anime_id IS 'The anime that has the relation';
COMMENT ON COLUMN public.anime_relations.target_anime_id IS 'The related anime';
COMMENT ON COLUMN public.anime_relations.relation_type IS 'Type of relation: SEQUEL, PREQUEL, SIDE_STORY, ALTERNATIVE, SPIN_OFF, CHARACTER, PARENT, OTHER, SUMMARY, ADAPTATION, SOURCE, CONTAINS';

-- =============================================
-- RLS POLICIES FOR ANIME RELATIONS
-- =============================================

-- Enable RLS
ALTER TABLE public.anime_relations ENABLE ROW LEVEL SECURITY;

-- Anyone can view anime relations
CREATE POLICY "Anyone can view anime relations"
    ON public.anime_relations
    FOR SELECT
    USING (true);

-- Only authenticated users can insert anime relations
CREATE POLICY "Authenticated users can insert anime relations"
    ON public.anime_relations
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Only authenticated users can delete anime relations
CREATE POLICY "Authenticated users can delete anime relations"
    ON public.anime_relations
    FOR DELETE
    TO authenticated
    USING (true);

