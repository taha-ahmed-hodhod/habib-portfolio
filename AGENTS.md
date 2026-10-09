# AGENTS.md

## Project: Habib Al-Rahman — Dynamic Portfolio CMS

You are working on a production-ready personal portfolio CMS for **Habib Al-Rahman**, a digital marketer and AI video creator.

This project has two major surfaces:

1. **Public Portfolio** — premium, dark, animated, bilingual portfolio.
2. **Admin Dashboard** — authenticated CMS used to manage all public content.

Backend services are provided by **Supabase**:
- PostgreSQL database
- Supabase Auth
- Supabase Storage
- Row Level Security (RLS)

---

# 1. Core Product Rules

### Dynamic-first

Nothing that belongs to portfolio content should be hardcoded in production.

The following must come from Supabase:

- Profile data
- Bio
- Job title
- Statistics
- Dynamic links
- Clients
- Client projects
- Pages / brands
- Work categories
- Works
- Images
- Videos
- Video thumbnails
- Testimonials
- Homepage section visibility
- Homepage section order
- General site settings

Static UI labels can be translated locally through i18n.

### CMS principle

The Admin Dashboard is the source of truth for public content.

Flow:

```text
Admin Dashboard
      ↓
Supabase
      ↓
Public Portfolio
```

Do not create fake CRUD flows or mock production data.

---

# 2. Technology

Use:

- React
- Vite
- TypeScript
- Tailwind CSS
- Supabase
- React Router
- i18next / react-i18next
- Motion
- React Hook Form
- Zod
- Lucide React

Prefer current stable versions and keep dependencies compatible.

---

# 3. Architecture Rules

Use a feature-oriented architecture.

Preferred structure:

```text
src/
├── app/
├── assets/
├── components/
│   ├── ui/
│   ├── shared/
│   └── media/
├── features/
│   ├── profile/
│   ├── clients/
│   ├── pages/
│   ├── works/
│   ├── categories/
│   ├── testimonials/
│   ├── links/
│   └── settings/
├── layouts/
│   ├── PublicLayout.tsx
│   └── DashboardLayout.tsx
├── pages/
│   ├── public/
│   └── dashboard/
├── hooks/
├── services/
├── lib/
│   ├── supabase.ts
│   └── utils.ts
├── i18n/
├── types/
└── routes/
```

Do not create giant components.

Prefer:

- reusable components
- feature-specific hooks
- service functions for Supabase operations
- typed entities
- schema validation
- clear separation between UI and data access

---

# 4. Design Direction

## Main visual identity

The website should be predominantly black / near-black.

Primary background:

```text
#050505
```

Secondary surfaces:

```text
#0B0B0B
#101010
#151515
```

Borders:

```text
#242424
#303030
```

Main text:

```text
#F5F5F5
```

Muted text:

```text
#9B9B9B
```

Primary accent:

```text
#8B5CF6
```

Secondary accent:

```text
#A78BFA
```

Use the accent mainly for:

- CTA buttons
- active states
- subtle gradients
- animated borders
- focus states
- highlights
- important statistics

Do not make the whole interface purple.

The majority of the visual surface must remain black / dark neutral.

## Visual mood

Target:

- Premium
- Creative
- Modern
- Minimal
- Cinematic
- Professional
- High-end personal brand

Avoid:

- generic SaaS dashboard appearance
- excessive glassmorphism
- excessive gradients
- excessive rounded cards
- rainbow colors
- unnecessary shadows
- animation everywhere

---

# 5. Public Website

Required sections:

1. Hero
2. Clients
3. Pages / Brands
4. Featured Works
5. Testimonials
6. Footer

Section visibility and order must be configurable from Dashboard.

---

# 6. Hero

Hero must contain:

- profile image
- animated border around image
- name
- job title
- bilingual bio
- primary website button
- dynamic external/social links
- statistics

Profile image should have a premium animated frame.

Statistics:

- Clients
- Projects
- Years Experience

Use count-up animation when the statistics enter the viewport.

---

# 7. Dynamic Links

Never create fixed database columns such as:

```text
instagram_url
youtube_url
facebook_url
linkedin_url
```

Instead use a generic links system.

A link should support:

- label
- URL
- icon
- visibility
- sort order
- owner_type (`profile` | `page`)
- owner_id

A user may add any platform or URL:

- Instagram
- YouTube
- LinkedIn
- TikTok
- Behance
- Dribbble
- X
- GitHub
- WhatsApp
- Website
- custom links

There must always be support for a primary website link.

### Dynamic Links Rules:
- **Strict Owner Isolation**: Links belong to specific owners (`owner_type = 'profile'` for personal links; `owner_type = 'page'` for sub-brands/pages). The Hero and Footer consume only `owner_type = 'profile'` links.
- **Zero Static Fallbacks**: Never render hardcoded fallback social links (e.g., hardcoded LinkedIn or Instagram). While querying Supabase, display dark animated skeletons. If no links exist in the database, render nothing.
- **Direct Contacts**: Dedicated direct contact links (Phone with `tel:` and Email with `mailto:`) in Footer maintain strict `dir="ltr"` text direction.


---

# 8. Clients

Clients are database entities.

Each client may contain:

- name
- profession / industry
- image
- description
- primary website
- dynamic links
- project URL
- visibility
- sort order

Client list must be unlimited.

---

# 9. Pages / Brands

Pages / brands are separate from clients.

Each page may contain:

- image
- name
- specialization
- description
- primary URL
- dynamic links
- visibility
- sort order

---

# 10. Works

Works are the main portfolio content.

Each work contains:

- title
- description
- category
- media type
- media URL
- thumbnail URL
- project URL
- optional client relationship
- visibility
- featured state
- sort order

Media types:

```text
image
video
```

Categories are fully dynamic and manageable from Dashboard.

---

# 11. Media Storage

Never store binary images/videos inside PostgreSQL.

Use Supabase Storage.

Recommended structure:

```text
portfolio-media/
├── profile/
├── clients/
├── pages/
├── works/
│   ├── images/
│   ├── videos/
│   └── thumbnails/
```

Database stores metadata and URLs only.

Example:

```text
media_type = video
media_url = ...
thumbnail_url = ...
```

Use unique file names.

Do not expose unnecessary private storage paths.

---

# 12. Video UX & Media Lazy Loading

Media elements (images and videos) must not load all at once on initial page load.

Works cards video behavior:
- Works cards must not mount `<video>` or trigger network buffering upfront.
- Use `IntersectionObserver` with an advance margin (`rootMargin: '300px'`). Only mount the `<video>` element when approaching the viewport or upon hover.
- Keep card media lightweight with lazy thumbnail posters until in view.
- Images across all public sections (Clients logos, Pages avatars) must use native `loading="lazy"`.

Desktop behavior:

```text
hover card
    ↓
load/play muted video
    ↓
mouse leaves
    ↓
pause
```

Mobile behavior:

```text
video enters viewport
    ↓
play muted
    ↓
video leaves viewport
    ↓
pause
```

Videos should use:

- muted
- playsInline
- appropriate preload strategy
- thumbnail/poster
- lazy loading via IntersectionObserver

Never autoplay with sound.

---

# 13. Fullscreen Work Viewer & Cinematic Video Player

Each work can be opened in a fullscreen/lightbox viewer (`WorkModal`).

### Custom Cinematic Player Requirements:
Never use the default browser video controls for works. The player must be a bespoke cinematic dark player:
- **Design & Mood**: Seamless `#050505` background, `#8B5CF6` glow and accents, ambient backdrop glow.
- **Controls & Interaction**:
  - Auto-hiding control bar on mouse inactivity (2.5 seconds timeout).
  - Center glassmorphism play/pause toggle with smooth fade animations.
  - Custom scrubbable progress bar with real buffer indicator and hover thumb.
  - Precise timestamp counter (`mm:ss / mm:ss`).
  - Interactive volume slider with quick mute toggle.
  - Skip forward/backward ±10 seconds.
  - Playback speed switcher (`1x`, `1.25x`, `1.5x`, `2x`).
  - Native fullscreen toggle button.
  - Full keyboard shortcuts: Space (play/pause), Left/Right Arrows (seek ±5s), Up/Down Arrows (volume ±10%), M (mute), F (fullscreen), Escape (close modal).
- Body scroll locking when open.
- Keyboard accessible and smooth open/close animations.

Also provide a dedicated Work Details page:

```text
/work/:id
```


---

# 14. Testimonials

Testimonials contain:

- name
- profession
- optional avatar
- review
- optional rating
- status
- sort order

Statuses:

```text
pending
approved
rejected
```

User-submitted testimonials must never appear publicly before approval.

---

# 15. Dashboard

Dashboard navigation:

```text
Overview
Profile
Clients
Pages / Brands
Works
  └── Categories
Testimonials
Links
Settings
Logout
```

Dashboard should feel like part of the same premium product, but remain highly usable.

### Dashboard Skeletons:
All dashboard manager pages (Overview, Profile, Clients, Pages, Works, Categories, Testimonials, Links) must render dedicated dark skeleton loaders while Supabase queries are in flight. Never render blank pages, abrupt layout shifts, or raw placeholder content while data is loading.

---

# 16. Authentication & Account Security

Use Supabase Auth.

Required route:

```text
/login
```

Protected dashboard routes must redirect unauthenticated users to login.

Do not rely only on frontend route guards.

Supabase RLS is mandatory.

### Account Security:
The Admin must be able to update their account password directly and securely from the Dashboard Settings (`SettingsManagerPage`) via `supabase.auth.updateUser`.


---

# 17. Security

Use RLS for all database tables where appropriate.

Public users may read only content intended to be public.

Only authenticated/authorized admin users can:

- create
- update
- delete
- approve testimonials
- change settings
- manage media metadata

Never put Supabase service-role keys in frontend code.

Only public/anon credentials belong in the browser.

---

# 18. Bilingual Support

Languages:

```text
ar
en
```

Arabic:

```text
RTL
```

English:

```text
LTR
```

Direction must be applied at the document/application level.

Do not manually flip every component.

Use logical CSS properties where possible:

- margin-inline
- padding-inline
- inset-inline
- text alignment based on direction

All user-facing content that needs translation should have Arabic and English values.

Example:

```text
title_ar
title_en

description_ar
description_en
```

---

# 19. Accessibility

Must support:

- semantic HTML
- keyboard navigation
- visible focus states
- alt text
- accessible buttons
- accessible forms
- Escape to close modals
- reduced-motion preference where practical
- sufficient color contrast

---

# 20. Performance

Prioritize:

- lazy images
- responsive image sizing
- video thumbnails
- lazy video loading
- IntersectionObserver
- route-level code splitting where useful
- avoid unnecessary re-renders
- avoid loading all media at once

The homepage must remain fast even with many works.

---

# 21. UI States

Every async operation must have:

- loading state
- success state
- error state
- empty state

Use skeletons where appropriate.

Never leave a blank screen during loading.

### Loading Guidelines:
- Both public sections and dashboard pages must use custom dark skeleton placeholders matching exact content dimensions.
- Never show hardcoded fallback content or dummy links while data is loading. If data is absent, render empty rather than mock data.


---

# 22. Forms

Use:

- React Hook Form
- Zod

Validate:

- required fields
- URLs
- file types
- reasonable file size limits
- bilingual content where required

Show clear validation messages.

---

# 23. Upload UX

File upload components should support:

- drag & drop
- file picker
- preview
- upload progress
- replacement
- deletion
- validation
- error messages

Images and videos must have appropriate validation.

---

# 24. Animations

Use Motion.

Preferred animation types:

- fade
- slide
- scale
- stagger
- reveal
- subtle parallax where useful
- border/glow motion
- button micro-interactions
- modal transitions
- count-up

Animation should communicate hierarchy.

Do not animate everything.

Respect reduced motion preferences.

---

# 25. SEO & Social Media Link Previews

Implement robust SEO & Open Graph protocol:

- Open Graph & Twitter Card tags must be statically present in `index.html`'s `<head>` to ensure non-JS crawlers (WhatsApp, Facebook, Twitter, Telegram, LinkedIn) capture rich previews.
- Preview Image: High-contrast 1200 × 630px raster image (`/og-image.png`) with absolute HTTPS URL. Never use relative or localhost paths.
- Canonical URLs must resolve to the verified production domain (`https://habib-portfolio-gamma.vercel.app/`).
- Dynamic SEO: Use `useSEO` hook to update `document.title` and meta tags during client-side SPA navigation.
- Semantic HTML and descriptive image alt tags.

---

# 26. Error Handling

Never silently fail.

Supabase errors must be caught and translated into useful UI messages.

Do not expose raw internal errors to public users.

Log useful technical information during development.

---

# 27. Code Quality

Before considering a phase complete:

- TypeScript must compile
- lint must pass
- no obvious console errors
- routes must work
- loading/error states exist
- responsive behavior checked
- RTL checked
- authentication checked
- Supabase queries typed and safe

Do not move to the next major phase while the current phase is fundamentally broken.

---


---

# Supabase Project Rules

## Project Identity

The Supabase project for this application is:

```text
Project Name:
Habib Portfolio
```

Before any database-related work, use Supabase MCP to verify that the connected project is actually `Habib Portfolio`.

Never assume the connected Supabase project is correct.

### Required preflight

1. Inspect the connected Supabase project using Supabase MCP.
2. Confirm the project name is `Habib Portfolio`.
3. Retrieve and verify the project reference ID.
4. Inspect the current database schema.
5. Inspect existing tables, columns, relationships, indexes, RLS policies, and storage buckets where relevant.
6. Compare the actual Supabase state with `PLAN.md`.

If the connected project does not match:

```text
Habib Portfolio
```

STOP and ask the user for confirmation.

---

# Supabase MCP Usage

Use Supabase MCP for:

- project discovery
- project verification
- schema inspection
- table inspection
- column inspection
- relationship inspection
- RLS/policy inspection
- storage inspection
- database verification
- debugging/log inspection where supported

The repository remains the source of truth for intended schema changes.

Supabase MCP must not replace version-controlled SQL migrations.

---

# SQL Generation and Execution Policy

For:

- tables
- columns
- relationships
- indexes
- RLS policies
- triggers
- functions
- storage configuration
- other database changes

the default workflow is:

```text
Supabase MCP inspection
        ↓
Schema design
        ↓
Generate SQL migration
        ↓
Save SQL inside repository
        ↓
Show/explain exact SQL to user
        ↓
User executes it in Supabase SQL Editor
        ↓
Verify with Supabase MCP
```

Do not directly modify the database for schema changes unless the user explicitly asks you to execute the change.

Never hide important database operations from the user.

---

# Migration Files

All intended database changes must be represented as version-controlled SQL files.

Preferred structure:

```text
supabase/
└── migrations/
    ├── 001_initial_schema.sql
    ├── 002_rls_policies.sql
    ├── 003_storage.sql
    └── ...
```

Use descriptive migration names.

Keep migrations focused and logically separated.

---

# SQL Editor Instructions

Whenever a database migration is created, tell the user exactly where to execute it:

```text
Supabase Dashboard
→ Habib Portfolio
→ SQL Editor
→ New Query
→ Open/copy the generated migration
→ Run
```

Also explain briefly:

- what the SQL creates
- what it changes
- whether it is safe/reversible
- whether it affects existing data

The complete SQL must remain available as a file in the repository.

---

# Destructive Database Changes

Before generating or executing destructive operations such as:

```sql
DROP TABLE
DROP COLUMN
TRUNCATE
DELETE
```

or destructive schema changes:

1. STOP.
2. Explain the impact.
3. Ask for explicit user confirmation.

Never destroy existing data automatically.

---

# Development vs Production

Prefer:

```text
Development Supabase
        ↑
   Antigravity MCP
        ↓
Versioned SQL migrations
        ↓
Review
        ↓
Production
```

Do not make uncontrolled schema changes directly against Production.

---

# Database Verification

After the user confirms that a migration was executed, use Supabase MCP to verify:

- tables
- columns
- foreign keys
- indexes
- RLS
- policies
- triggers
- functions
- storage buckets

Compare the actual Supabase state with the intended migration.

If there is a mismatch, report it before continuing.

---

# Required Supabase Report

For every major database phase, report:

### Supabase Project

```text
Project: Habib Portfolio
Project Ref: <verified project ref>
```

### Current State

List relevant existing tables and configuration.

### Proposed Changes

Explain what will be added or modified.

### SQL Migration

Give the migration file path and make the complete SQL available for review.

### Execution

Tell the user to run it in:

```text
Supabase Dashboard
→ Habib Portfolio
→ SQL Editor
```

### Verification

After execution, verify the result through Supabase MCP.

# 28. Working Rules for Antigravity

Before modifying existing code:

1. Inspect the current project.
2. Understand the architecture.
3. Read AGENTS.md and PLAN.md.
4. Identify the smallest safe change.
5. Implement.
6. Validate.
7. Update PLAN.md progress if the phase is actually completed.

Do not rewrite working systems without a reason.

Do not install packages unnecessarily.

Do not replace the architecture simply because another approach is fashionable.

When requirements are ambiguous, prefer the existing project decisions documented in this file and PLAN.md.

---

# 29. Definition of Done

A feature is complete only when:

- UI works
- database integration works
- validation works
- loading state works
- error state works
- mobile works
- desktop works
- Arabic works
- English works
- RTL/LTR works
- permissions are respected
- no critical console errors exist

