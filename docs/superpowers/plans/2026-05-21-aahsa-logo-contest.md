# AAHSA Logo Contest — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack logo contest web application for AAHSA — a public submission portal and a protected voting/management portal backed by Supabase and deployed to Vercel.

**Architecture:** Next.js 14 App Router on Vercel; Supabase handles PostgreSQL, Auth (email+password + invite), and Storage (public `logos` bucket); Resend sends transactional email. The browser uses the Supabase anon key for direct file uploads; all sensitive writes (invite, declare winner, toggle settings) go through Server Actions using the service role key. Middleware enforces session and role on all `/admin/*` routes.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, `@supabase/ssr`, `@supabase/supabase-js`, Resend, Vitest, Playfair Display + Source Sans 3 (Google Fonts)

---

## File Structure

```
app/
  layout.tsx                  Root layout — fonts, metadata
  globals.css                 Tailwind directives + CSS vars
  page.tsx                    Public submission page (Server Component wrapper)
  success/page.tsx            Thank-you page
  winner/page.tsx             Public winner announcement
  actions.ts                  All Server Actions ('use server')
  admin/
    layout.tsx                Admin shell layout (nav + sign-out)
    login/page.tsx            Supabase sign-in
    dashboard/
      page.tsx                Server Component — fetches submissions + votes
      DashboardClient.tsx     Client Component — interactive vote grid
    results/page.tsx          Leaderboard (Server Component)
    settings/
      page.tsx                Contest controls + voter list (Server Component)
      SettingsControls.tsx    Client Component — toggle switches for voting/winner
    invite/page.tsx           Invite voter form (Server Component)
  api/
    send-confirmation/route.ts  POST — sends Resend email
components/
  SubmissionForm.tsx          Client Component — file upload + email form
  LogoCard.tsx                Client Component — thumbnail card with star toggle
  Leaderboard.tsx             Server Component — ranked results list
  VoterList.tsx               Client Component — voter table with remove button
  ui/
    Button.tsx                Shared button
    Badge.tsx                 Role/status badge
lib/
  types.ts                    Shared TypeScript types + Database type
  supabase/
    client.ts                 Browser Supabase client (anon key)
    server.ts                 Server Supabase client (session-aware, anon key + cookies)
    service.ts                Service role client (bypasses RLS — server-only)
  roles.ts                    isMaster / isVoter / getRole helpers
  email.ts                    buildConfirmationEmail + sendConfirmationEmail
middleware.ts                 Auth + role enforcement for /admin/*
supabase/
  migrations/
    001_initial_schema.sql    All DDL + RLS + policies
scripts/
  seed-master.ts              One-time script to set master role
.env.local                    Placeholder env vars (never commit)
vitest.config.ts              Test config
```

---

## Task 1: Scaffold Next.js 14 project

**Files:**
- Create: all scaffolded files via `create-next-app`

- [ ] **Step 1: Run scaffolding command**

  Working directory: `C:\Users\MatthewPringle\OneDrive - My Data Vault Inc\Claude Projects\logo_aahsa`

  ```powershell
  npx create-next-app@14 . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --yes
  ```

  Expected: Next.js 14 project created with App Router, TypeScript, Tailwind, ESLint. If prompted about existing files, choose to overwrite `package.json` and config files but keep `AAHSA-Logo-Contest-Brief.md` and `docs/`.

- [ ] **Step 2: Install additional dependencies**

  ```powershell
  npm install @supabase/supabase-js @supabase/ssr resend
  npm install -D vitest @vitest/coverage-v8
  ```

- [ ] **Step 3: Verify install**

  ```powershell
  npm run build
  ```

  Expected: Build succeeds (may have unused page warnings — fine).

- [ ] **Step 4: Create vitest config**

  Create `vitest.config.ts`:

  ```typescript
  import { defineConfig } from 'vitest/config'
  import path from 'path'

  export default defineConfig({
    test: {
      environment: 'node',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  })
  ```

- [ ] **Step 5: Add test script to package.json**

  In `package.json`, add to `"scripts"`:
  ```json
  "test": "vitest run",
  "test:watch": "vitest"
  ```

- [ ] **Step 6: Commit**

  ```bash
  git init
  git add .
  git commit -m "chore: scaffold Next.js 14 project with TypeScript and Tailwind"
  ```

---

## Task 2: Configure Tailwind with AAHSA palette + Google Fonts

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`

- [ ] **Step 1: Extend tailwind.config.ts with AAHSA colors and font variables**

  Replace the entire contents of `tailwind.config.ts`:

  ```typescript
  import type { Config } from 'tailwindcss'

  const config: Config = {
    content: [
      './pages/**/*.{js,ts,jsx,tsx,mdx}',
      './components/**/*.{js,ts,jsx,tsx,mdx}',
      './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
      extend: {
        colors: {
          aahsa: {
            navy: '#1B3A5C',
            teal: '#2B6777',
            ochre: '#C4742A',
            orange: '#D4793A',
            cream: '#F8F4EF',
            warmGray: '#E8E0D5',
          },
        },
        fontFamily: {
          heading: ['var(--font-heading)', 'Georgia', 'serif'],
          body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        },
      },
    },
    plugins: [],
  }
  export default config
  ```

- [ ] **Step 2: Update globals.css**

  Replace the entire contents of `app/globals.css`:

  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  @layer base {
    body {
      @apply font-body text-aahsa-navy bg-white;
    }
    h1, h2, h3, h4, h5, h6 {
      @apply font-heading;
    }
  }
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add tailwind.config.ts app/globals.css
  git commit -m "chore: configure AAHSA colour palette and font families in Tailwind"
  ```

---

## Task 3: Create .env.local with placeholder values

**Files:**
- Create: `.env.local`
- Create: `.gitignore` entry (verify)

- [ ] **Step 1: Create .env.local**

  Create `.env.local` at the project root:

  ```env
  # Supabase — get these from your Supabase project settings > API
  NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

  # Resend — get this from resend.com > API Keys
  RESEND_API_KEY=re_your_resend_api_key
  EMAIL_FROM=contest@aahsa.ca
  ```

- [ ] **Step 2: Verify .gitignore covers .env.local**

  Check that `.gitignore` contains `.env.local`. If not, add it. `create-next-app` includes it by default.

- [ ] **Step 3: Commit**

  ```bash
  git add .gitignore
  git commit -m "chore: add .env.local placeholder (not committed)"
  ```

---

## Task 4: Database migration SQL

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Create migrations directory**

  ```powershell
  mkdir -p supabase/migrations
  ```

- [ ] **Step 2: Write migration file**

  Create `supabase/migrations/001_initial_schema.sql`:

  ```sql
  -- =============================================
  -- AAHSA Logo Contest — Initial Schema
  -- Run this in Supabase SQL Editor
  -- =============================================

  -- ─── TABLES ──────────────────────────────────

  create table if not exists profiles (
    id uuid references auth.users on delete cascade primary key,
    email text not null,
    role text not null default 'voter' check (role in ('master', 'voter')),
    invited_by uuid references profiles(id),
    created_at timestamptz default now()
  );

  create table if not exists submissions (
    id uuid primary key default gen_random_uuid(),
    email text not null,
    filename text not null,
    storage_path text not null,
    public_url text not null,
    submitted_at timestamptz default now(),
    is_winner boolean default false
  );

  create table if not exists votes (
    id uuid primary key default gen_random_uuid(),
    voter_id uuid references profiles(id) on delete cascade not null,
    submission_id uuid references submissions(id) on delete cascade not null,
    created_at timestamptz default now(),
    unique(voter_id, submission_id)
  );

  create table if not exists contest_settings (
    id int primary key default 1,
    voting_open boolean default true,
    winner_page_active boolean default false,
    updated_at timestamptz default now(),
    constraint singleton check (id = 1)
  );

  -- Seed singleton settings row
  insert into contest_settings (id) values (1) on conflict (id) do nothing;

  -- ─── ROW LEVEL SECURITY ───────────────────────

  alter table profiles enable row level security;
  alter table submissions enable row level security;
  alter table votes enable row level security;
  alter table contest_settings enable row level security;

  -- ─── PROFILES POLICIES ───────────────────────

  -- Users can read and update their own profile
  create policy "profiles: own read"
    on profiles for select
    using (auth.uid() = id);

  create policy "profiles: own update"
    on profiles for update
    using (auth.uid() = id);

  -- Master admin can read all profiles (checked server-side via service role)
  -- Service role bypasses RLS entirely — no extra policy needed.

  -- Profile is created via trigger on auth.users insert (see below)
  create policy "profiles: service role insert"
    on profiles for insert
    with check (true); -- only service role key reaches this; anon cannot insert

  -- ─── SUBMISSIONS POLICIES ────────────────────

  -- Anyone (including anonymous) can submit
  create policy "submissions: public insert"
    on submissions for insert
    with check (true);

  -- Authenticated users can view all submissions (for voting/results)
  create policy "submissions: authenticated select"
    on submissions for select
    using (auth.role() = 'authenticated');

  -- ─── VOTES POLICIES ──────────────────────────

  -- Voters can insert their own votes
  create policy "votes: own insert"
    on votes for insert
    with check (auth.uid() = voter_id);

  -- Voters can read their own votes (to show which ones they selected)
  create policy "votes: own select"
    on votes for select
    using (auth.uid() = voter_id);

  -- Voters can delete their own votes (for re-saving)
  create policy "votes: own delete"
    on votes for delete
    using (auth.uid() = voter_id);

  -- NOTE: Results page uses service role key to count all votes — bypasses RLS.

  -- ─── CONTEST SETTINGS POLICIES ───────────────

  -- All authenticated users can read settings
  create policy "contest_settings: authenticated read"
    on contest_settings for select
    using (auth.role() = 'authenticated');

  -- Public can read settings (needed for /winner page to check winner_page_active)
  create policy "contest_settings: public read"
    on contest_settings for select
    using (true);

  -- Only master role can update settings (enforced server-side via service role)
  -- Service role bypasses RLS; no update policy needed for anon/voter.

  -- ─── AUTO-CREATE PROFILE TRIGGER ─────────────

  create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
  as $$
  begin
    insert into public.profiles (id, email, role)
    values (new.id, new.email, 'voter')
    on conflict (id) do nothing;
    return new;
  end;
  $$;

  drop trigger if exists on_auth_user_created on auth.users;
  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

  -- ─── STORAGE POLICIES ────────────────────────────

  -- Allow anyone (including anonymous) to upload to the logos bucket.
  -- SubmissionForm does a client-side direct upload using the anon key.
  create policy "logos: anon insert"
    on storage.objects for insert
    with check (bucket_id = 'logos');

  -- Public read (bucket is public, but explicit policy ensures access)
  create policy "logos: public read"
    on storage.objects for select
    using (bucket_id = 'logos');

  -- ─── STORAGE BUCKET SETUP (do manually in Supabase dashboard) ─────

  -- 1. Create bucket named "logos", set to Public
  -- 2. Max file size: 5MB
  -- 3. Allowed MIME types: image/png, image/jpeg, image/webp, image/gif, image/svg+xml
  ```

- [ ] **Step 3: Verify SQL is valid**

  Copy the contents of `supabase/migrations/001_initial_schema.sql` and paste into the Supabase SQL Editor in your project. Run it. Expected: no errors, all tables created, trigger created.

- [ ] **Step 4: Commit**

  ```bash
  git add supabase/
  git commit -m "feat: add initial Supabase schema with RLS policies and auto-profile trigger"
  ```

---

## Task 5: TypeScript type definitions

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 1: Create lib directory and types file**

  ```powershell
  mkdir -p lib
  ```

  Create `lib/types.ts`:

  ```typescript
  export type Role = 'master' | 'voter'

  export type Profile = {
    id: string
    email: string
    role: Role
    invited_by: string | null
    created_at: string
  }

  export type Submission = {
    id: string
    email: string
    filename: string
    storage_path: string
    public_url: string
    submitted_at: string
    is_winner: boolean
  }

  export type Vote = {
    id: string
    voter_id: string
    submission_id: string
    created_at: string
  }

  export type ContestSettings = {
    id: number
    voting_open: boolean
    winner_page_active: boolean
    updated_at: string
  }

  export type SubmissionWithVotes = Submission & { votes: number }

  export type Database = {
    public: {
      Tables: {
        profiles: {
          Row: Profile
          Insert: Omit<Profile, 'created_at'>
          Update: Partial<Omit<Profile, 'id'>>
        }
        submissions: {
          Row: Submission
          Insert: Omit<Submission, 'submitted_at' | 'is_winner'>
          Update: Partial<Omit<Submission, 'id'>>
        }
        votes: {
          Row: Vote
          Insert: Omit<Vote, 'id' | 'created_at'>
          Update: never
        }
        contest_settings: {
          Row: ContestSettings
          Insert: Partial<ContestSettings>
          Update: Partial<Omit<ContestSettings, 'id'>>
        }
      }
    }
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add lib/types.ts
  git commit -m "feat: add shared TypeScript types and Database type for Supabase"
  ```

---

## Task 6: Supabase client utilities

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/service.ts`

- [ ] **Step 1: Create browser client**

  Create `lib/supabase/client.ts`:

  ```typescript
  import { createBrowserClient } from '@supabase/ssr'
  import type { Database } from '@/lib/types'

  export function createClient() {
    return createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  ```

- [ ] **Step 2: Create session-aware server client**

  Create `lib/supabase/server.ts`:

  ```typescript
  import { createServerClient } from '@supabase/ssr'
  import { cookies } from 'next/headers'
  import type { Database } from '@/lib/types'

  export function createClient() {
    const cookieStore = cookies()

    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Server Components cannot set cookies — safe to ignore
            }
          },
        },
      }
    )
  }
  ```

- [ ] **Step 3: Create service role client**

  Create `lib/supabase/service.ts`:

  ```typescript
  import { createClient as createSupabaseClient } from '@supabase/supabase-js'
  import type { Database } from '@/lib/types'

  // NEVER import this in client components. Server-side only.
  export function createServiceClient() {
    return createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  }
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add lib/supabase/
  git commit -m "feat: add Supabase browser, server, and service role clients"
  ```

---

## Task 7: Role helper library + tests

**Files:**
- Create: `lib/roles.ts`
- Create: `lib/roles.test.ts`

- [ ] **Step 1: Write failing tests**

  Create `lib/roles.test.ts`:

  ```typescript
  import { describe, it, expect } from 'vitest'
  import { isMaster, isVoter, getRole } from './roles'

  describe('isMaster', () => {
    it('returns true for master', () => expect(isMaster('master')).toBe(true))
    it('returns false for voter', () => expect(isMaster('voter')).toBe(false))
    it('returns false for null', () => expect(isMaster(null)).toBe(false))
    it('returns false for undefined', () => expect(isMaster(undefined)).toBe(false))
  })

  describe('isVoter', () => {
    it('returns true for voter', () => expect(isVoter('voter')).toBe(true))
    it('returns true for master (masters can also access voter areas)', () => expect(isVoter('master')).toBe(true))
    it('returns false for null', () => expect(isVoter(null)).toBe(false))
  })

  describe('getRole', () => {
    it('returns master for "master"', () => expect(getRole('master')).toBe('master'))
    it('returns voter for "voter"', () => expect(getRole('voter')).toBe('voter'))
    it('returns null for unknown string', () => expect(getRole('admin')).toBe(null))
    it('returns null for null', () => expect(getRole(null)).toBe(null))
    it('returns null for undefined', () => expect(getRole(undefined)).toBe(null))
  })
  ```

- [ ] **Step 2: Run tests — expect failure**

  ```powershell
  npx vitest run lib/roles.test.ts
  ```

  Expected: FAIL — `Cannot find module './roles'`

- [ ] **Step 3: Implement roles.ts**

  Create `lib/roles.ts`:

  ```typescript
  import type { Role } from '@/lib/types'

  export function isMaster(role: string | null | undefined): boolean {
    return role === 'master'
  }

  export function isVoter(role: string | null | undefined): boolean {
    return role === 'voter' || role === 'master'
  }

  export function getRole(role: string | null | undefined): Role | null {
    if (role === 'master' || role === 'voter') return role
    return null
  }
  ```

- [ ] **Step 4: Run tests — expect pass**

  ```powershell
  npx vitest run lib/roles.test.ts
  ```

  Expected: 9 tests pass.

- [ ] **Step 5: Commit**

  ```bash
  git add lib/roles.ts lib/roles.test.ts
  git commit -m "feat: add role helper utilities with tests"
  ```

---

## Task 8: Email helper + tests

**Files:**
- Create: `lib/email.ts`
- Create: `lib/email.test.ts`

- [ ] **Step 1: Write failing tests**

  Create `lib/email.test.ts`:

  ```typescript
  import { describe, it, expect } from 'vitest'
  import { buildConfirmationEmail } from './email'

  const sample = {
    to: 'artist@example.com',
    filename: 'my-logo-design.png',
    submittedAt: '2026-05-21T14:00:00Z',
  }

  describe('buildConfirmationEmail', () => {
    it('includes filename in plain text body', () => {
      const { text } = buildConfirmationEmail(sample)
      expect(text).toContain('my-logo-design.png')
    })

    it('includes filename in HTML body', () => {
      const { html } = buildConfirmationEmail(sample)
      expect(html).toContain('my-logo-design.png')
    })

    it('includes the contest name in plain text', () => {
      const { text } = buildConfirmationEmail(sample)
      expect(text).toContain('National Aboriginal Head Start Logo Contest')
    })

    it('returns non-empty subject', () => {
      const { subject } = buildConfirmationEmail(sample)
      expect(subject.length).toBeGreaterThan(0)
    })

    it('HTML contains AAHSA sign-off', () => {
      const { html } = buildConfirmationEmail(sample)
      expect(html).toContain('AAHSA Team')
    })
  })
  ```

- [ ] **Step 2: Run tests — expect failure**

  ```powershell
  npx vitest run lib/email.test.ts
  ```

  Expected: FAIL — module not found.

- [ ] **Step 3: Implement email.ts**

  Create `lib/email.ts`:

  ```typescript
  import { Resend } from 'resend'

  const resend = new Resend(process.env.RESEND_API_KEY)

  export type ConfirmationEmailData = {
    to: string
    filename: string
    submittedAt: string
  }

  export function buildConfirmationEmail(data: ConfirmationEmailData) {
    const { filename, submittedAt } = data
    const formattedDate = new Date(submittedAt).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Edmonton',
    })

    const subject = 'Your logo submission has been received — AAHSA Logo Contest'

    const text = `Thank you for submitting your logo design to the National Aboriginal Head Start Logo Contest!

We have received your submission and our team will be reviewing all entries.

Submitted: ${filename}
Date: ${formattedDate}

We will be in touch if your design is selected.

— The AAHSA Team
contest@aahsa.ca`

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${subject}</title></head>
<body style="font-family: Georgia, serif; color: #1B3A5C; max-width: 600px; margin: 0 auto; padding: 24px; background: #F8F4EF;">
  <div style="background: #1B3A5C; padding: 24px; border-radius: 8px 8px 0 0;">
    <h1 style="color: #F8F4EF; margin: 0; font-size: 22px;">National Aboriginal Head Start</h1>
    <p style="color: #C4742A; margin: 4px 0 0; font-size: 16px;">Logo Contest</p>
  </div>
  <div style="background: #fff; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #E8E0D5; border-top: none;">
    <h2 style="color: #C4742A;">Thank you for your submission!</h2>
    <p>Thank you for submitting your logo design to the <strong>National Aboriginal Head Start Logo Contest</strong>!</p>
    <p>We have received your submission and our team will be reviewing all entries.</p>
    <table style="margin: 20px 0; border-collapse: collapse;">
      <tr>
        <td style="padding: 6px 16px 6px 0; font-weight: bold; white-space: nowrap;">Submitted:</td>
        <td style="padding: 6px 0;">${filename}</td>
      </tr>
      <tr>
        <td style="padding: 6px 16px 6px 0; font-weight: bold; white-space: nowrap;">Date:</td>
        <td style="padding: 6px 0;">${formattedDate}</td>
      </tr>
    </table>
    <p>We will be in touch if your design is selected.</p>
    <hr style="border: none; border-top: 1px solid #E8E0D5; margin: 24px 0;">
    <p style="color: #666; font-size: 14px;">— The AAHSA Team<br><a href="mailto:contest@aahsa.ca" style="color: #C4742A;">contest@aahsa.ca</a></p>
  </div>
</body>
</html>`

    return { subject, text, html }
  }

  export async function sendConfirmationEmail(data: ConfirmationEmailData) {
    const { subject, text, html } = buildConfirmationEmail(data)
    return resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'contest@aahsa.ca',
      to: data.to,
      subject,
      text,
      html,
    })
  }
  ```

- [ ] **Step 4: Run tests — expect pass**

  ```powershell
  npx vitest run lib/email.test.ts
  ```

  Expected: 5 tests pass.

- [ ] **Step 5: Commit**

  ```bash
  git add lib/email.ts lib/email.test.ts
  git commit -m "feat: add email helper with Resend integration and HTML template"
  ```

---

## Task 9: Middleware — auth and role protection

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Create middleware.ts**

  Create `middleware.ts` at the project root:

  ```typescript
  import { createServerClient } from '@supabase/ssr'
  import { NextResponse } from 'next/server'
  import type { NextRequest } from 'next/server'

  export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
      request: { headers: request.headers },
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            response = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname

    // Redirect authenticated users away from login page
    if (path === '/admin/login') {
      if (user) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }
      return response
    }

    // Redirect /admin to /admin/dashboard
    if (path === '/admin') {
      if (!user) {
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }

    // Protect all other /admin/* routes
    if (path.startsWith('/admin/')) {
      if (!user) {
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }

      // Enforce master-only routes
      if (
        path.startsWith('/admin/settings') ||
        path.startsWith('/admin/invite')
      ) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile?.role !== 'master') {
          return NextResponse.redirect(new URL('/admin/dashboard', request.url))
        }
      }
    }

    return response
  }

  export const config = {
    matcher: ['/admin', '/admin/:path*'],
  }
  ```

- [ ] **Step 2: Verify TypeScript compiles**

  ```powershell
  npx tsc --noEmit
  ```

  Expected: No type errors.

- [ ] **Step 3: Commit**

  ```bash
  git add middleware.ts
  git commit -m "feat: add middleware for admin route auth and master-role enforcement"
  ```

---

## Task 10: Root layout with AAHSA branding

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update root layout with Google Fonts and metadata**

  Replace `app/layout.tsx`:

  ```tsx
  import type { Metadata } from 'next'
  import { Playfair_Display, Source_Sans_3 } from 'next/font/google'
  import './globals.css'

  const playfair = Playfair_Display({
    subsets: ['latin'],
    variable: '--font-heading',
    display: 'swap',
  })

  const sourceSans = Source_Sans_3({
    subsets: ['latin'],
    variable: '--font-body',
    display: 'swap',
  })

  export const metadata: Metadata = {
    title: 'AAHSA Logo Contest',
    description:
      'Submit your logo design for the National Aboriginal Head Start Logo Contest.',
  }

  export default function RootLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <html lang="en" className={`${playfair.variable} ${sourceSans.variable}`}>
        <body className="min-h-screen bg-aahsa-cream font-body text-aahsa-navy antialiased">
          {children}
        </body>
      </html>
    )
  }
  ```

- [ ] **Step 2: Verify build**

  ```powershell
  npm run build
  ```

  Expected: Build succeeds.

- [ ] **Step 3: Commit**

  ```bash
  git add app/layout.tsx
  git commit -m "feat: add root layout with AAHSA brand fonts and metadata"
  ```

---

## Task 11: Shared UI components

**Files:**
- Create: `components/ui/Button.tsx`
- Create: `components/ui/Badge.tsx`

- [ ] **Step 1: Create Button component**

  Create `components/ui/Button.tsx`:

  ```tsx
  import { ButtonHTMLAttributes } from 'react'

  type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

  type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant
    loading?: boolean
  }

  const variantClasses: Record<Variant, string> = {
    primary:
      'bg-aahsa-ochre text-white hover:bg-aahsa-orange focus-visible:ring-aahsa-ochre',
    secondary:
      'bg-aahsa-navy text-white hover:bg-aahsa-teal focus-visible:ring-aahsa-navy',
    ghost:
      'bg-transparent text-aahsa-navy border border-aahsa-navy hover:bg-aahsa-warmGray focus-visible:ring-aahsa-navy',
    danger:
      'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  }

  export function Button({
    variant = 'primary',
    loading = false,
    className = '',
    disabled,
    children,
    ...props
  }: Props) {
    return (
      <button
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {loading ? (
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : null}
        {children}
      </button>
    )
  }
  ```

- [ ] **Step 2: Create Badge component**

  Create `components/ui/Badge.tsx`:

  ```tsx
  type Variant = 'master' | 'voter' | 'open' | 'closed' | 'winner'

  const variantClasses: Record<Variant, string> = {
    master: 'bg-aahsa-ochre text-white',
    voter: 'bg-aahsa-teal text-white',
    open: 'bg-green-100 text-green-800',
    closed: 'bg-red-100 text-red-800',
    winner: 'bg-yellow-100 text-yellow-800',
  }

  export function Badge({
    variant,
    children,
  }: {
    variant: Variant
    children: React.ReactNode
  }) {
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]}`}
      >
        {children}
      </span>
    )
  }
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add components/ui/
  git commit -m "feat: add shared Button and Badge UI components"
  ```

---

## Task 12: Email API route + Server Actions

**Files:**
- Create: `app/api/send-confirmation/route.ts`
- Create: `app/actions.ts`

- [ ] **Step 1: Create email API route**

  Create `app/api/send-confirmation/route.ts`:

  ```typescript
  import { NextRequest, NextResponse } from 'next/server'
  import { sendConfirmationEmail } from '@/lib/email'

  export async function POST(request: NextRequest) {
    try {
      const body = await request.json()
      const { to, filename, submittedAt } = body

      if (!to || !filename || !submittedAt) {
        return NextResponse.json(
          { error: 'Missing required fields: to, filename, submittedAt' },
          { status: 400 }
        )
      }

      await sendConfirmationEmail({ to, filename, submittedAt })
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('[send-confirmation] Error:', error)
      return NextResponse.json(
        { error: 'Failed to send confirmation email' },
        { status: 500 }
      )
    }
  }
  ```

- [ ] **Step 2: Create Server Actions file**

  Create `app/actions.ts`:

  ```typescript
  'use server'

  import { revalidatePath } from 'next/cache'
  import { redirect } from 'next/navigation'
  import { createClient } from '@/lib/supabase/server'
  import { createServiceClient } from '@/lib/supabase/service'
  import { sendConfirmationEmail } from '@/lib/email'
  import { isMaster } from '@/lib/roles'

  // ─── Auth ─────────────────────────────────────

  export async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    redirect('/admin/login')
  }

  // ─── Submissions ──────────────────────────────

  export async function createSubmission(data: {
    submission_id: string
    email: string
    filename: string
    storage_path: string
    public_url: string
  }) {
    const service = createServiceClient()

    const { error } = await service.from('submissions').insert({
      id: data.submission_id,
      email: data.email,
      filename: data.filename,
      storage_path: data.storage_path,
      public_url: data.public_url,
    })

    if (error) return { error: error.message }

    // Fire confirmation email — don't block on it
    sendConfirmationEmail({
      to: data.email,
      filename: data.filename,
      submittedAt: new Date().toISOString(),
    }).catch((err) => console.error('[createSubmission] email failed:', err))

    return { success: true }
  }

  // ─── Votes ────────────────────────────────────

  export async function saveVotes(submissionIds: string[]) {
    if (submissionIds.length > 5) {
      return { error: 'You can select at most 5 favourites.' }
    }

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const service = createServiceClient()

    // Replace all votes atomically: delete then insert
    const { error: deleteError } = await service
      .from('votes')
      .delete()
      .eq('voter_id', user.id)

    if (deleteError) return { error: deleteError.message }

    if (submissionIds.length > 0) {
      const { error: insertError } = await service.from('votes').insert(
        submissionIds.map((submission_id) => ({
          voter_id: user.id,
          submission_id,
        }))
      )
      if (insertError) return { error: insertError.message }
    }

    revalidatePath('/admin/dashboard')
    return { success: true }
  }

  // ─── Results — Declare Winner ─────────────────

  async function assertMaster() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const service = createServiceClient()
    const { data: profile } = await service
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    return isMaster(profile?.role) ? user : null
  }

  export async function declareWinner(submissionId: string) {
    const user = await assertMaster()
    if (!user) return { error: 'Unauthorized' }

    const service = createServiceClient()

    // Clear any existing winner first
    await service
      .from('submissions')
      .update({ is_winner: false })
      .eq('is_winner', true)

    const { error } = await service
      .from('submissions')
      .update({ is_winner: true })
      .eq('id', submissionId)

    if (error) return { error: error.message }

    revalidatePath('/admin/results')
    return { success: true }
  }

  // ─── Contest Settings ─────────────────────────

  export async function updateContestSettings(settings: {
    voting_open?: boolean
    winner_page_active?: boolean
  }) {
    const user = await assertMaster()
    if (!user) return { error: 'Unauthorized' }

    const service = createServiceClient()
    const { error } = await service
      .from('contest_settings')
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq('id', 1)

    if (error) return { error: error.message }

    revalidatePath('/admin/settings')
    revalidatePath('/admin/dashboard')
    return { success: true }
  }

  // ─── Voter Management ─────────────────────────

  export async function inviteVoter(email: string) {
    const user = await assertMaster()
    if (!user) return { error: 'Unauthorized' }

    const service = createServiceClient()
    const { error } = await service.auth.admin.inviteUserByEmail(email)

    if (error) return { error: error.message }

    revalidatePath('/admin/settings')
    return { success: true }
  }

  export async function removeVoter(profileId: string) {
    const user = await assertMaster()
    if (!user) return { error: 'Unauthorized' }

    const service = createServiceClient()
    const { error } = await service
      .from('profiles')
      .delete()
      .eq('id', profileId)

    if (error) return { error: error.message }

    revalidatePath('/admin/settings')
    return { success: true }
  }
  ```

- [ ] **Step 3: Verify TypeScript**

  ```powershell
  npx tsc --noEmit
  ```

  Expected: No type errors.

- [ ] **Step 4: Commit**

  ```bash
  git add app/api/ app/actions.ts
  git commit -m "feat: add email API route and all Server Actions"
  ```

---

## Task 13: SubmissionForm component

**Files:**
- Create: `components/SubmissionForm.tsx`

- [ ] **Step 1: Create SubmissionForm**

  Create `components/SubmissionForm.tsx`:

  ```tsx
  'use client'

  import { useState, useRef, DragEvent, ChangeEvent } from 'react'
  import { useRouter } from 'next/navigation'
  import { createClient } from '@/lib/supabase/client'
  import { createSubmission } from '@/app/actions'
  import { Button } from '@/components/ui/Button'

  const ACCEPTED_MIME_TYPES = [
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'image/svg+xml',
  ]
  const MAX_BYTES = 5 * 1024 * 1024 // 5MB

  export function SubmissionForm() {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [email, setEmail] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    function handleFile(selected: File) {
      setError(null)
      if (!ACCEPTED_MIME_TYPES.includes(selected.type)) {
        setError('Please upload a PNG, JPG, WebP, GIF, or SVG file.')
        return
      }
      if (selected.size > MAX_BYTES) {
        setError('File must be 5MB or smaller.')
        return
      }
      setFile(selected)
      setPreview(URL.createObjectURL(selected))
    }

    function onInputChange(e: ChangeEvent<HTMLInputElement>) {
      const selected = e.target.files?.[0]
      if (selected) handleFile(selected)
    }

    function onDrop(e: DragEvent<HTMLDivElement>) {
      e.preventDefault()
      setIsDragging(false)
      const selected = e.dataTransfer.files?.[0]
      if (selected) handleFile(selected)
    }

    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault()
      setError(null)

      if (!email || !file) {
        setError('Please provide your email and a logo file.')
        return
      }

      setSubmitting(true)
      try {
        const supabase = createClient()
        const submission_id = crypto.randomUUID()
        const ext = file.name.split('.').pop()
        const safeFilename = `${submission_id}.${ext}`
        const storagePath = `logos/${submission_id}/${safeFilename}`

        // Direct client-side upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(storagePath, file, { contentType: file.type, upsert: false })

        if (uploadError) {
          setError(`Upload failed: ${uploadError.message}`)
          return
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from('logos').getPublicUrl(storagePath)

        // Server Action: insert DB row + send email
        const result = await createSubmission({
          submission_id,
          email,
          filename: file.name,
          storage_path: storagePath,
          public_url: publicUrl,
        })

        if (result?.error) {
          setError(result.error)
          return
        }

        router.push('/success')
      } catch (err) {
        setError('Something went wrong. Please try again.')
        console.error(err)
      } finally {
        setSubmitting(false)
      }
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-aahsa-navy mb-1"
          >
            Your email address <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-md border border-aahsa-warmGray bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-aahsa-ochre focus:outline-none focus:ring-2 focus:ring-aahsa-ochre/20"
          />
        </div>

        {/* File upload */}
        <div>
          <label className="block text-sm font-semibold text-aahsa-navy mb-1">
            Logo file <span className="text-red-500">*</span>
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            className={`relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-6 transition-colors ${
              isDragging
                ? 'border-aahsa-ochre bg-aahsa-ochre/5'
                : 'border-aahsa-warmGray bg-white hover:border-aahsa-teal'
            }`}
          >
            {preview ? (
              <img
                src={preview}
                alt="Logo preview"
                className="max-h-40 max-w-full object-contain rounded"
              />
            ) : (
              <>
                <svg
                  className="mb-3 h-10 w-10 text-aahsa-warmGray"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
                <p className="text-sm text-gray-500">
                  Drag &amp; drop or{' '}
                  <span className="font-semibold text-aahsa-teal">browse</span>
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  PNG, JPG, WebP, GIF, SVG — max 5MB
                </p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_MIME_TYPES.join(',')}
              onChange={onInputChange}
              className="sr-only"
            />
          </div>
          {file && (
            <p className="mt-1 text-xs text-gray-500">
              Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700 border border-red-200">
            {error}
          </p>
        )}

        <Button
          type="submit"
          loading={submitting}
          className="w-full py-3 text-base"
        >
          {submitting ? 'Uploading…' : 'Submit My Logo'}
        </Button>
      </form>
    )
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add components/SubmissionForm.tsx
  git commit -m "feat: add SubmissionForm with drag-and-drop upload and image preview"
  ```

---

## Task 14: Public submission page (`/`)

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace default page.tsx**

  Replace `app/page.tsx`:

  ```tsx
  import { SubmissionForm } from '@/components/SubmissionForm'

  export default function SubmissionPage() {
    return (
      <div className="min-h-screen bg-aahsa-cream">
        {/* Header */}
        <header className="bg-aahsa-navy py-6 px-4 shadow-md">
          <div className="mx-auto max-w-3xl flex items-center gap-4">
            <div>
              <p className="text-aahsa-ochre text-sm font-semibold tracking-wide uppercase">
                Alberta Aboriginal Head Start Association
              </p>
              <h1 className="font-heading text-2xl font-bold text-white leading-tight">
                National Aboriginal Head Start
              </h1>
              <p className="text-aahsa-cream/80 text-lg font-heading">
                Logo Contest
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="mx-auto max-w-3xl px-4 py-10">
          <div className="rounded-xl bg-white shadow-sm border border-aahsa-warmGray overflow-hidden">
            <div className="border-b border-aahsa-warmGray bg-aahsa-cream/50 px-8 py-6">
              <h2 className="font-heading text-xl font-bold text-aahsa-navy">
                Submit Your Design
              </h2>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                We are searching for a new logo to represent our national
                program. Submit your design below for a chance to have your
                artwork chosen.
              </p>
            </div>
            <div className="px-8 py-8">
              <SubmissionForm />
            </div>
          </div>
        </main>
      </div>
    )
  }
  ```

- [ ] **Step 2: Start dev server and manually verify**

  ```powershell
  npm run dev
  ```

  Open `http://localhost:3000`. Verify:
  - Header shows AAHSA branding with navy background
  - Form shows email field and drag-and-drop area
  - Dragging a file over the drop zone shows visual feedback
  - Selecting an image file shows a preview
  - Files over 5MB or wrong type show an error message

  Stop dev server with Ctrl+C when done.

- [ ] **Step 3: Commit**

  ```bash
  git add app/page.tsx
  git commit -m "feat: add public submission page with AAHSA branding"
  ```

---

## Task 15: Success page (`/success`)

**Files:**
- Create: `app/success/page.tsx`

- [ ] **Step 1: Create success page**

  Create `app/success/page.tsx`:

  ```tsx
  import Link from 'next/link'

  export default function SuccessPage() {
    return (
      <div className="min-h-screen bg-aahsa-cream">
        <header className="bg-aahsa-navy py-6 px-4 shadow-md">
          <div className="mx-auto max-w-3xl">
            <p className="text-aahsa-ochre text-sm font-semibold tracking-wide uppercase">
              Alberta Aboriginal Head Start Association
            </p>
            <h1 className="font-heading text-2xl font-bold text-white">
              National Aboriginal Head Start — Logo Contest
            </h1>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-16 text-center">
          <div className="rounded-xl bg-white shadow-sm border border-aahsa-warmGray p-10">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="font-heading text-2xl font-bold text-aahsa-navy mb-3">
              Thank You for Your Submission!
            </h2>
            <p className="text-gray-600 leading-relaxed mb-2">
              We have received your logo design and our team will be reviewing
              all entries.
            </p>
            <p className="text-gray-600 leading-relaxed mb-8">
              A confirmation email has been sent to your inbox. We will be in
              touch if your design is selected.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-md bg-aahsa-ochre px-6 py-2.5 text-sm font-semibold text-white hover:bg-aahsa-orange transition-colors"
            >
              Submit Another Design
            </Link>
          </div>
        </main>
      </div>
    )
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add app/success/
  git commit -m "feat: add success/thank-you page"
  ```

---

## Task 16: Winner page (`/winner`)

**Files:**
- Create: `app/winner/page.tsx`

- [ ] **Step 1: Create winner page**

  Create `app/winner/page.tsx`:

  ```tsx
  import { createServiceClient } from '@/lib/supabase/service'

  export const revalidate = 60 // revalidate every minute

  export default async function WinnerPage() {
    const service = createServiceClient()

    const { data: settings } = await service
      .from('contest_settings')
      .select('winner_page_active')
      .eq('id', 1)
      .single()

    if (!settings?.winner_page_active) {
      return (
        <div className="min-h-screen bg-aahsa-cream">
          <header className="bg-aahsa-navy py-6 px-4 shadow-md">
            <div className="mx-auto max-w-3xl">
              <p className="text-aahsa-ochre text-sm font-semibold tracking-wide uppercase">
                Alberta Aboriginal Head Start Association
              </p>
              <h1 className="font-heading text-2xl font-bold text-white">
                National Aboriginal Head Start — Logo Contest
              </h1>
            </div>
          </header>
          <main className="mx-auto max-w-2xl px-4 py-20 text-center">
            <div className="rounded-xl bg-white shadow-sm border border-aahsa-warmGray p-10">
              <h2 className="font-heading text-2xl font-bold text-aahsa-navy mb-4">
                Check Back Soon
              </h2>
              <p className="text-gray-600 leading-relaxed">
                The Logo Contest is still ongoing. Our team is reviewing all
                submissions and will announce the winner soon.
              </p>
            </div>
          </main>
        </div>
      )
    }

    const { data: winner } = await service
      .from('submissions')
      .select('*')
      .eq('is_winner', true)
      .single()

    const firstName = winner?.email?.split('@')[0]?.split('.')?.[0] ?? null
    const displayName =
      firstName
        ? firstName.charAt(0).toUpperCase() + firstName.slice(1)
        : winner?.email ?? 'our winner'

    return (
      <div className="min-h-screen bg-aahsa-cream">
        <header className="bg-aahsa-navy py-6 px-4 shadow-md">
          <div className="mx-auto max-w-3xl">
            <p className="text-aahsa-ochre text-sm font-semibold tracking-wide uppercase">
              Alberta Aboriginal Head Start Association
            </p>
            <h1 className="font-heading text-2xl font-bold text-white">
              National Aboriginal Head Start — Logo Contest
            </h1>
          </div>
        </header>

        <main className="mx-auto max-w-2xl px-4 py-12 text-center">
          <div className="rounded-xl bg-white shadow-sm border border-aahsa-warmGray overflow-hidden">
            <div className="bg-aahsa-navy px-8 py-6">
              <p className="text-aahsa-ochre font-semibold tracking-wide uppercase text-sm mb-1">
                And the winner is…
              </p>
              <h2 className="font-heading text-3xl font-bold text-white">
                Congratulations, {displayName}!
              </h2>
            </div>

            {winner && (
              <div className="p-8">
                <div className="mb-8 flex justify-center">
                  <img
                    src={winner.public_url}
                    alt="Winning logo design"
                    className="max-h-80 max-w-full rounded-lg shadow-lg object-contain"
                  />
                </div>
                <p className="text-gray-600 leading-relaxed text-lg">
                  We are thrilled to announce that the new AAHSA national
                  program logo has been selected. Thank you to everyone who
                  submitted their artwork — your creativity and spirit made
                  this contest truly special.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    )
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add app/winner/
  git commit -m "feat: add public winner page with active/inactive states"
  ```

---

## Task 17: Admin layout + login page

**Files:**
- Create: `app/admin/layout.tsx`
- Create: `app/admin/login/page.tsx`

- [ ] **Step 1: Create admin layout**

  Create `app/admin/layout.tsx`:

  ```tsx
  import { createClient } from '@/lib/supabase/server'
  import { signOut } from '@/app/actions'
  import Link from 'next/link'

  export default async function AdminLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Middleware handles redirect if not authenticated — user may be null on login page
    if (!user) return <>{children}</>

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isMaster = profile?.role === 'master'

    return (
      <div className="min-h-screen bg-aahsa-cream">
        <nav className="bg-aahsa-navy border-b border-aahsa-teal/30">
          <div className="mx-auto max-w-7xl px-4 py-0 flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <span className="font-heading text-white font-bold text-base">
                AAHSA Contest
              </span>
              <Link
                href="/admin/dashboard"
                className="text-sm text-aahsa-cream/80 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/results"
                className="text-sm text-aahsa-cream/80 hover:text-white transition-colors"
              >
                Results
              </Link>
              {isMaster && (
                <>
                  <Link
                    href="/admin/settings"
                    className="text-sm text-aahsa-cream/80 hover:text-white transition-colors"
                  >
                    Settings
                  </Link>
                  <Link
                    href="/admin/invite"
                    className="text-sm text-aahsa-cream/80 hover:text-white transition-colors"
                  >
                    Invite
                  </Link>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-aahsa-cream/60">{user.email}</span>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-xs text-aahsa-cream/80 hover:text-white transition-colors"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </nav>
        <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>
      </div>
    )
  }
  ```

- [ ] **Step 2: Create admin login page**

  Create `app/admin/login/page.tsx`:

  ```tsx
  'use client'

  import { useState } from 'react'
  import { useRouter } from 'next/navigation'
  import { createClient } from '@/lib/supabase/client'
  import { Button } from '@/components/ui/Button'

  export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault()
      setError(null)
      setLoading(true)

      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      router.push('/admin/dashboard')
      router.refresh()
    }

    return (
      <div className="min-h-screen bg-aahsa-cream flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <p className="text-aahsa-ochre text-xs font-semibold tracking-wide uppercase mb-1">
              Alberta Aboriginal Head Start Association
            </p>
            <h1 className="font-heading text-2xl font-bold text-aahsa-navy">
              Contest Management
            </h1>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-aahsa-warmGray p-8">
            <h2 className="font-heading text-lg font-semibold text-aahsa-navy mb-6">
              Sign In
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-aahsa-navy mb-1"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-aahsa-warmGray px-3 py-2 text-sm focus:border-aahsa-ochre focus:outline-none focus:ring-2 focus:ring-aahsa-ochre/20"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-aahsa-navy mb-1"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-aahsa-warmGray px-3 py-2 text-sm focus:border-aahsa-ochre focus:outline-none focus:ring-2 focus:ring-aahsa-ochre/20"
                />
              </div>

              {error && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 border border-red-200">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                variant="secondary"
                loading={loading}
                className="w-full"
              >
                Sign In
              </Button>
            </form>
          </div>
        </div>
      </div>
    )
  }
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add app/admin/
  git commit -m "feat: add admin layout with nav and login page"
  ```

---

## Task 18: LogoCard component + Admin dashboard

**Files:**
- Create: `components/LogoCard.tsx`
- Create: `app/admin/dashboard/DashboardClient.tsx`
- Create: `app/admin/dashboard/page.tsx`

- [ ] **Step 1: Create LogoCard component**

  Create `components/LogoCard.tsx`:

  ```tsx
  'use client'

  import type { Submission } from '@/lib/types'

  type Props = {
    submission: Submission
    isSelected: boolean
    canSelect: boolean
    onToggle: (id: string) => void
    disabled?: boolean
  }

  export function LogoCard({
    submission,
    isSelected,
    canSelect,
    onToggle,
    disabled = false,
  }: Props) {
    const canToggle = !disabled && (isSelected || canSelect)

    return (
      <div
        onClick={() => canToggle && onToggle(submission.id)}
        className={`relative rounded-xl border-2 bg-white shadow-sm transition-all ${
          isSelected
            ? 'border-aahsa-ochre shadow-md ring-2 ring-aahsa-ochre/20'
            : canToggle
            ? 'border-aahsa-warmGray cursor-pointer hover:border-aahsa-teal hover:shadow-md'
            : 'border-aahsa-warmGray opacity-60 cursor-not-allowed'
        }`}
      >
        {/* Star indicator */}
        <div className="absolute top-2 right-2 z-10">
          <span
            className={`text-xl ${
              isSelected ? 'text-aahsa-ochre' : 'text-gray-300'
            }`}
            aria-label={isSelected ? 'Favourited' : 'Not favourited'}
          >
            ★
          </span>
        </div>

        {/* Image */}
        <div className="aspect-square overflow-hidden rounded-t-xl bg-aahsa-cream flex items-center justify-center p-4">
          <img
            src={submission.public_url}
            alt={`Logo by ${submission.email}`}
            className="max-h-full max-w-full object-contain"
          />
        </div>

        {/* Info */}
        <div className="p-3">
          <p
            className="text-xs text-gray-600 truncate"
            title={submission.email}
          >
            {submission.email}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(submission.submitted_at).toLocaleDateString('en-CA', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>
    )
  }
  ```

- [ ] **Step 2: Create DashboardClient component**

  Create `app/admin/dashboard/DashboardClient.tsx`:

  ```tsx
  'use client'

  import { useState, useTransition } from 'react'
  import { LogoCard } from '@/components/LogoCard'
  import { Button } from '@/components/ui/Button'
  import { saveVotes } from '@/app/actions'
  import type { Submission } from '@/lib/types'

  type Props = {
    submissions: Submission[]
    initialVoteIds: string[]
    votingOpen: boolean
  }

  const MAX_VOTES = 5

  export function DashboardClient({
    submissions,
    initialVoteIds,
    votingOpen,
  }: Props) {
    const [selected, setSelected] = useState<Set<string>>(
      new Set(initialVoteIds)
    )
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    function toggle(id: string) {
      setSelected((prev) => {
        const next = new Set(prev)
        if (next.has(id)) {
          next.delete(id)
        } else {
          if (next.size >= MAX_VOTES) return prev
          next.add(id)
        }
        return next
      })
      setSaved(false)
    }

    function handleSave() {
      setError(null)
      startTransition(async () => {
        const result = await saveVotes(Array.from(selected))
        if (result?.error) {
          setError(result.error)
        } else {
          setSaved(true)
        }
      })
    }

    if (!votingOpen) {
      return (
        <div>
          <div className="mb-6 rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800 font-medium">
            Voting has closed. Your selections are shown below (read-only).
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {submissions.map((s) => (
              <LogoCard
                key={s.id}
                submission={s}
                isSelected={selected.has(s.id)}
                canSelect={false}
                onToggle={() => {}}
                disabled
              />
            ))}
          </div>
        </div>
      )
    }

    return (
      <div>
        {/* Controls */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-aahsa-navy">
              {selected.size}
            </span>{' '}
            of {MAX_VOTES} favourites selected
          </p>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="text-sm text-green-600 font-medium">
                ✓ Votes saved
              </span>
            )}
            {error && (
              <span className="text-sm text-red-600">{error}</span>
            )}
            <Button
              onClick={handleSave}
              loading={isPending}
              disabled={isPending}
            >
              Save My Votes
            </Button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {submissions.map((s) => (
            <LogoCard
              key={s.id}
              submission={s}
              isSelected={selected.has(s.id)}
              canSelect={selected.size < MAX_VOTES}
              onToggle={toggle}
            />
          ))}
        </div>

        {submissions.length === 0 && (
          <p className="py-16 text-center text-gray-400 text-sm">
            No submissions yet.
          </p>
        )}
      </div>
    )
  }
  ```

- [ ] **Step 3: Create dashboard page (Server Component)**

  Create `app/admin/dashboard/page.tsx`:

  ```tsx
  import { redirect } from 'next/navigation'
  import { createClient } from '@/lib/supabase/server'
  import { createServiceClient } from '@/lib/supabase/service'
  import { DashboardClient } from './DashboardClient'

  export default async function DashboardPage() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/admin/login')

    const service = createServiceClient()

    const [submissionsResult, votesResult, settingsResult] = await Promise.all([
      service.from('submissions').select('*').order('submitted_at', { ascending: false }),
      service.from('votes').select('submission_id').eq('voter_id', user.id),
      service.from('contest_settings').select('voting_open').eq('id', 1).single(),
    ])

    const submissions = submissionsResult.data ?? []
    const voteIds = (votesResult.data ?? []).map((v) => v.submission_id)
    const votingOpen = settingsResult.data?.voting_open ?? true

    return (
      <div>
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-aahsa-navy">
            Voting Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {submissions.length} submission{submissions.length !== 1 ? 's' : ''}{' '}
            total
          </p>
        </div>

        <DashboardClient
          submissions={submissions}
          initialVoteIds={voteIds}
          votingOpen={votingOpen}
        />
      </div>
    )
  }
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add components/LogoCard.tsx app/admin/dashboard/
  git commit -m "feat: add voting dashboard with LogoCard grid and save votes action"
  ```

---

## Task 19: Leaderboard component + Results page

**Files:**
- Create: `components/Leaderboard.tsx`
- Create: `app/admin/results/page.tsx`

- [ ] **Step 1: Create Leaderboard component**

  Create `components/Leaderboard.tsx`:

  ```tsx
  'use client'

  import { useState, useTransition } from 'react'
  import { declareWinner } from '@/app/actions'
  import { Badge } from '@/components/ui/Badge'
  import { Button } from '@/components/ui/Button'
  import type { SubmissionWithVotes } from '@/lib/types'

  type Props = {
    results: SubmissionWithVotes[]
    isMaster: boolean
  }

  export function Leaderboard({ results, isMaster }: Props) {
    const [isPending, startTransition] = useTransition()
    const [declaringId, setDeclaringId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const maxVotes = results[0]?.votes ?? 0

    function handleDeclare(id: string) {
      setError(null)
      setDeclaringId(id)
      startTransition(async () => {
        const result = await declareWinner(id)
        if (result?.error) setError(result.error)
        setDeclaringId(null)
      })
    }

    return (
      <div className="space-y-3">
        {error && (
          <p className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700 border border-red-200">
            {error}
          </p>
        )}
        {results.map((item, index) => (
          <div
            key={item.id}
            className={`flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm ${
              item.is_winner ? 'border-aahsa-ochre ring-2 ring-aahsa-ochre/20' : 'border-aahsa-warmGray'
            }`}
          >
            {/* Rank */}
            <div className="w-8 text-center font-heading text-lg font-bold text-aahsa-navy">
              {index + 1}
            </div>

            {/* Thumbnail */}
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-aahsa-cream flex items-center justify-center">
              <img
                src={item.public_url}
                alt={`Submission by ${item.email}`}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-aahsa-navy truncate">
                {item.email}
              </p>
              <div className="mt-1 flex items-center gap-2">
                {item.is_winner && <Badge variant="winner">Winner</Badge>}
                <p className="text-xs text-gray-400">
                  {new Date(item.submitted_at).toLocaleDateString('en-CA')}
                </p>
              </div>
              {/* Vote bar */}
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-aahsa-warmGray overflow-hidden">
                  <div
                    className="h-full rounded-full bg-aahsa-teal transition-all"
                    style={{
                      width: maxVotes > 0 ? `${(item.votes / maxVotes) * 100}%` : '0%',
                    }}
                  />
                </div>
                <span className="text-xs font-semibold text-aahsa-navy w-16 text-right">
                  {item.votes} vote{item.votes !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Declare winner button (master only) */}
            {isMaster && !item.is_winner && (
              <Button
                variant="ghost"
                onClick={() => handleDeclare(item.id)}
                loading={isPending && declaringId === item.id}
                disabled={isPending}
                className="flex-shrink-0 text-xs"
              >
                Declare Winner
              </Button>
            )}
          </div>
        ))}

        {results.length === 0 && (
          <p className="py-16 text-center text-gray-400 text-sm">
            No votes have been cast yet.
          </p>
        )}
      </div>
    )
  }
  ```

- [ ] **Step 2: Create results page**

  Create `app/admin/results/page.tsx`:

  ```tsx
  import { redirect } from 'next/navigation'
  import { createClient } from '@/lib/supabase/server'
  import { createServiceClient } from '@/lib/supabase/service'
  import { isMaster } from '@/lib/roles'
  import { Leaderboard } from '@/components/Leaderboard'
  import type { SubmissionWithVotes } from '@/lib/types'

  export default async function ResultsPage() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/admin/login')

    const service = createServiceClient()

    const { data: profile } = await service
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const masterUser = isMaster(profile?.role)

    const { data: settings } = await service
      .from('contest_settings')
      .select('voting_open')
      .eq('id', 1)
      .single()

    // Voters can only see results after voting closes; masters always can
    if (!masterUser && settings?.voting_open !== false) {
      return (
        <div>
          <h1 className="font-heading text-2xl font-bold text-aahsa-navy mb-4">
            Results
          </h1>
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">
            Results will be available once voting has closed.
          </div>
        </div>
      )
    }

    const [submissionsResult, votesResult] = await Promise.all([
      service.from('submissions').select('*'),
      service.from('votes').select('submission_id'),
    ])

    const submissions = submissionsResult.data ?? []
    const votes = votesResult.data ?? []

    const voteCounts = votes.reduce<Record<string, number>>((acc, v) => {
      acc[v.submission_id] = (acc[v.submission_id] ?? 0) + 1
      return acc
    }, {})

    const results: SubmissionWithVotes[] = submissions
      .map((s) => ({ ...s, votes: voteCounts[s.id] ?? 0 }))
      .sort((a, b) => b.votes - a.votes)

    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-aahsa-navy">
              Results
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {submissions.length} submissions · {votes.length} total votes cast
            </p>
          </div>
          {!settings?.voting_open && (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
              Voting closed
            </span>
          )}
        </div>

        <Leaderboard results={results} isMaster={masterUser} />
      </div>
    )
  }
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add components/Leaderboard.tsx app/admin/results/
  git commit -m "feat: add results leaderboard with vote counts and declare-winner button"
  ```

---

## Task 20: VoterList component + Settings page

**Files:**
- Create: `components/VoterList.tsx`
- Create: `app/admin/settings/page.tsx`

- [ ] **Step 1: Create VoterList component**

  Create `components/VoterList.tsx`:

  ```tsx
  'use client'

  import { useState, useTransition } from 'react'
  import { removeVoter } from '@/app/actions'
  import { Badge } from '@/components/ui/Badge'
  import type { Profile } from '@/lib/types'

  export function VoterList({ voters }: { voters: Profile[] }) {
    const [isPending, startTransition] = useTransition()
    const [removingId, setRemovingId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    function handleRemove(id: string) {
      if (!confirm('Remove this voter? They will no longer be able to log in.')) return
      setError(null)
      setRemovingId(id)
      startTransition(async () => {
        const result = await removeVoter(id)
        if (result?.error) setError(result.error)
        setRemovingId(null)
      })
    }

    return (
      <div>
        {error && (
          <p className="mb-3 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700 border border-red-200">
            {error}
          </p>
        )}
        <div className="overflow-hidden rounded-xl border border-aahsa-warmGray bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-aahsa-cream border-b border-aahsa-warmGray">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-aahsa-navy">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-semibold text-aahsa-navy">
                  Role
                </th>
                <th className="px-4 py-3 text-left font-semibold text-aahsa-navy">
                  Joined
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-aahsa-warmGray/50">
              {voters.map((voter) => (
                <tr key={voter.id} className="hover:bg-aahsa-cream/30">
                  <td className="px-4 py-3 text-gray-700">{voter.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={voter.role}>{voter.role}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(voter.created_at).toLocaleDateString('en-CA')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {voter.role !== 'master' && (
                      <button
                        onClick={() => handleRemove(voter.id)}
                        disabled={isPending && removingId === voter.id}
                        className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                      >
                        {isPending && removingId === voter.id
                          ? 'Removing…'
                          : 'Remove'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {voters.length === 0 && (
            <p className="py-8 text-center text-gray-400 text-sm">
              No voters yet. Invite someone to get started.
            </p>
          )}
        </div>
      </div>
    )
  }
  ```

- [ ] **Step 2: Create settings page**

  Create `app/admin/settings/page.tsx` (Server Component — loads data, delegates toggles to SettingsControls):

  ```tsx
  import { redirect } from 'next/navigation'
  import { createClient } from '@/lib/supabase/server'
  import { createServiceClient } from '@/lib/supabase/service'
  import { VoterList } from '@/components/VoterList'
  import { SettingsControls } from './SettingsControls'

  export default async function SettingsPage() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/admin/login')

    const service = createServiceClient()

    const [settingsResult, votersResult] = await Promise.all([
      service.from('contest_settings').select('*').eq('id', 1).single(),
      service.from('profiles').select('*').order('created_at'),
    ])

    const settings = settingsResult.data
    const voters = votersResult.data ?? []

    return (
      <div className="max-w-3xl space-y-10">
        <div>
          <h1 className="font-heading text-2xl font-bold text-aahsa-navy mb-1">
            Settings
          </h1>
          <p className="text-sm text-gray-500">Master admin controls</p>
        </div>

        {/* Contest Controls */}
        <section>
          <h2 className="font-heading text-lg font-semibold text-aahsa-navy mb-4">
            Contest Controls
          </h2>
          {settings && (
            <SettingsControls
              votingOpen={settings.voting_open}
              winnerPageActive={settings.winner_page_active}
            />
          )}
        </section>

        {/* Voter Management */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-semibold text-aahsa-navy">
              Voters ({voters.length})
            </h2>
            <a
              href="/admin/invite"
              className="text-sm font-semibold text-aahsa-teal hover:underline"
            >
              + Invite Voter
            </a>
          </div>
          <VoterList voters={voters} />
        </section>
      </div>
    )
  }
  ```

- [ ] **Step 3: Create SettingsControls client component**

  Create `app/admin/settings/SettingsControls.tsx`:

  ```tsx
  'use client'

  import { useState, useTransition } from 'react'
  import { updateContestSettings } from '@/app/actions'

  type Props = {
    votingOpen: boolean
    winnerPageActive: boolean
  }

  export function SettingsControls({
    votingOpen: initialVotingOpen,
    winnerPageActive: initialWinnerPageActive,
  }: Props) {
    const [votingOpen, setVotingOpen] = useState(initialVotingOpen)
    const [winnerPageActive, setWinnerPageActive] = useState(
      initialWinnerPageActive
    )
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)

    function toggle(field: 'voting_open' | 'winner_page_active', value: boolean) {
      setError(null)
      setMessage(null)
      startTransition(async () => {
        const result = await updateContestSettings({ [field]: value })
        if (result?.error) {
          setError(result.error)
        } else {
          if (field === 'voting_open') setVotingOpen(value)
          if (field === 'winner_page_active') setWinnerPageActive(value)
          setMessage('Settings updated.')
        }
      })
    }

    return (
      <div className="rounded-xl border border-aahsa-warmGray bg-white shadow-sm divide-y divide-aahsa-warmGray/50">
        {error && (
          <div className="px-6 py-3 bg-red-50 text-sm text-red-700">{error}</div>
        )}
        {message && (
          <div className="px-6 py-3 bg-green-50 text-sm text-green-700">
            {message}
          </div>
        )}

        {/* Voting toggle */}
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <p className="font-semibold text-aahsa-navy text-sm">Voting</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {votingOpen
                ? 'Currently open — voters can submit favourites'
                : 'Closed — results are now visible to all voters'}
            </p>
          </div>
          <button
            onClick={() => toggle('voting_open', !votingOpen)}
            disabled={isPending}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
              votingOpen ? 'bg-aahsa-teal' : 'bg-gray-200'
            }`}
            role="switch"
            aria-checked={votingOpen}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition duration-200 ease-in-out ${
                votingOpen ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Winner page toggle */}
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <p className="font-semibold text-aahsa-navy text-sm">
              Public Winner Page
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {winnerPageActive
                ? 'Active — winner is publicly visible at /winner'
                : 'Hidden — /winner shows "Check back soon"'}
            </p>
          </div>
          <button
            onClick={() => toggle('winner_page_active', !winnerPageActive)}
            disabled={isPending}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
              winnerPageActive ? 'bg-aahsa-ochre' : 'bg-gray-200'
            }`}
            role="switch"
            aria-checked={winnerPageActive}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition duration-200 ease-in-out ${
                winnerPageActive ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    )
  }
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add components/VoterList.tsx app/admin/settings/
  git commit -m "feat: add settings page with contest controls and voter management"
  ```

---

## Task 21: Admin invite page

**Files:**
- Create: `app/admin/invite/page.tsx`

- [ ] **Step 1: Create invite page**

  Create `app/admin/invite/page.tsx`:

  ```tsx
  'use client'

  import { useState, useTransition } from 'react'
  import { inviteVoter } from '@/app/actions'
  import { Button } from '@/components/ui/Button'

  export default function InvitePage() {
    const [email, setEmail] = useState('')
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    function handleSubmit(e: React.FormEvent) {
      e.preventDefault()
      setError(null)
      setSuccess(null)

      startTransition(async () => {
        const result = await inviteVoter(email)
        if (result?.error) {
          setError(result.error)
        } else {
          setSuccess(`Invitation sent to ${email}.`)
          setEmail('')
        }
      })
    }

    return (
      <div className="max-w-lg">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-aahsa-navy">
            Invite Voter
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            The invited person will receive a magic-link email to set their
            password and access the voting dashboard.
          </p>
        </div>

        <div className="rounded-xl border border-aahsa-warmGray bg-white shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="invite-email"
                className="block text-sm font-semibold text-aahsa-navy mb-1"
              >
                Email address
              </label>
              <input
                id="invite-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@aahsa.ca"
                className="w-full rounded-md border border-aahsa-warmGray px-3 py-2 text-sm focus:border-aahsa-ochre focus:outline-none focus:ring-2 focus:ring-aahsa-ochre/20"
              />
            </div>

            {error && (
              <p className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700 border border-red-200">
                {error}
              </p>
            )}

            {success && (
              <p className="rounded-md bg-green-50 px-4 py-2 text-sm text-green-700 border border-green-200">
                {success}
              </p>
            )}

            <Button type="submit" loading={isPending} className="w-full">
              Send Invitation
            </Button>
          </form>
        </div>

        <p className="mt-4 text-xs text-gray-400">
          Invited users receive a Supabase Auth email with a link to set their
          password. Their account will be created with the <strong>voter</strong>{' '}
          role.
        </p>
      </div>
    )
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add app/admin/invite/
  git commit -m "feat: add invite voter page"
  ```

---

## Task 22: Seed master script

**Files:**
- Create: `scripts/seed-master.ts`

- [ ] **Step 1: Create scripts directory and seed script**

  ```powershell
  mkdir scripts
  ```

  Create `scripts/seed-master.ts`:

  ```typescript
  /**
   * One-time script to promote a user to master role.
   * Usage: npx tsx scripts/seed-master.ts <email>
   *
   * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env.
   */

  import { createClient } from '@supabase/supabase-js'
  import type { Database } from '../lib/types'

  const email = process.argv[2]

  if (!email) {
    console.error('Usage: npx tsx scripts/seed-master.ts <email>')
    process.exit(1)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error(
      'Missing env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.'
    )
    process.exit(1)
  }

  const supabase = createClient<Database>(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'master' })
    .eq('email', email)
    .select()

  if (error) {
    console.error('Error updating role:', error.message)
    process.exit(1)
  }

  if (!data || data.length === 0) {
    console.error(
      `No profile found for ${email}. Make sure the user has logged in at least once.`
    )
    process.exit(1)
  }

  console.log(`✓ ${email} is now a master admin.`)
  ```

- [ ] **Step 2: Install tsx for running TS scripts**

  ```powershell
  npm install -D tsx
  ```

- [ ] **Step 3: Add seed script to package.json**

  In `package.json` scripts, add:
  ```json
  "seed-master": "tsx scripts/seed-master.ts"
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add scripts/ package.json
  git commit -m "feat: add seed-master script to assign first master admin role"
  ```

---

## Task 23: Final build verification

- [ ] **Step 1: Run all tests**

  ```powershell
  npm test
  ```

  Expected: All tests pass (roles + email helpers).

- [ ] **Step 2: TypeScript check**

  ```powershell
  npx tsc --noEmit
  ```

  Expected: No type errors.

- [ ] **Step 3: Production build**

  ```powershell
  npm run build
  ```

  Expected: Build succeeds with no errors. Review any warnings.

- [ ] **Step 4: Verify dev server end-to-end (with real Supabase credentials)**

  Fill in `.env.local` with real values first, then:

  ```powershell
  npm run dev
  ```

  Test the following manually:
  1. Visit `http://localhost:3000` — see submission form with AAHSA branding
  2. Submit a test logo image + email — should redirect to `/success`
  3. Check Supabase dashboard: submission row created, file in `logos/` bucket
  4. Check inbox: confirmation email received from Resend
  5. Visit `http://localhost:3000/winner` — see "Check back soon"
  6. Visit `http://localhost:3000/admin/login` — see login form
  7. Sign in with master admin credentials — redirects to dashboard
  8. See logo grid with thumbnails
  9. Select up to 5, click "Save My Votes" — success message
  10. Try selecting a 6th — UI blocks it
  11. Visit `/admin/results` (voting still open) — should be blocked for voter; accessible for master
  12. In settings, close voting — results page now shows for all users
  13. Declare a winner in results — winner badge appears
  14. Activate winner page in settings — `/winner` now shows the logo

- [ ] **Step 5: Final commit**

  ```bash
  git add -A
  git commit -m "chore: final build verification — all features complete"
  ```

---

## Post-Build: Supabase Configuration Checklist

After the code is complete, complete these in the Supabase dashboard:

- [ ] Run `supabase/migrations/001_initial_schema.sql` in the SQL Editor
- [ ] Create Storage bucket `logos` — set to **Public**, max 5MB, accepted MIME types
- [ ] Enable **Email** auth provider in Authentication > Providers
- [ ] Set **Site URL** in Authentication > URL Configuration to `https://contest.aahsa.ca`
- [ ] Configure custom SMTP or Resend in Authentication > SMTP Settings (for invite/reset emails)
- [ ] Customise invite email template in Authentication > Email Templates with AAHSA branding
- [ ] Run `npm run seed-master your@email.com` (with env vars loaded) to promote first admin

## Post-Build: Vercel Deployment Checklist

- [ ] Push repo to GitHub
- [ ] Import repo in Vercel dashboard
- [ ] Add all env vars from `.env.local` in Vercel > Settings > Environment Variables
- [ ] Add custom domain `contest.aahsa.ca` and configure CNAME at registrar
- [ ] Verify automatic deploys from `main` branch
