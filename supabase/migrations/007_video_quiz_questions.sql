-- =============================================================================
-- Per-video quiz questions (tied to specific grammar videos)
-- =============================================================================

begin;

create table if not exists public.video_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  video_id text not null,
  question_text text not null,
  choice_1 text not null,
  choice_2 text not null,
  choice_3 text not null,
  choice_4 text not null,
  correct_choice smallint not null check (correct_choice between 1 and 4),
  explanation text,
  display_order smallint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_video_quiz_questions_video_id
  on public.video_quiz_questions (video_id, display_order);

alter table public.video_quiz_questions enable row level security;

drop policy if exists "video_quiz_questions_select_authenticated"
  on public.video_quiz_questions;
drop policy if exists "video_quiz_questions_insert_admin"
  on public.video_quiz_questions;
drop policy if exists "video_quiz_questions_update_admin"
  on public.video_quiz_questions;
drop policy if exists "video_quiz_questions_delete_admin"
  on public.video_quiz_questions;

create policy "video_quiz_questions_select_authenticated"
  on public.video_quiz_questions for select to authenticated using (true);

create policy "video_quiz_questions_insert_admin"
  on public.video_quiz_questions for insert to authenticated
  with check (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

create policy "video_quiz_questions_update_admin"
  on public.video_quiz_questions for update to authenticated
  using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

create policy "video_quiz_questions_delete_admin"
  on public.video_quiz_questions for delete to authenticated
  using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

-- Per-user attempts on video quizzes
create table if not exists public.video_quiz_attempts (
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id text not null,
  correct_count integer not null default 0,
  total_count integer not null default 0,
  last_attempted_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

alter table public.video_quiz_attempts enable row level security;

drop policy if exists "video_quiz_attempts_select_own"
  on public.video_quiz_attempts;
drop policy if exists "video_quiz_attempts_insert_own"
  on public.video_quiz_attempts;
drop policy if exists "video_quiz_attempts_update_own"
  on public.video_quiz_attempts;

create policy "video_quiz_attempts_select_own"
  on public.video_quiz_attempts for select to authenticated
  using (user_id = auth.uid());

create policy "video_quiz_attempts_insert_own"
  on public.video_quiz_attempts for insert to authenticated
  with check (user_id = auth.uid());

create policy "video_quiz_attempts_update_own"
  on public.video_quiz_attempts for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

commit;
