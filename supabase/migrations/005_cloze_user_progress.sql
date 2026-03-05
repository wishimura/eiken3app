-- =============================================================================
-- Per-user progress for cloze questions
-- =============================================================================

begin;

create table if not exists public.cloze_user_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.cloze_questions(id) on delete cascade,
  correct_count integer not null default 0,
  wrong_count integer not null default 0,
  last_answered_at timestamptz,
  bookmarked boolean not null default false,
  primary key (user_id, question_id)
);

alter table public.cloze_user_progress enable row level security;

drop policy if exists "cloze_user_progress_select_own" on public.cloze_user_progress;
drop policy if exists "cloze_user_progress_insert_own" on public.cloze_user_progress;
drop policy if exists "cloze_user_progress_update_own" on public.cloze_user_progress;

create policy "cloze_user_progress_select_own"
  on public.cloze_user_progress
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "cloze_user_progress_insert_own"
  on public.cloze_user_progress
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "cloze_user_progress_update_own"
  on public.cloze_user_progress
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

commit;

