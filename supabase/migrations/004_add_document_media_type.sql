-- Migration 004: Add 'document' to works media_type constraint
-- Habib Portfolio

ALTER TABLE public.works DROP CONSTRAINT IF EXISTS works_media_type_check;
ALTER TABLE public.works ADD CONSTRAINT works_media_type_check CHECK (media_type IN ('image', 'video', 'document'));
