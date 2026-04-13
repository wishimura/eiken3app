-- =============================================================================
-- Per-user progress for grammar videos (YouTube playlist)
-- =============================================================================

begin;

create table if not exists public.video_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id text not null,
  watched_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

alter table public.video_progress enable row level security;

drop policy if exists "video_progress_select_own" on public.video_progress;
drop policy if exists "video_progress_insert_own" on public.video_progress;
drop policy if exists "video_progress_delete_own" on public.video_progress;

create policy "video_progress_select_own"
  on public.video_progress
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "video_progress_insert_own"
  on public.video_progress
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "video_progress_delete_own"
  on public.video_progress
  for delete
  to authenticated
  using (user_id = auth.uid());

commit;
