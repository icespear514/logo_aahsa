# Claude Code Project Brief
## AAHSA National Aboriginal Head Start — Logo Contest Web Application

**Prepared for:** Claude Code  
**Project owner:** My Data Vault (MSP) on behalf of AAHSA  
**Production URL:** https://contest.aahsa.ca  
**Stack:** Next.js · Supabase · Vercel · Microsoft 365 (SMTP via Resend or shared mailbox)

---

## 1. What We Are Building

A full-stack web application hosted at `contest.aahsa.ca` that runs a logo design contest for the **Alberta Aboriginal Head Start Association (AAHSA)**. The app has two distinct sides:

### Public Side — Submission Portal
Anyone can visit the site, upload a logo image, and enter their email address. No account or password required. After submitting, they receive a confirmation email. Multiple submissions from the same email address are allowed.

### Protected Side — Management Voting Portal
A restricted area where invited AAHSA staff log in with their own credentials to vote on submissions. Each manager selects up to 5 favourite logos. Votes are kept hidden from all voters until the contest owner (master admin) closes voting. Once voting closes, the master admin can activate a public winner announcement page.

---

## 2. Tech Stack & Services

| Layer | Service |
|---|---|
| Framework | **Next.js 14** (App Router) |
| Hosting | **Vercel** |
| Database + Auth + Storage | **Supabase** (fresh project, account exists) |
| Email | **Resend** (or Microsoft 365 shared mailbox SMTP) |
| Domain | `contest.aahsa.ca` — configure DNS CNAME to Vercel |
| Repo | GitHub (new repo, connect to Vercel for CI/CD) |

> Use Supabase Auth for all user management. Use Supabase Storage for logo image files. Use Supabase PostgreSQL for all data.

---

## 3. Branding & Design

Reference site: **https://www.aahsa.ca**

### Colour Palette
Extract and match the AAHSA website palette as closely as possible. From the site:
- Deep navy / dark teal header tones
- Warm earthy accent colours (ochre, burnt orange)
- Clean white backgrounds
- Indigenous-inspired warmth — avoid cold corporate blues or tech aesthetics

### Typography
- Use **Google Fonts** — choose a pairing that feels warm, community-oriented, and dignified. Suggested: a strong serif for headings, clean sans-serif for body.
- Avoid generic tech fonts (Inter, Roboto, system-ui)

### Tone & Feel
- Welcoming, community-focused, culturally respectful
- Not a startup or SaaS product — this is for Indigenous families and children's programs across Alberta
- Light theme throughout

### Logo / Identity
- Reference the AAHSA logo from their site in the header of the public submission page
- Use the text "National Aboriginal Head Start — Logo Contest" as the main page title
- Include a brief description: *"We are searching for a new logo to represent our national program. Submit your design below for a chance to have your artwork chosen."*

---

## 4. Database Schema (Supabase PostgreSQL)

### `profiles` table
Extends Supabase Auth `auth.users`.

```sql
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  role text not null default 'voter', -- 'master' | 'voter'
  invited_by uuid references profiles(id),
  created_at timestamptz default now()
);
```

### `submissions` table

```sql
create table submissions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  filename text not null,
  storage_path text not null,  -- Supabase Storage object path
  public_url text not null,
  submitted_at timestamptz default now(),
  is_winner boolean default false
);
```

### `votes` table

```sql
create table votes (
  id uuid primary key default gen_random_uuid(),
  voter_id uuid references profiles(id) on delete cascade,
  submission_id uuid references submissions(id) on delete cascade,
  created_at timestamptz default now(),
  unique(voter_id, submission_id)  -- one vote per submission per voter
);
```

### `contest_settings` table

```sql
create table contest_settings (
  id int primary key default 1,  -- singleton row
  voting_open boolean default true,
  winner_page_active boolean default false,
  updated_at timestamptz default now()
);

-- Insert the singleton row on setup:
insert into contest_settings (id) values (1);
```

### Row Level Security (RLS)

Enable RLS on all tables. Key policies:

- `submissions`: public INSERT (no auth required), authenticated SELECT for managers
- `votes`: INSERT/SELECT only for authenticated users on their own rows; votes are not readable by other voters until `voting_open = false`
- `profiles`: users can read/update their own row; master admin can read all
- `contest_settings`: readable by all authenticated users; writable only by master role

---

## 5. Supabase Storage

- Create a bucket called `logos`
- Set bucket to **public** so uploaded images can be served via public URL
- Max file size: **5MB**
- Accepted MIME types: `image/png`, `image/jpeg`, `image/webp`, `image/gif`, `image/svg+xml`
- Storage path format: `logos/{submission_id}/{filename}`

---

## 6. Application Routes (Next.js App Router)

```
/                        → Public submission page
/success                 → Post-submission thank you page
/winner                  → Public winner announcement (only visible when winner_page_active = true)
/admin                   → Redirect to /admin/login or /admin/dashboard
/admin/login             → Supabase Auth sign-in page
/admin/dashboard         → Voting grid (authenticated voters + master)
/admin/results           → Vote tallies, leaderboard (authenticated, visible only after voting_open = false)
/admin/settings          → Master admin only: manage voters, open/close voting, activate winner page
/admin/invite            → Master admin only: invite new voters by email
```

---

## 7. Feature Specifications

### 7.1 Public Submission Page (`/`)

- Display AAHSA branding, contest title, brief description
- Form fields:
  - Email address (required, validated)
  - File upload (drag-and-drop + click-to-browse)
    - Accepted: PNG, JPG, JPEG, WebP, GIF, SVG
    - Max size: 5MB
    - Show image preview after selection
- On submit:
  1. Upload image to Supabase Storage (`logos/` bucket)
  2. Insert row into `submissions` table
  3. Send confirmation email to submitter (see Section 9)
  4. Redirect to `/success`
- Same email can submit multiple times — no restriction
- No login, no CAPTCHA

### 7.2 Success Page (`/success`)

- Simple branded thank-you message
- "Submit another design" link back to `/`

### 7.3 Public Winner Page (`/winner`)

- Only renders content when `contest_settings.winner_page_active = true`
- If not active: show a friendly "Check back soon" message — do NOT expose that a winner exists yet
- When active: display the winning logo image large, submitter's email (or just first name if parseable), and a congratulations message
- Fetch the submission where `is_winner = true`

### 7.4 Admin Login (`/admin/login`)

- Supabase Auth email + password sign-in
- "Forgot password" link (Supabase handles reset email)
- On success, redirect to `/admin/dashboard`
- If not authenticated, all `/admin/*` routes redirect here

### 7.5 Voting Dashboard (`/admin/dashboard`)

- Grid of all submission cards showing:
  - Logo image thumbnail
  - Submitter email
  - Submission date/time
  - Whether the current voter has favourited it (star indicator)
- Each voter can select **up to 5 favourites**
- Clicking a card toggles the favourite on/off
- Saving is explicit: "Save My Votes" button — do NOT auto-save on click
- If `voting_open = false`: show a read-only view, voting controls disabled, message "Voting has closed."
- Votes from other voters are **never shown** on this page regardless of voting status

### 7.6 Results Page (`/admin/results`)

- Only accessible when `voting_open = false` OR user is master admin
- Leaderboard sorted by total vote count descending
- Show: rank, logo thumbnail, submitter email, total votes, bar chart relative to leader
- Winner spotlight at top if `is_winner = true` is set on any submission
- Master admin has a "Declare Winner" button next to each entry — sets `is_winner = true` on that submission

### 7.7 Settings Page (`/admin/settings`) — Master Admin Only

**Contest Controls:**
- Toggle: Open / Close Voting (`voting_open`)
- Toggle: Activate Winner Page (`winner_page_active`) — only enable after a winner is declared
- Current status displayed clearly

**Voter Management:**
- List of all voters (email, role, date joined)
- "Invite New Voter" button → opens invite form (see 7.8)
- Remove voter button (soft delete — removes from profiles, Supabase auth user remains)

### 7.8 Invite Flow (`/admin/invite`)

- Master admin enters an email address
- System sends a Supabase Auth invite email (use `supabase.auth.admin.inviteUserByEmail()`)
- Invited user receives email with a magic link
- On first sign-in, they are prompted to set a password
- Their profile is created with `role = 'voter'`
- Master admin role: seed manually via Supabase dashboard or a setup script — do NOT expose a "make me master" UI

---

## 8. Authentication & Roles

Use **Supabase Auth** with email + password.

### Roles

| Role | Access |
|---|---|
| `master` | All admin pages, settings, invite voters, declare winner, activate winner page |
| `voter` | Dashboard (vote), Results (after voting closed) |

### How to Assign Master Role

- After the first user signs up (the My Data Vault admin), manually set their `role = 'master'` in the Supabase dashboard
- OR create a one-time setup script: `scripts/seed-master.ts` that sets master role for a given email
- Do NOT build a UI for role escalation

### Middleware

Use Next.js middleware (`middleware.ts`) to:
- Protect all `/admin/*` routes — redirect to `/admin/login` if no active session
- Protect settings routes further — redirect non-master users to `/admin/dashboard`

---

## 9. Email Configuration

### Confirmation Email (to submitter)

**Trigger:** After successful submission insert  
**From:** A shared mailbox on Microsoft 365, e.g. `contest@aahsa.ca`  
**Method:** Use **Resend** with the Microsoft 365 domain, OR configure SMTP credentials as Vercel env vars and use Nodemailer  
**Subject:** `Your logo submission has been received — AAHSA Logo Contest`  
**Body (plain text + HTML):**

```
Thank you for submitting your logo design to the National Aboriginal Head Start Logo Contest!

We have received your submission and our team will be reviewing all entries.

Submitted: {filename}
Date: {submitted_at formatted}

We will be in touch if your design is selected.

— The AAHSA Team
contest@aahsa.ca
```

Implement email sending as a **Next.js API Route** (`/api/send-confirmation`) called server-side after the upload completes.

---

## 10. Environment Variables

Create a `.env.local` file (never commit this). Vercel env vars should be configured in the Vercel dashboard.

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # server-side only, never expose to client

# Email (choose one method)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=contest@aahsa.ca

# OR if using SMTP directly:
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=contest@aahsa.ca
SMTP_PASS=your_mailbox_password
```

---

## 11. Project Structure

```
/
├── app/
│   ├── page.tsx                    # Public submission form
│   ├── success/page.tsx            # Thank you page
│   ├── winner/page.tsx             # Public winner page
│   └── admin/
│       ├── login/page.tsx
│       ├── dashboard/page.tsx      # Voting grid
│       ├── results/page.tsx        # Leaderboard
│       ├── settings/page.tsx       # Master admin controls
│       └── invite/page.tsx         # Invite voter
├── api/
│   └── send-confirmation/route.ts  # Email API route
├── components/
│   ├── SubmissionForm.tsx
│   ├── LogoCard.tsx
│   ├── Leaderboard.tsx
│   ├── VoterList.tsx
│   └── ui/                         # Shared UI components
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser Supabase client
│   │   └── server.ts               # Server Supabase client (service role)
│   ├── email.ts                    # Email sending helper
│   └── roles.ts                    # Role check helpers
├── middleware.ts                   # Auth protection for /admin/*
├── .env.local                      # Never commit
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # All CREATE TABLE + RLS + policies
└── scripts/
    └── seed-master.ts              # One-time script to set first master admin
```

---

## 12. Supabase Setup Steps (for Claude Code to execute)

1. Create Supabase project (done manually by project owner)
2. Run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor
3. Create Storage bucket `logos` — set to public
4. Enable Email Auth in Supabase Auth settings
5. Configure Supabase Auth email templates for invite and password reset to use AAHSA branding
6. Configure `SITE_URL` in Supabase Auth settings to `https://contest.aahsa.ca`

---

## 13. Vercel Deployment

1. Push repo to GitHub
2. Import GitHub repo in Vercel
3. Set all environment variables in Vercel dashboard (see Section 10)
4. Set root directory to `/` (or wherever Next.js app lives)
5. Framework preset: **Next.js**
6. Custom domain: add `contest.aahsa.ca`, then add a CNAME record at the domain registrar pointing to Vercel's provided value

---

## 14. What NOT to Build

- No public gallery of all submissions (voting is internal only)
- No social sharing features
- No payment processing
- No submission deadline logic (open-ended; admin closes manually)
- No automatic winner notification (handled manually by AAHSA staff)
- No mobile app — responsive web only

---

## 15. Acceptance Criteria

- [ ] Anyone can submit a logo + email at `contest.aahsa.ca` without creating an account
- [ ] Submitters receive a branded confirmation email
- [ ] Master admin can invite voters by email; voters set their own password
- [ ] Each voter can log in and select up to 5 favourite logos
- [ ] Voters cannot see other voters' selections at any time during open voting
- [ ] Master admin can close voting; results page becomes visible to all authenticated users after close
- [ ] Master admin can declare a winner and activate the public winner page
- [ ] Public winner page is invisible (shows placeholder) until activated
- [ ] All `/admin/*` routes redirect to login if unauthenticated
- [ ] Settings and invite pages are inaccessible to voter-role users
- [ ] All uploaded images are served from Supabase Storage public URLs
- [ ] App is deployed to `contest.aahsa.ca` via Vercel with automatic deploys from GitHub main branch
- [ ] Responsive on mobile and desktop

---

## 16. Notes for Claude Code

- Use **TypeScript** throughout
- Use **Tailwind CSS** for styling — match AAHSA colour palette
- Use the **Supabase SSR package** (`@supabase/ssr`) for Next.js App Router compatibility, not the legacy `@supabase/auth-helpers-nextjs`
- All database writes that happen server-side (invite, declare winner, toggle settings) must use the **service role key** via the server Supabase client — never expose the service role key to the browser
- The `SUPABASE_SERVICE_ROLE_KEY` must only ever be used in Server Components, API Routes, or Server Actions — never in client components
- Use **Server Actions** or **API Routes** for form submissions — avoid client-side Supabase inserts for anything sensitive
- Image uploads can be done client-side directly to Supabase Storage using the anon key (this is acceptable since the bucket is public and we want direct uploads without proxying large files through Vercel)
- Add proper loading states and error handling on all forms
- The public submission page must work without JavaScript disabled? No — JS required is fine
- Test the invite flow end-to-end before handing off
