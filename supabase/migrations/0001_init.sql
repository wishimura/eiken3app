create table if not exists public.words (
  id uuid primary key default gen_random_uuid(),
  english text not null,
  japanese text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_progress (
  user_id uuid not null,
  word_id uuid not null references public.words(id) on delete cascade,
  correct_count integer not null default 0,
  wrong_count integer not null default 0,
  last_answered_at timestamptz,
  primary key (user_id, word_id)
);

create table if not exists public.admin_users (
  user_id uuid primary key
);

alter table public.words enable row level security;
alter table public.user_progress enable row level security;
alter table public.admin_users enable row level security;

create policy "Users can read words"
  on public.words
  for select
  using (auth.role() = 'authenticated');

create policy "Users can read own progress"
  on public.user_progress
  for select
  using (auth.role() = 'authenticated' and user_id = auth.uid());

create policy "Users can write own progress"
  on public.user_progress
  for insert, update, delete
  with check (auth.role() = 'authenticated' and user_id = auth.uid())
  using (auth.role() = 'authenticated' and user_id = auth.uid());

create policy "Only admins can manage words"
  on public.words
  for all
  using (
    exists (
      select 1
      from public.admin_users au
      where au.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.admin_users au
      where au.user_id = auth.uid()
    )
  );

create policy "Only service role can read admin_users"
  on public.admin_users
  for select
  using (auth.role() = 'service_role');

create policy "Only service role can write admin_users"
  on public.admin_users
  for insert, update, delete
  with check (auth.role() = 'service_role')
  using (auth.role() = 'service_role');

