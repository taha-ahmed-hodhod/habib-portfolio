export type OwnerType = 'profile' | 'client' | 'page'
export type MediaType = 'image' | 'video' | 'document'
export type TestimonialStatus = 'pending' | 'approved' | 'rejected'

export interface Profile {
  id: string
  full_name_ar: string
  full_name_en: string
  title_ar: string
  title_en: string
  bio_ar: string
  bio_en: string
  avatar_url: string | null
  clients_count: number
  projects_count: number
  experience_years: number
  primary_website_url: string | null
  created_at?: string
  updated_at?: string
}

export interface Client {
  id: string
  name_ar: string
  name_en: string
  profession_ar?: string | null
  profession_en?: string | null
  logo_url: string | null
  description_ar?: string | null
  description_en?: string | null
  work_description_ar?: string | null
  work_description_en?: string | null
  website_url?: string | null
  project_url?: string | null
  sort_order: number
  is_visible: boolean
  created_at?: string
  updated_at?: string
}

export interface PortfolioPage {
  id: string
  name_ar: string
  name_en: string
  specialization_ar?: string | null
  specialization_en?: string | null
  image_url: string | null
  description_ar?: string | null
  description_en?: string | null
  primary_url: string | null
  sort_order: number
  is_visible: boolean
  created_at?: string
  updated_at?: string
}

export interface Category {
  id: string
  name_ar: string
  name_en: string
  slug: string
  sort_order: number
  is_visible: boolean
  created_at?: string
}

export interface Work {
  id: string
  title_ar: string
  title_en: string
  description_ar?: string | null
  description_en?: string | null
  category_id: string | null
  category?: Category
  client_id?: string | null
  client?: Client
  media_type: MediaType
  media_url: string
  thumbnail_url?: string | null
  project_url?: string | null
  is_featured: boolean
  is_visible: boolean
  sort_order: number
  created_at?: string
  updated_at?: string
}

export interface Testimonial {
  id: string
  client_name_ar: string
  client_name_en: string
  profession_ar?: string | null
  profession_en?: string | null
  avatar_url?: string | null
  content_ar: string
  content_en: string
  rating?: number | null
  status: TestimonialStatus
  sort_order: number
  is_visible: boolean
  created_at?: string
}

export interface SocialLink {
  id: string
  owner_type: OwnerType
  owner_id: string
  platform: string
  label_ar?: string | null
  label_en?: string | null
  url: string
  icon?: string | null
  sort_order: number
  is_visible: boolean
  show_in_hero?: boolean
  show_in_footer?: boolean
  created_at?: string
}

export interface SiteSettings {
  id: string
  hero_visible: boolean
  clients_visible: boolean
  pages_visible: boolean
  works_visible: boolean
  testimonials_visible: boolean
  testimonials_cta_visible: boolean
  testimonials_limit: number
  section_order: string[] // e.g. ['hero', 'clients', 'pages', 'works', 'testimonials']
  updated_at?: string
}
