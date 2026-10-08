-- ==============================================================================
-- Habib Al-Rahman Portfolio CMS - Client Work Descriptions & Link Placements
-- Migration: 003_client_works_and_link_placements.sql
-- ==============================================================================

-- 1. Add bilingual "Work Done With Client" to clients table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS work_description_ar TEXT,
ADD COLUMN IF NOT EXISTS work_description_en TEXT;

-- 2. Add hero and footer visibility flags to dynamic social_links table
ALTER TABLE public.social_links
ADD COLUMN IF NOT EXISTS show_in_hero BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS show_in_footer BOOLEAN NOT NULL DEFAULT true;
