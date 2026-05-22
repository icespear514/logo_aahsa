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

create policy "profiles: own read"
  on profiles for select
  using (auth.uid() = id);

create policy "profiles: own update"
  on profiles for update
  using (auth.uid() = id);

create policy "profiles: service role insert"
  on profiles for insert
  with check (true);

-- ─── SUBMISSIONS POLICIES ────────────────────

create policy "submissions: public insert"
  on submissions for insert
  with check (true);

create policy "submissions: authenticated select"
  on submissions for select
  using (auth.role() = 'authenticated');

-- ─── VOTES POLICIES ──────────────────────────

create policy "votes: own insert"
  on votes for insert
  with check (auth.uid() = voter_id);

create policy "votes: own select"
  on votes for select
  using (auth.uid() = voter_id);

create policy "votes: own delete"
  on votes for delete
  using (auth.uid() = voter_id);

-- ─── CONTEST SETTINGS POLICIES ───────────────

create policy "contest_settings: authenticated read"
  on contest_settings for select
  using (auth.role() = 'authenticated');

create policy "contest_settings: public read"
  on contest_settings for select
  using (true);

-- ─── STORAGE POLICIES ────────────────────────

create policy "logos: anon insert"
  on storage.objects for insert
  with check (bucket_id = 'logos');

create policy "logos: public read"
  on storage.objects for select
  using (bucket_id = 'logos');

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
