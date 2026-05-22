# AAHSA Logo Contest — Design Spec
**Date:** 2026-05-21  
**Project:** National Aboriginal Head Start Logo Contest Web Application  
**Owner:** My Data Vault (MSP) on behalf of AAHSA  
**Stack:** Next.js 14 · Supabase · Vercel · Resend

---

## Architecture

Next.js 14 App Router deployed on Vercel. Supabase provides PostgreSQL database, Auth (email+password + invite flow), and Storage (public `logos` bucket). All sensitive server-side operations use a service-role Supabase client; the browser uses only the anon key.

Build order: scaffold → migration SQL → Supabase clients → middleware → env vars → features.

### Key files
- `lib/supabase/client.ts` — browser Supabase client (anon key)
- `lib/supabase/server.ts` — server Supabase client (service role key)
- `middleware.ts` — protects `/admin/*`, enforces master-only on `/admin/settings` and `/admin/invite`
- `lib/roles.ts` — helper to read session user role
- `supabase/migrations/001_initial_schema.sql` — all tables, RLS, policies, singleton contest row
- `scripts/seed-master.ts` — one-time script to elevate first user to master role

---

## Database Schema

Four tables: `profiles`, `submissions`, `votes`, `contest_settings`.

- `profiles` extends `auth.users`; role is `'master'` or `'voter'`
- `submissions` stores email, filename, storage path, public URL, winner flag
- `votes` enforces unique(voter_id, submission_id); max 5 per voter enforced application-side
- `contest_settings` is a singleton row (id=1) with `voting_open` and `winner_page_active` booleans

RLS enabled on all tables:
- `submissions`: public INSERT, authenticated SELECT
- `votes`: INSERT/SELECT only own rows; other voters' votes hidden while `voting_open = true`
- `profiles`: own row read/write; master reads all
- `contest_settings`: all authenticated can read; only master can write

---

## Auth & Security Model

- Supabase Auth email+password for all admin users
- Invite: master triggers `supabase.auth.admin.inviteUserByEmail()` via Server Action (service role, server-side only)
- Profile row created on invite with `role = 'voter'`; master role set manually via Supabase dashboard or seed script
- Middleware enforces session on all `/admin/*`; additionally checks `role = 'master'` for settings and invite routes
- Public submission page: zero auth — anon client for direct upload, Server Action for DB insert + email trigger
- `SUPABASE_SERVICE_ROLE_KEY` never exposed to browser

---

## Feature Routes

| Route | Access | Behaviour |
|---|---|---|
| `/` | Public | Upload form → Storage → DB insert → confirmation email → redirect `/success` |
| `/success` | Public | Thank-you message, link back to `/` |
| `/winner` | Public | Shows winner when `winner_page_active = true`; "Check back soon" otherwise |
| `/admin/login` | Unauthenticated | Supabase sign-in; redirects to `/admin/dashboard` on success |
| `/admin/dashboard` | voter + master | Logo grid, up to 5 favourites, explicit "Save My Votes" button |
| `/admin/results` | voter (after voting closed) + master always | Leaderboard sorted by votes, "Declare Winner" button (master only) |
| `/admin/settings` | master only | Toggle `voting_open` / `winner_page_active`, manage voter list |
| `/admin/invite` | master only | Invite voter by email via Supabase admin API |

---

## Submission Flow (Public)

1. User fills email + file upload (drag-and-drop or click; PNG/JPG/WebP/GIF/SVG; max 5MB)
2. Client-side: upload file directly to Supabase Storage `logos/{submission_id}/{filename}`
3. Server Action: insert row into `submissions` with storage path and public URL
4. Server Action calls `/api/send-confirmation` to send Resend email to submitter
5. Redirect to `/success`

Multiple submissions from same email are allowed. No login, no CAPTCHA.

---

## Voting Flow (Admin)

- Dashboard shows all submissions as cards (thumbnail, email, date, star if favourited by current voter)
- Voter selects up to 5 favourites; UI prevents selecting a 6th
- Votes saved only on explicit "Save My Votes" button click
- If `voting_open = false`: read-only view, controls disabled, banner shown
- Other voters' selections never visible regardless of voting state

---

## Results & Winner

- Results page accessible to all authenticated users once `voting_open = false`; master can access anytime
- Leaderboard: rank, thumbnail, email, vote count, relative bar chart
- Master clicks "Declare Winner" → sets `is_winner = true` on submission via Server Action
- Master activates winner page in Settings → sets `winner_page_active = true`
- Public `/winner` page fetches `is_winner = true` submission; displays large logo + congratulations

---

## Email

- **Confirmation email:** `/api/send-confirmation/route.ts` using Resend SDK
- From: `contest@aahsa.ca`
- Subject: `Your logo submission has been received — AAHSA Logo Contest`
- Body: plain text + HTML with filename, date, AAHSA sign-off
- **Auth emails** (invite, password reset): Supabase Auth handles automatically; configure SMTP or Resend in Supabase dashboard and apply AAHSA branding to templates

---

## Storage

- Bucket: `logos` (public)
- Max file size: 5MB
- Accepted MIME types: image/png, image/jpeg, image/webp, image/gif, image/svg+xml
- Path: `logos/{submission_id}/{filename}`
- Client-side direct upload using anon key (acceptable; bucket is public, avoids proxying large files through Vercel)

---

## Branding & Design

- Colour palette: deep navy/dark teal, warm ochre/burnt orange accents, white backgrounds
- Typography: Google Fonts — warm serif for headings, clean sans-serif for body (e.g. Playfair Display + Source Sans 3)
- Tone: welcoming, community-focused, culturally respectful — not SaaS/startup
- Header: AAHSA logo + "National Aboriginal Head Start — Logo Contest" title
- Light theme throughout; responsive on mobile and desktop

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
EMAIL_FROM=contest@aahsa.ca
```

---

## What Is NOT Built

- No public gallery of submissions
- No social sharing
- No payment processing
- No submission deadline logic
- No automatic winner notification
- No mobile app
- No "make me master" UI
