# 🎬 Habib Al-Rahman — Dynamic Portfolio CMS

A premium, production-ready, dynamic bilingual portfolio and Content Management System (CMS) built for **Habib Al-Rahman**, Generative AI Specialist, Digital Marketer, and Creative Ads Producer.

---

## 🌟 Key Highlights & Overview

- **Dynamic-First Architecture:** 100% of portfolio content (profile, works, clients, sub-brands, dynamic links, testimonials, and site settings) is powered by Supabase. Zero hardcoded production data.
- **Bilingual by Design:** Native Arabic (RTL) and English (LTR) with instant language switching and graceful fallback.
- **Cinematic Dark Aesthetic:** Strict dark neutral foundation (`#050505` to `#151515`) with subtle violet/purple accents (`#8B5CF6`), ambient glow, and interactive particle starfield background.
- **Full Media Support:** Seamless handling of **Cinematic Videos** (auto-play on hover/viewport), **High-Res Images**, and **Digital Documents** (PDF, Word, Excel).
- **Authenticated Admin CMS:** Secure admin dashboard for managing all content, approving reviews, and toggling visibility without writing a line of code.
- **Session Persistence:** Persistent authentication state ensuring uninterrupted management across browser sessions.

---

## 🚀 Live Demo & Repository Structure

```text
├── Public Portfolio (/)           → High-end showcase for clients, partners & visitors
├── Fullscreen Viewers (/work/:id) → In-depth work details & document downloads
├── Authenticated CMS (/dashboard) → Complete CRUD management for all site content
└── Auth Gate (/login)             → Secure login with auto-session detection
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Core** | React 19, TypeScript, Vite 8 |
| **Styling** | Tailwind CSS v4, Modern CSS Logical Properties (`dir="rtl"` / `dir="ltr"`) |
| **Backend & Database** | Supabase (PostgreSQL 17, Row Level Security, Realtime Subscriptions) |
| **Authentication** | Supabase Auth (Session Persistence, Token Auto-Refresh) |
| **Storage** | Supabase Storage (`portfolio-media` bucket: videos, images, thumbnails, documents) |
| **Routing** | React Router v7 |
| **Internationalization** | i18next, react-i18next (Arabic RTL & English LTR) |
| **Icons & UI** | Lucide React, Custom UI Primitives, Motion |

---

## 🏗️ Architecture & Folder Structure

```text
Habib Portfolio/
├── src/
│   ├── assets/              # Static branding and assets
│   ├── components/
│   │   ├── media/           # MediaUploader (drag-and-drop file upload with preview)
│   │   ├── shared/          # Navbar, Footer, EntityLinksEditor
│   │   └── ui/              # Button, Card, Badge, Modal, Skeleton, Starfield
│   ├── features/
│   │   ├── clients/         # Clients & partners showcase
│   │   ├── hero/            # Hero section with animated avatar & count-up stats
│   │   ├── pages/           # Sub-brands & digital platforms
│   │   ├── testimonials/    # Testimonials section & client submission modal
│   │   └── works/           # Featured works, category filter, modal & video cards
│   ├── hooks/               # useSocialLinks, useTheme, etc.
│   ├── i18n/                # Translation dictionaries (ar.json, en.json)
│   ├── layouts/
│   │   ├── DashboardLayout  # Authenticated CMS layout with sidebar navigation
│   │   └── PublicLayout     # Public layout with Starfield, Navbar & Footer
│   ├── lib/                 # supabase.ts, utils.ts
│   ├── pages/
│   │   ├── dashboard/       # CMS Pages (Overview, Profile, Works, Clients, Pages, etc.)
│   │   └── public/          # Public Pages (HomePage, WorkDetailPage, LoginPage)
│   ├── routes/              # AppRoutes & ProtectedRoute guard
│   ├── services/            # dataSync, storageService, linksService
│   └── types/               # TypeScript interfaces & database schemas
└── supabase/
    └── migrations/          # Version-controlled SQL migration scripts
```

---

## ⚡ Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm**
- **Supabase Account** with project configured

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/habib-portfolio.git
cd habib-portfolio

# Install dependencies
npm install
```

### 3. Environment Variables Setup
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Database Setup & Migrations
Execute the SQL migrations located in `supabase/migrations/` sequentially inside your **Supabase Dashboard → SQL Editor**:
1. `001_initial_schema.sql` — Tables, relationships, RLS, and storage bucket configuration.
2. `002_enable_realtime.sql` — Realtime replication for instant CMS data synchronization.
3. `003_client_works_and_link_placements.sql` — Placement flags for hero/footer links and work relations.
4. `004_add_document_media_type.sql` — Extended check constraint to support `document` media types.

### 5. Running the Project
```bash
# Start local development server
npm run dev

# Run type check
npx tsc --noEmit

# Build for production
npm run build
```

---

## 📋 Features Walkthrough

### 1. Public Portfolio
- **Hero Section:**
  - Glowing halo border animation surrounding profile avatar.
  - Viewport count-up numbers for Projects, Clients, and Years Experience.
  - Dynamic social links with platform-specific branding.
- **Featured Works Showcase:**
  - Multi-format support: **Cinematic Videos**, **High-Res Images**, and **Documents**.
  - Desktop: Video autoplays on hover; Mobile: IntersectionObserver-based muted play.
  - Horizontal swipeable categories on mobile with hidden scrollbar.
  - Modal lightbox and dedicated detail pages (`/work/:id`).
- **Clients & Partners:**
  - Partner branding cards with delivered services breakdown and direct links.
- **Sub-Brands & Digital Platforms:**
  - Highlights platforms such as *Seven B*, *Habib AI*, etc.
- **Testimonials & Public Review Submission:**
  - Visitors can submit reviews via an interactive modal (`SubmitReviewModal`).
  - Submissions are held in `pending` status until approved from the CMS.
- **Responsive Footer:**
  - Social media icons, navigation links, and developer credit (*Taha Ahmed*).

### 2. Admin Dashboard (CMS)
- **Dashboard Overview:** Live metric counts and quick navigation shortcuts.
- **Profile Manager:** Update bio, name, statistics, and profile image.
- **Works Manager:** Add, edit, reorder, or delete works; upload videos, images, or documents with custom poster covers.
- **Categories Manager:** Manage portfolio categories dynamically.
- **Clients & Brands Manager:** Add client entities, descriptions, and logos.
- **Sub-Brands (Pages) Manager:** Manage sub-platforms and custom entity links.
- **Testimonials Manager:** Review, approve, reject, or delete submitted feedback.
- **Dynamic Links Manager:** Universal links system supporting any social platform with hero/footer visibility toggles.
- **Site Settings:** Toggle section visibility and manage site settings.

---

## 🔄 Recent Updates & Changelog

### Version 1.1.0 Updates
- **Session Persistence:**
  - Configured persistent session handling in `src/lib/supabase.ts` with `localStorage` token storage.
  - Added automatic redirect from `/login` to `/dashboard` when an active session already exists.
  - Updated Navbar action CTA to link directly to `/dashboard` with seamless route guard handling.
- **Media Types Expansion (Images & Documents):**
  - Added dedicated badges for **Image** (`صورة / Image`) and **Document** (`مستند / Document`) in `WorksSection`.
  - Added **Document (`document`)** media type support across database schema, storage service, media uploader, and detail modals.
  - Support for uploading and viewing PDFs, Word, Excel, and presentations (up to 30MB) with download actions.
  - Created database migration `004_add_document_media_type.sql`.
- **Mobile Categories UX:**
  - Replaced wrapping category buttons with a sleek, horizontal touch-scrolling row (`overflow-x-auto no-scrollbar`).
  - Centered on desktop, seamlessly swipeable on mobile.
- **Responsive Navbar & Layout Fixes:**
  - Adjusted header breakpoints to `hidden lg:flex` for desktop navigation to eliminate right-side overflow on tablets and English mode.
  - Responsive header height (`h-16 sm:h-20`).
  - Added mobile & tablet drawer navigation menu.
  - Enforced `overflow-x: hidden` and `max-width: 100%` across `html, body`, and sections to prevent horizontal scroll bleed.
- **Bilingual Fallbacks:**
  - Added automatic fallback to Arabic text for Sub-Brands and Clients when viewing in English if English fields are not filled.
  - Removed outdated `Powered by AI` badges for cleaner card aesthetics.
- **Footer Author Credit:**
  - Added developer attribution to **Taha Ahmed** with portfolio link.

---

## 🔒 Security & Performance Best Practices

- **Row Level Security (RLS):** All Supabase tables enforce RLS. Unauthenticated visitors can only read published (`is_visible: true`) content and approved testimonials.
- **Storage Protection:** Only authenticated users can upload or delete media files.
- **Media Optimization:** Videos are lazy-loaded and muted; image thumbnails prevent large payload transfers on initial page load.
- **Type Safety:** 100% TypeScript coverage with zero compiler errors (`tsc --noEmit`).

---

## 📄 License & Credits

- **Owner:** Habib Al-Rahman
- **Developed & Designed By:** [Taha Ahmed](https://my-portfolio-two-gamma-xa2fur93st.vercel.app/#/)
- **Year:** © 2026 All Rights Reserved.
