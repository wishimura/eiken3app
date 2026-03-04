-- =============================================================================
-- Eiken Grade 3 Flashcard App - Initial DB Schema (Supabase)
-- Run this in Supabase SQL Editor on a new project.
-- This script is idempotent-ish for development: tables use IF NOT EXISTS,
-- and policies are dropped before being re-created.
-- =============================================================================

begin;

-- (1) words: vocabulary
create table if not exists public.words (
  id uuid primary key default gen_random_uuid(),
  english text not null,
  japanese text not null,
  created_at timestamptz not null default now()
);

-- Prevent exact duplicate entries for the same English/Japanese pair.
-- We normalize english with lower(...) so that 'Apple' and 'apple' are
-- treated as the same word, while still allowing different Japanese
-- translations for the same English string in the future if needed.
create unique index if not exists idx_words_english_japanese_unique
  on public.words (lower(english), japanese);

-- (2) user_progress: per-user correct/wrong counts per word
create table if not exists public.user_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id uuid not null references public.words(id) on delete cascade,
  correct_count integer not null default 0,
  wrong_count integer not null default 0,
  last_answered_at timestamptz,
  primary key (user_id, word_id)
);

-- (3) admin_users: allowlist of admin user ids
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Enable RLS on words and user_progress.
-- admin_users is managed only via service_role (SQL Editor etc.), and is
-- deliberately left without RLS to avoid recursive policy issues when
-- checking membership from other tables.
alter table public.words enable row level security;
alter table public.user_progress enable row level security;
alter table public.admin_users disable row level security;

-- -----------------------------------------------------------------------------
-- RLS Policies: words
-- -----------------------------------------------------------------------------

-- Clean up existing policies to make this script re-runnable in dev.
drop policy if exists "words_select_authenticated" on public.words;
drop policy if exists "words_insert_admin" on public.words;
drop policy if exists "words_update_admin" on public.words;
drop policy if exists "words_delete_admin" on public.words;

-- Authenticated users can SELECT all words
create policy "words_select_authenticated"
  on public.words
  for select
  to authenticated
  using (true);

-- Only users listed in admin_users can INSERT/UPDATE/DELETE words
create policy "words_insert_admin"
  on public.words
  for insert
  to authenticated
  with check (
    exists (select 1 from public.admin_users au where au.user_id = auth.uid())
  );

create policy "words_update_admin"
  on public.words
  for update
  to authenticated
  using (
    exists (select 1 from public.admin_users au where au.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.admin_users au where au.user_id = auth.uid())
  );

create policy "words_delete_admin"
  on public.words
  for delete
  to authenticated
  using (
    exists (select 1 from public.admin_users au where au.user_id = auth.uid())
  );

-- -----------------------------------------------------------------------------
-- RLS Policies: user_progress
-- -----------------------------------------------------------------------------

drop policy if exists "user_progress_select_own" on public.user_progress;
drop policy if exists "user_progress_insert_own" on public.user_progress;
drop policy if exists "user_progress_update_own" on public.user_progress;

-- Users can SELECT/INSERT/UPDATE only their own rows
create policy "user_progress_select_own"
  on public.user_progress
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "user_progress_insert_own"
  on public.user_progress
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "user_progress_update_own"
  on public.user_progress
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- RLS Policies: admin_users
-- -----------------------------------------------------------------------------

drop policy if exists "admin_users_select_admin" on public.admin_users;
drop policy if exists "admin_users_insert_admin" on public.admin_users;
drop policy if exists "admin_users_delete_admin" on public.admin_users;
drop policy if exists "admin_users_service_role_only" on public.admin_users;

-- NOTE:
-- Having a policy on admin_users that queries admin_users again
-- (e.g. `exists (select 1 from admin_users ...)`) leads to
-- `infinite recursion detected in policy` in Postgres.
-- To keep things simple and safe, admin_users is managed ONLY
-- via the service_role key (SQL Editor, backend jobs, etc.).
-- We intentionally leave admin_users with NO policies defined so that
-- there is no risk of recursive policy evaluation. The application
-- never queries this table with the anon key.

commit;

-- =============================================================================
-- 最初の管理者の追加方法（SQL Editor で実行）
-- 1. Supabase Dashboard > Authentication > Users でユーザーを作成する
-- 2. そのユーザーの UID (UUID) をコピーする
-- 3. 下記の '<YOUR-USER-UUID>' をその UID に置き換えて実行する
--    （SQL Editor は service_role 相当で動くため、RLS を通過して 1 件目を追加できる）
-- =============================================================================
-- insert into public.admin_users (user_id) values ('<YOUR-USER-UUID>');
