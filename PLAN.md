# PLAN.md

# Habib Al-Rahman Portfolio CMS — Execution Plan

## Mission

Build a production-ready, dynamic, bilingual portfolio CMS for Habib Al-Rahman.

The product consists of:

```text
PUBLIC PORTFOLIO
       +
ADMIN DASHBOARD
       +
SUPABASE
```

Visual direction:

> Predominantly black / near-black, premium creative aesthetic, restrained purple accent, cinematic media presentation, smooth professional animations.

---

# Phase 0 — Project Discovery

## Goal

Understand the existing repository before changing anything.

### Tasks

- [x] Inspect repository structure.
- [x] Inspect package.json.
- [x] Inspect existing source files.
- [x] Identify current React/Vite/Tailwind setup.
- [x] Check whether TypeScript is already configured.
- [x] Check existing routing.
- [x] Check existing linting.
- [x] Check environment variable strategy.
- [x] Check whether Supabase is already configured.

### Deliverable

A short architecture assessment (Documented in PROJECT_ACHEVE.md).

### Gate

[x] Repository analyzed and understood before writing code.

---

# Phase 1 — Foundation

## Goal

Create a clean application foundation.

### Tasks

- [x] Configure React + TypeScript.
- [x] Configure Tailwind.
- [x] Configure routing.
- [x] Configure base styles.
- [x] Configure fonts.
- [x] Configure i18n.
- [x] Configure dark visual tokens.
- [x] Create PublicLayout.
- [x] Create DashboardLayout.
- [x] Create shared UI primitives.

### Initial design tokens

```text
Background:
#050505

Surface:
#0B0B0B
#101010
#151515

Border:
#242424
#303030

Text:
#F5F5F5

Muted:
#9B9B9B

Accent:
#8B5CF6
#A78BFA
```

### Gate

[x] Application starts successfully, builds cleanly, and base routes render.

---

# Phase 2 — Supabase Infrastructure

## Goal

Connect the project to Supabase correctly.

### Tasks

- [x] Create Supabase client.
- [x] Configure environment variables.
- [x] Create database migration structure.
- [x] Create storage buckets definition.
- [x] Configure storage paths.
- [x] Configure RLS strategy.
- [ ] Configure authentication.

### Storage

```text
portfolio-media/
├── profile/
├── clients/
├── pages/
└── works/
    ├── images/
    ├── videos/
    └── thumbnails/
```

### Gate

[x] Supabase connection is working without exposing service-role secrets.

---


---

# Supabase Database Execution Protocol

Every database phase follows this workflow.

## Step 1 — Inspect

Use Supabase MCP.

Verify:

```text
Project Name = Habib Portfolio
```

Retrieve the project reference and inspect the current schema.

Do not modify anything during this discovery step.

---

## Step 2 — Compare

Compare:

```text
AGENTS.md
+
PLAN.md
+
Current Supabase Schema
```

Identify existing resources and missing resources.

---

## Step 3 — Design

Design the required database changes.

Do not assume the database is empty.

Avoid duplicating existing tables or policies.

---

## Step 4 — Generate SQL

Create a version-controlled migration under:

```text
supabase/migrations/
```

Example:

```text
001_initial_schema.sql
```

The migration must contain the complete SQL required for the phase.

---

## Step 5 — Present to User

Antigravity must report:

```text
I prepared the database migration.

File:
supabase/migrations/001_initial_schema.sql

Execute it here:

Supabase Dashboard
→ Habib Portfolio
→ SQL Editor
→ New Query
→ Open/copy the migration
→ Run
```

It must summarize what the SQL does before asking the user to execute it.

---

## Step 6 — User Execution

The user executes the SQL manually in Supabase SQL Editor.

Do not assume the migration was executed until the user confirms it or Supabase MCP verifies the resulting state.

---

## Step 7 — Verify

After execution, use Supabase MCP to verify:

- tables
- columns
- relationships
- indexes
- RLS
- policies
- triggers
- storage

---

## Step 8 — Continue

Only after successful verification should the next database-dependent phase begin.

---

# Phase 0.5 — Supabase Discovery and Verification

## Goal

Connect Antigravity to the correct Supabase project before building the database.

### Tasks

- [x] Connect Supabase MCP.
- [x] Find project named `Habib Portfolio`.
- [x] Verify project reference.
- [x] Inspect current database.
- [x] Inspect current storage.
- [x] Inspect current RLS policies.
- [x] Do not modify the database.

### Deliverable

A short Supabase discovery report containing:

```text
Project Name: Habib Portfolio
Project Ref: bothlrvqhgremnyqtazh
Existing Tables: Clean
Existing Storage: Clean
Existing RLS: Prepared in 001_initial_schema.sql
Potential Conflicts: None
```

### Gate

[x] The connected project confirmed as Habib Portfolio (`bothlrvqhgremnyqtazh`).

---

# Phase 3 — Database Schema

Before implementing this phase, execute the Supabase Database Execution Protocol above.

### Required workflow

```text
Inspect
→ Design
→ Generate migration
→ User reviews SQL
→ User executes SQL in SQL Editor
→ MCP verification
→ Phase complete
```

Do not mark the phase complete immediately after generating the SQL.

# Phase 3 — Database Schema

## Goal

Create the production database.

## Core tables

```text
profiles
clients
portfolio_pages
categories
works
testimonials
social_links
site_settings
```

Potential supporting table:

```text
media
```

only if justified by the final implementation.

---

## Required relationships

```text
categories
    ↓
works

clients
    ↓
works (optional relationship)

profile
    ↓
social_links

client
    ↓
social_links

portfolio_page
    ↓
social_links
```

---

## Content localization

Where required:

```text
title_ar
title_en

description_ar
description_en
```

Do not over-normalize translations unless there is a clear reason.

---

## Gate

Database migrations apply cleanly.

Relationships and indexes are documented.

RLS policies are created.

---

# Phase 4 — Authentication

## Goal

Secure the Admin Dashboard.

### Tasks

- [x] Build login page.
- [x] Connect Supabase Auth.
- [x] Build auth state handling.
- [x] Protect dashboard routes.
- [x] Handle logout.
- [x] Handle unauthorized access.
- [x] Configure RLS.

### Routes

```text
/login

/dashboard
/dashboard/profile
/dashboard/clients
/dashboard/pages
/dashboard/works
/dashboard/works/categories
/dashboard/testimonials
/dashboard/settings
```

### Gate

[x] Unauthenticated users cannot access admin functionality.

---

# Phase 5 — Dashboard Shell

## Goal

Build the reusable Dashboard experience.

### UI

Sidebar:

```text
Overview
Profile
Clients
Pages
Works
Categories
Testimonials
Links
Settings
Logout
```

### Requirements

- [x] Responsive sidebar
- [x] Mobile navigation
- [x] active route state
- [x] page header
- [x] breadcrumbs where useful
- [x] reusable tables
- [x] reusable forms
- [x] modal system
- [x] toast notifications
- [x] confirmation dialogs

### Gate

[x] All dashboard routes render correctly.

---

# Phase 6 — Profile Management

## Goal

Allow Habib to manage his identity.

### Editable fields

- Profile image
- Name AR
- Name EN
- Job title AR
- Job title EN
- Bio AR
- Bio EN
- Clients count
- Projects count
- Experience years
- Primary website
- Dynamic links

### Media

Profile image uploads to Supabase Storage.

### Gate

Changing profile data in Dashboard changes the Public Portfolio.

---

# Phase 7 — Dynamic Links System

## Goal

Create one reusable links system.

### Requirements

Each link:

```text
label
url
icon
sort_order
is_visible
owner_type
owner_id
```

### Features

- add
- edit
- delete
- reorder
- show/hide

### Must support

Any platform or custom URL.

Do not hardcode social platforms.

### Gate

Same component/system can be reused for:

- profile
- clients
- pages

---

# Phase 8 — Clients CMS

## Goal

Create complete client management.

### CRUD

- Create client
- Read clients
- Edit client
- Delete client
- Reorder clients
- Hide/show clients

### Client fields

```text
name
profession
image
description
primary_url
project_url
sort_order
is_visible
```

Plus dynamic links.

### Gate

Client changes appear on Public Portfolio.

---

# Phase 9 — Pages / Brands CMS

## Goal

Manage pages/brands.

### Fields

```text
name
image
specialization
description
primary_url
sort_order
is_visible
```

Plus dynamic links.

### Gate

Pages can be created and managed without code changes.

---

# Phase 10 — Categories CMS

## Goal

Create fully dynamic work categories.

### Features

- create
- edit
- delete
- reorder
- hide/show

### Examples

```text
AI Videos
Marketing
Advertising
Social Media
Branding
Video Creation
```

These are examples only, not hardcoded categories.

### Gate

Adding a category from Dashboard immediately makes it available to Works.

---

# Phase 11 — Works CMS

## Goal

Build the main portfolio work manager.

### Work fields

```text
title_ar
title_en

description_ar
description_en

category_id

media_type
media_url
thumbnail_url

client_id (optional)

project_url

is_featured
is_visible
sort_order
```

### CRUD

- create
- edit
- delete
- reorder
- feature/unfeature
- hide/show

### Gate

A Work created in Dashboard appears correctly on the Public Portfolio.

---

# Phase 12 — Media Upload System

## Goal

Create production-quality image/video uploads.

### Image flow

```text
Select image
↓
Validate
↓
Preview
↓
Upload Supabase Storage
↓
Save URL
↓
Save metadata
```

### Video flow

```text
Select video
↓
Validate
↓
Preview
↓
Upload Supabase Storage
↓
Save video URL
↓
Save thumbnail URL
```

### Requirements

- file type validation
- size validation
- progress indicator
- upload error handling
- replacement
- deletion
- unique filenames

### Gate

No binary media is stored in PostgreSQL.

---

# Phase 13 — Public Hero

## Goal

Build premium landing experience.

### Content

- profile image
- animated image border
- name
- title
- bio
- primary CTA
- dynamic links
- animated statistics

### Animation

- reveal on load
- subtle image border animation
- count-up statistics
- button micro-interactions

### Gate

Hero is visually strong on desktop and mobile.

---

# Phase 14 — Public Clients Section

## Goal

Present clients as premium cards.

### Requirements

- responsive grid
- dynamic data
- image handling
- hover effects
- project CTA
- dynamic links

### Gate

Zero hardcoded client data.

---

# Phase 15 — Public Pages / Brands

## Goal

Present Habib's pages/brands.

### Requirements

- premium cards
- image
- name
- specialization
- description
- visit button
- dynamic links

### Gate

Visibility and ordering follow Dashboard configuration.

---

# Phase 16 — Public Featured Works

## Goal

Create the most visually impressive section.

### Requirements

- category filtering
- image/video cards
- thumbnail
- responsive media
- hover preview desktop
- viewport playback mobile
- fullscreen viewer
- work detail page
- project CTA

### Video behavior

Desktop:

```text
hover
→ play muted

leave
→ pause
```

Mobile:

```text
enter viewport
→ play muted

leave viewport
→ pause
```

### Gate

No unnecessary video loading.

---

# Phase 17 — Work Detail Page

## Route

```text
/work/:id
```

### Content

- hero media
- title
- description
- category
- client
- project link
- related works

### Gate

Deep links work correctly.

---

# Phase 18 — Testimonials CMS

## Goal

Manage customer reviews.

### Admin

- create
- edit
- approve
- reject
- delete
- reorder
- hide/show

### Public submission

If enabled:

```text
visitor
↓
testimonial form
↓
pending
↓
admin approval
↓
approved
↓
public
```

### Gate

Unapproved reviews never appear publicly.

---

# Phase 19 — Testimonials Public Section

## Requirements

- premium review cards
- optional avatar
- optional rating
- configurable number of visible reviews
- configurable "Tell Us Your Opinion" button

### Gate

Dashboard settings control the section.

---

# Phase 20 — Homepage Settings

## Goal

Give Habib control over the homepage without touching code.

### Settings

```text
Hero visibility
Clients visibility
Pages visibility
Works visibility
Testimonials visibility

Testimonial button visibility

Testimonials limit
```

### Section ordering

Implement drag-and-drop ordering:

```text
Hero
Clients
Pages
Works
Testimonials
Footer
```

Save order in database.

### Gate

Changing order in Dashboard changes Public Portfolio order.

---

# Phase 21 — Footer

## Requirements

- identity
- short description
- navigation
- primary website
- dynamic links
- copyright
- language switcher

### Gate

Footer is completely dynamic except static UI labels.

---

# Phase 22 — Arabic / English

## Goal

Complete bilingual experience.

### Arabic

```text
RTL
```

### English

```text
LTR
```

### Test

Check:

- navigation
- hero
- cards
- forms
- dashboard
- tables
- modals
- buttons
- animations
- media layouts

### Gate

No broken alignment or reversed interaction in either direction.

---

# Phase 23 — Dashboard Polish

## Improve

- empty states
- skeletons
- toast feedback
- confirmation dialogs
- keyboard navigation
- upload progress
- responsive tables
- mobile dashboard
- error boundaries where useful

### Gate

Dashboard feels like a real CMS product.

---

# Phase 24 — Performance

## Tasks

- lazy images
- responsive image sizing
- lazy video
- poster images
- IntersectionObserver
- code splitting
- remove unnecessary dependencies
- reduce unnecessary renders
- check bundle size

### Gate

No obvious performance bottleneck.

---

# Phase 25 — Accessibility

## Verify

- keyboard navigation
- focus states
- labels
- alt text
- modal accessibility
- Escape behavior
- contrast
- reduced motion

---

# Phase 26 — SEO

## Add

- page title
- description
- Open Graph metadata
- semantic headings
- clean URLs
- work-specific metadata where practical

---

# Phase 27 — Testing

## Test Public

- desktop
- tablet
- mobile
- Arabic
- English
- RTL
- LTR
- image works
- video works
- fullscreen
- work details
- links
- testimonials

## Test Dashboard

- login
- logout
- unauthorized access
- CRUD
- uploads
- validation
- delete confirmation
- reorder
- visibility
- settings

---

# Phase 28 — Production Review

Before completion:

```text
[ ] No hardcoded production content
[ ] Supabase connected
[ ] RLS enabled
[ ] Auth secure
[ ] Storage working
[ ] Image uploads working
[ ] Video uploads working
[ ] Video playback optimized
[ ] Arabic working
[ ] English working
[ ] RTL working
[ ] LTR working
[ ] Mobile polished
[ ] Desktop polished
[ ] Animations polished
[ ] Loading states complete
[ ] Error states complete
[ ] Empty states complete
[ ] SEO basics complete
[ ] Accessibility checked
[ ] No critical console errors
[ ] TypeScript passes
[ ] Lint passes
[ ] Production build passes
```

---

# Visual Direction

Use this as the visual north star:

```text
BACKGROUND
████████████████████
#050505

SURFACES
████████████████████
#0B0B0B / #101010

TEXT
████████████████████
#F5F5F5

MUTED
████████████████████
#9B9B9B

ACCENT
████████████████████
#8B5CF6

LIGHT ACCENT
████████████████████
#A78BFA
```

The majority of the interface should visually remain black.

Purple is an accent, not the primary background.

---

# Execution Rules

## Rule 1

Complete phases sequentially unless there is a technical dependency that requires another order.

## Rule 2

After each major phase:

1. run typecheck
2. run lint
3. run build when appropriate
4. manually verify the affected flow
5. update this PLAN.md

## Rule 3

Do not mark a phase complete just because code was written.

A phase is complete only when it is verified.

## Rule 4

Do not create fake functionality to make a phase appear complete.

## Rule 5

If a technical decision changes the architecture, document the decision in this file or a dedicated ADR.

## Rule 6

Do not move to visual polish before core data flows work.

## Rule 7

Do not sacrifice security for development speed.

## Rule 8

Do not sacrifice performance for visual effects.

---

# Final Product Definition

The final product should feel like:

```text
A premium creative personal brand website
+
A lightweight professional CMS
+
A secure Supabase backend
```

It must be easy for Habib to maintain without a developer.

The developer should only be required for:

- future feature development
- major design changes
- infrastructure changes
- architectural changes

Normal content management must happen entirely through the Dashboard.

---

# Addendum — Media Management, Immediate Sync & Dynamic Settings

### 1. Media Architecture
- **Supabase Storage Bucket:** `portfolio-media` (`public: true`).
- **Organized Folder Structure:**
  - `profile/` — Avatar and personal branding images.
  - `clients/` — Client and partner brand logos.
  - `pages/` — Dedicated sub-brand covers and icons (e.g., Habib AI).
  - `works/images/` — Work graphic designs and photos.
  - `works/videos/` — AI cinematic ads and video works.
  - `works/thumbnails/` — Video poster thumbnails.
  - `testimonials/` — Client review avatars.
- **Service Layer (`src/services/storageService.ts`):** Pre-upload MIME validation, file size limits (10MB for images, 100MB for videos), safe replacement flow, and orphan deletion.
- **UI Component (`src/components/media/MediaUploader.tsx`):** Drag & drop, file picker, video/image preview, real upload loading states, and error handling.

### 2. Immediate UI Synchronization
- **Architecture:** Dual-layer synchronization.
  1. **In-Memory Event Bus (`src/services/dataSync.ts`):** Zero-latency same-session SPA updates upon mutation success (no page refresh or route changes needed).
  2. **Supabase Realtime:** Multi-tab and cross-session event propagation listening to Postgres changes.
- **Realtime Migration:** `supabase/migrations/002_enable_realtime.sql` prepared to add tables to `supabase_realtime` publication.

### 3. Testimonials Fix & Dynamic Settings
- **CTA Visibility:** The "شاركنا رأيك" button visibility is strictly driven by `testimonials_cta_visible` from `site_settings`.
- **Display Limit:** Respects `testimonials_limit` configured in the dashboard (with sensible fallbacks).

### 4. Zero Static Fallbacks & Strict Link Isolation
- **Rule:** Never render static fallback social links (e.g., hardcoded LinkedIn or Instagram).
- **Public Hero & Footer:** Fetch from `social_links` with `owner_type = 'profile'` and `is_visible = true`. While loading, display dark animated skeletons. If no links exist in DB, render empty.
- **Direct Contacts:** Direct phone (`+20 10 07430812`) and email (`habib650@gmail.com`) contact links in Footer retain strict `dir="ltr"` formatting.

### 5. Media Performance & Lazy Viewport Loading
- **Works Video Optimization:** Works cards do not mount `<video>` or start buffering media upfront. Cards utilize an `IntersectionObserver` with `rootMargin: '300px'`; only when near the viewport or hovered is the `<video>` element rendered and preloaded. Otherwise, only an optimized lazy thumbnail is loaded.
- **Images:** All client logos and brand images use native `loading="lazy"`.

### 6. Cinematic Custom Video Player (`WorkModal.tsx`)
- **Aesthetic:** Custom cinematic player matching brand tokens (`#050505` background, `#8B5CF6` accent, ambient glow backdrop).
- **Controls:**
  - Auto-hiding control bar on idle (2.5s mouse inactivity).
  - Scrubbable progress bar with buffer indicator and playhead thumb.
  - Digital timer `mm:ss / mm:ss`.
  - Volume slider and mute toggle.
  - Skip ±10s buttons.
  - Playback rate selector (`1x` to `2x`).
  - Fullscreen toggle.
  - Full keyboard accessibility (Space, Arrows, M, F, Escape).

### 7. Dashboard CMS Loading Skeletons & Account Security
- **Loading Skeletons:** All 8 dashboard manager pages (`Works`, `Clients`, `Pages`, `Categories`, `Testimonials`, `Links`, `Profile`, `Overview`) provide animated dark skeleton grids during Supabase async queries to prevent layout shifting and flash of placeholder data.
- **Account Security:** Admin password update flow directly in `SettingsManagerPage` via `supabase.auth.updateUser`.

