-- =============================================================================
-- Cloze questions for Eiken Grade 3 style multiple-choice items
-- =============================================================================

begin;

create table if not exists public.cloze_questions (
  id uuid primary key default gen_random_uuid(),
  question_text text not null,
  choice_1 text not null,
  choice_2 text not null,
  choice_3 text not null,
  choice_4 text not null,
  correct_choice smallint not null check (correct_choice between 1 and 4),
  explanation text,
  created_at timestamptz not null default now()
);

-- Basic index to help random sampling and admin listing by creation time.
create index if not exists idx_cloze_questions_created_at
  on public.cloze_questions (created_at desc);

-- Enable RLS
alter table public.cloze_questions enable row level security;

-- Clean up existing policies so this file is re-runnable in dev.
drop policy if exists "cloze_select_authenticated" on public.cloze_questions;
drop policy if exists "cloze_insert_admin" on public.cloze_questions;
drop policy if exists "cloze_update_admin" on public.cloze_questions;
drop policy if exists "cloze_delete_admin" on public.cloze_questions;

-- Authenticated users can read all cloze questions
create policy "cloze_select_authenticated"
  on public.cloze_questions
  for select
  to authenticated
  using (true);

-- Only admin users can INSERT / UPDATE / DELETE cloze questions
create policy "cloze_insert_admin"
  on public.cloze_questions
  for insert
  to authenticated
  with check (
    exists (select 1 from public.admin_users au where au.user_id = auth.uid())
  );

create policy "cloze_update_admin"
  on public.cloze_questions
  for update
  to authenticated
  using (
    exists (select 1 from public.admin_users au where au.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.admin_users au where au.user_id = auth.uid())
  );

create policy "cloze_delete_admin"
  on public.cloze_questions
  for delete
  to authenticated
  using (
    exists (select 1 from public.admin_users au where au.user_id = auth.uid())
  );

commit;

