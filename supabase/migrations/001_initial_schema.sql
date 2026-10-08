-- ==============================================================================
-- Habib Al-Rahman Portfolio CMS - Initial Database Schema & RLS Policies
-- Migration: 001_initial_schema.sql
-- ==============================================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name_ar TEXT NOT NULL DEFAULT 'حبيب الرحمن',
  full_name_en TEXT NOT NULL DEFAULT 'Habib AL-Rahman',
  title_ar TEXT NOT NULL DEFAULT 'خبير التسويق الرقمي وبناء العلامات التجارية',
  title_en TEXT NOT NULL DEFAULT 'Generative AI & Digital Marketing Specialist',
  bio_ar TEXT NOT NULL DEFAULT 'Founder & CEO at Seven B | Generative AI & Digital Marketing Specialist | Media Buying | AI Video • Creative Ads • Automation | Arabic Tutor for non-native speakers',
  bio_en TEXT NOT NULL DEFAULT 'Founder & CEO at Seven B | Generative AI & Digital Marketing Specialist | Media Buying | AI Video • Creative Ads • Automation | Arabic Tutor for non-native speakers',
  avatar_url TEXT,
  clients_count INTEGER NOT NULL DEFAULT 50,
  projects_count INTEGER NOT NULL DEFAULT 100,
  experience_years INTEGER NOT NULL DEFAULT 5,
  primary_website_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. CLIENTS TABLE
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  profession_ar TEXT,
  profession_en TEXT,
  logo_url TEXT,
  description_ar TEXT,
  description_en TEXT,
  website_url TEXT,
  project_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. PORTFOLIO PAGES / BRANDS TABLE
CREATE TABLE IF NOT EXISTS public.portfolio_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  specialization_ar TEXT,
  specialization_en TEXT,
  image_url TEXT,
  description_ar TEXT,
  description_en TEXT,
  primary_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. WORKS TABLE
CREATE TABLE IF NOT EXISTS public.works (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  project_url TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. TESTIMONIALS TABLE
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name_ar TEXT NOT NULL,
  client_name_en TEXT NOT NULL,
  profession_ar TEXT,
  profession_en TEXT,
  avatar_url TEXT,
  content_ar TEXT NOT NULL,
  content_en TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. SOCIAL LINKS TABLE (Dynamic Links for Profile, Clients, Pages)
CREATE TABLE IF NOT EXISTS public.social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type TEXT NOT NULL CHECK (owner_type IN ('profile', 'client', 'page')),
  owner_id UUID NOT NULL,
  platform TEXT NOT NULL,
  label_ar TEXT,
  label_en TEXT,
  url TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. SITE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_visible BOOLEAN NOT NULL DEFAULT true,
  clients_visible BOOLEAN NOT NULL DEFAULT true,
  pages_visible BOOLEAN NOT NULL DEFAULT true,
  works_visible BOOLEAN NOT NULL DEFAULT true,
  testimonials_visible BOOLEAN NOT NULL DEFAULT true,
  testimonials_cta_visible BOOLEAN NOT NULL DEFAULT true,
  testimonials_limit INTEGER NOT NULL DEFAULT 6,
  section_order JSONB NOT NULL DEFAULT '["hero", "clients", "pages", "works", "testimonials"]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INDEXES FOR OPTIMAL QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_clients_sort ON public.clients (sort_order, is_visible);
CREATE INDEX IF NOT EXISTS idx_pages_sort ON public.portfolio_pages (sort_order, is_visible);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON public.categories (sort_order, is_visible);
CREATE INDEX IF NOT EXISTS idx_works_category ON public.works (category_id, is_visible, sort_order);
CREATE INDEX IF NOT EXISTS idx_works_featured ON public.works (is_featured, is_visible, sort_order);
CREATE INDEX IF NOT EXISTS idx_works_client ON public.works (client_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_status ON public.testimonials (status, is_visible, sort_order);
CREATE INDEX IF NOT EXISTS idx_social_links_owner ON public.social_links (owner_type, owner_id, sort_order, is_visible);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Public profiles are readable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can update profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 2. Clients Policies
CREATE POLICY "Visible clients are readable by public"
  ON public.clients FOR SELECT
  USING (is_visible = true OR auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage clients"
  ON public.clients FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Pages Policies
CREATE POLICY "Visible pages are readable by public"
  ON public.portfolio_pages FOR SELECT
  USING (is_visible = true OR auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage pages"
  ON public.portfolio_pages FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Categories Policies
CREATE POLICY "Visible categories are readable by public"
  ON public.categories FOR SELECT
  USING (is_visible = true OR auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Works Policies
CREATE POLICY "Visible works are readable by public"
  ON public.works FOR SELECT
  USING (is_visible = true OR auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage works"
  ON public.works FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. Testimonials Policies
CREATE POLICY "Approved visible testimonials are readable by public"
  ON public.testimonials FOR SELECT
  USING ((status = 'approved' AND is_visible = true) OR auth.role() = 'authenticated');

CREATE POLICY "Public can submit testimonials with pending status"
  ON public.testimonials FOR INSERT
  WITH CHECK (status = 'pending');

CREATE POLICY "Authenticated users can manage testimonials"
  ON public.testimonials FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 7. Social Links Policies
CREATE POLICY "Visible social links are readable by public"
  ON public.social_links FOR SELECT
  USING (is_visible = true OR auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage social links"
  ON public.social_links FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 8. Site Settings Policies
CREATE POLICY "Site settings are readable by public"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage site settings"
  ON public.site_settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- INITIAL SEED DATA (Based on Habib's real identity & visual materials)
-- ==============================================================================

DO $$
DECLARE
  v_profile_id UUID;
  v_page_id UUID;
  v_cat_ai UUID;
  v_cat_ads UUID;
  v_client_ajwad UUID;
BEGIN
  -- 1. Insert Profile
  IF NOT EXISTS (SELECT 1 FROM public.profiles) THEN
    INSERT INTO public.profiles (
      full_name_ar, full_name_en,
      title_ar, title_en,
      bio_ar, bio_en,
      clients_count, projects_count, experience_years
    ) VALUES (
      'حبيب الرحمن', 'Habib AL-Rahman',
      'خبير التسويق الرقمي وبناء العلامات التجارية', 'Founder & CEO at Seven B | AI & Marketing Specialist',
      'Founder & CEO at Seven B | Generative AI & Digital Marketing Specialist | Media Buying | AI Video • Creative Ads • Automation | Arabic Tutor for non-native speakers',
      'Founder & CEO at Seven B | Generative AI & Digital Marketing Specialist | Media Buying | AI Video • Creative Ads • Automation | Arabic Tutor for non-native speakers',
      50, 100, 5
    ) RETURNING id INTO v_profile_id;

    -- Profile Social Links
    INSERT INTO public.social_links (owner_type, owner_id, platform, label_ar, label_en, url, sort_order) VALUES
      ('profile', v_profile_id, 'linkedin', 'LinkedIn', 'LinkedIn', 'https://linkedin.com', 1),
      ('profile', v_profile_id, 'instagram', 'Instagram', 'Instagram', 'https://instagram.com', 2),
      ('profile', v_profile_id, 'facebook', 'Facebook', 'Facebook', 'https://facebook.com', 3);
  END IF;

  -- 2. Insert Categories
  INSERT INTO public.categories (name_ar, name_en, slug, sort_order) VALUES
    ('إعلانات الفيديو بالذكاء الاصطناعي', 'AI Video Ads', 'ai-video-ads', 1),
    ('تسويق رقمي وحملات إبداعية', 'Digital Marketing & Ads', 'digital-marketing', 2),
    ('هويات وعلامات تجارية', 'Brand Identity', 'brand-identity', 3)
  ON CONFLICT (slug) DO NOTHING;

  SELECT id INTO v_cat_ai FROM public.categories WHERE slug = 'ai-video-ads' LIMIT 1;

  -- 3. Insert Brand / Page (Habib AI)
  IF NOT EXISTS (SELECT 1 FROM public.portfolio_pages WHERE name_ar = 'Habib AI') THEN
    INSERT INTO public.portfolio_pages (
      name_ar, name_en,
      specialization_ar, specialization_en,
      description_ar, description_en,
      primary_url, sort_order
    ) VALUES (
      'Habib AI', 'Habib AI',
      'Habib AI | AI Video Ads', 'Habib AI | AI Video Ads',
      'بنحوّل منتجك لإعلان فيديو سينمائي بالـ AI' || E'\n' || 'فكرة + Storyboard + تنفيذ + مونتاج' || E'\n' || 'للبراندات والمطاعم والعقارات',
      'We transform your product into a cinematic AI video ad: Concept + Storyboard + Execution + Editing for brands, restaurants, and real estate.',
      'https://instagram.com', 1
    ) RETURNING id INTO v_page_id;

    -- Page Social Links
    INSERT INTO public.social_links (owner_type, owner_id, platform, label_ar, label_en, url, sort_order) VALUES
      ('page', v_page_id, 'tiktok', 'TikTok', 'TikTok', 'https://tiktok.com', 1),
      ('page', v_page_id, 'instagram', 'Instagram', 'Instagram', 'https://instagram.com', 2),
      ('page', v_page_id, 'facebook', 'Facebook', 'Facebook', 'https://facebook.com', 3);
  END IF;

  -- 4. Insert Client (أجواد)
  IF NOT EXISTS (SELECT 1 FROM public.clients WHERE name_ar = 'أجواد') THEN
    INSERT INTO public.clients (
      name_ar, name_en,
      profession_ar, profession_en,
      description_ar, description_en,
      sort_order
    ) VALUES (
      'أجواد', 'Ajwad',
      'منتجات غذائية وعلامة تجارية', 'Food & FMCG Brand',
      'حملات إعلانية سينمائية وفيديوهات ذكاء اصطناعي لمنتجات أجواد',
      'Cinematic AI ads and video production for Ajwad brand',
      1
    ) RETURNING id INTO v_client_ajwad;
  ELSE
    SELECT id INTO v_client_ajwad FROM public.clients WHERE name_ar = 'أجواد' LIMIT 1;
  END IF;

  -- 5. Insert Sample Featured Work (أعمالي - أجواد)
  IF NOT EXISTS (SELECT 1 FROM public.works WHERE title_ar = 'أعمالي ( أجواد )') THEN
    INSERT INTO public.works (
      title_ar, title_en,
      description_ar, description_en,
      category_id, client_id,
      media_type, media_url,
      thumbnail_url, is_featured, is_visible, sort_order
    ) VALUES (
      'أعمالي ( أجواد )', 'My Work ( Ajwad )',
      'إعلان فيديو سينمائي إبداعي لعلامة أجواد باستخدام أحدث تقنيات توليد الفيديو بالذكاء الاصطناعي.',
      'Cinematic AI video advertisement for Ajwad using state-of-the-art generative video models.',
      v_cat_ai, v_client_ajwad,
      'video',
      'https://assets.mixkit.co/videos/preview/mixkit-flying-through-clouds-to-a-city-41486-large.mp4',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
      true, true, 1
    );
  END IF;

  -- 6. Insert Default Site Settings
  IF NOT EXISTS (SELECT 1 FROM public.site_settings) THEN
    INSERT INTO public.site_settings (
      hero_visible, clients_visible, pages_visible, works_visible,
      testimonials_visible, testimonials_cta_visible, testimonials_limit,
      section_order
    ) VALUES (
      true, true, true, true, true, true, 6,
      '["hero", "clients", "pages", "works", "testimonials"]'::jsonb
    );
  END IF;
END $$;

-- ==============================================================================
-- STORAGE BUCKET (portfolio-media)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-media', 'portfolio-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for portfolio-media
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access for portfolio-media'
  ) THEN
    CREATE POLICY "Public Access for portfolio-media"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'portfolio-media');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated uploads for portfolio-media'
  ) THEN
    CREATE POLICY "Authenticated uploads for portfolio-media"
      ON storage.objects FOR ALL
      TO authenticated
      USING (bucket_id = 'portfolio-media')
      WITH CHECK (bucket_id = 'portfolio-media');
  END IF;
END $$;
