-- =============================================================================
-- Future-ready schema additions for the Eiken flashcard app (optional)
-- Run this AFTER 001_init.sql when you are ready to use these features.
-- =============================================================================

-- Word sets / levels (e.g. Eiken 3, Eiken 2, custom decks)
create table if not exists public.word_sets (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique, -- e.g. 'eiken-3-core'
  name text not null,
  description text,
  level text,                -- e.g. 'EIKEN_3', 'EIKEN_PRE2'
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Optional mapping table if a word can belong to multiple sets
create table if not exists public.word_set_words (
  word_set_id uuid not null references public.word_sets(id) on delete cascade,
  word_id uuid not null references public.words(id) on delete cascade,
  primary key (word_set_id, word_id)
);

create index if not exists idx_word_set_words_set_id
  on public.word_set_words (word_set_id);

-- Example sentences per word
create table if not exists public.word_examples (
  id uuid primary key default gen_random_uuid(),
  word_id uuid not null references public.words(id) on delete cascade,
  sentence_en text not null,
  sentence_ja text,
  audio_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_word_examples_word_id
  on public.word_examples (word_id);

-- Study sessions (for analytics / DAU / retention, etc.)
create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  client_meta jsonb, -- device, app version, etc.
  created_at timestamptz not null default now()
);

create index if not exists idx_study_sessions_user_started
  on public.study_sessions (user_id, started_at);

-- Fine-grained study events (per card answer)
create table if not exists public.study_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id uuid not null references public.words(id) on delete cascade,
  session_id uuid references public.study_sessions(id) on delete set null,
  direction text not null, -- 'EN_TO_JA', 'JA_TO_EN', 'SPELLING', etc.
  correct boolean not null,
  answered_at timestamptz not null default now(),
  latency_ms integer,
  extra jsonb, -- room for SRS parameters, difficulty, etc.
  created_at timestamptz not null default now()
);

create index if not exists idx_study_events_user_answered
  on public.study_events (user_id, answered_at);

create index if not exists idx_study_events_word_id
  on public.study_events (word_id);

-- Simple subscription model for future monetization
create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique, -- e.g. 'free', 'pro'
  name text not null,
  description text,
  is_active boolean not null default true,
  limits jsonb, -- e.g. max_words_per_day, etc.
  created_at timestamptz not null default now()
);

create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id) on delete restrict,
  status text not null default 'active', -- 'active', 'canceled', 'trial', etc.
  started_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_subscriptions_user_status
  on public.user_subscriptions (user_id, status);

-- Enable RLS on user-scoped tables
alter table public.study_sessions enable row level security;
alter table public.study_events enable row level security;
alter table public.user_subscriptions enable row level security;

-- Word-set & example tables are managed by admins; reuse the same admin pattern
alter table public.word_sets enable row level security;
alter table public.word_set_words enable row level security;
alter table public.word_examples enable row level security;
alter table public.subscription_plans enable row level security;

-- RLS: study_sessions (users only see their own)
create policy if not exists \"study_sessions_select_own\"
  on public.study_sessions
  for select
  to authenticated
  using (user_id = auth.uid());

create policy if not exists \"study_sessions_insert_own\"
  on public.study_sessions
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy if not exists \"study_sessions_update_own\"
  on public.study_sessions
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- RLS: study_events (users only see their own)
create policy if not exists \"study_events_select_own\"
  on public.study_events
  for select
  to authenticated
  using (user_id = auth.uid());

create policy if not exists \"study_events_insert_own\"
  on public.study_events
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- RLS: user_subscriptions (users only see their own; writes typically via backend)
create policy if not exists \"user_subscriptions_select_own\"
  on public.user_subscriptions
  for select
  to authenticated
  using (user_id = auth.uid());

-- Admin-only management for word_sets, word_examples, subscription_plans
create policy if not exists \"word_sets_admin_all\"
  on public.word_sets
  for all
  to authenticated
  using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

create policy if not exists \"word_set_words_admin_all\"
  on public.word_set_words
  for all
  to authenticated
  using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

create policy if not exists \"word_examples_admin_all\"
  on public.word_examples
  for all
  to authenticated
  using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

create policy if not exists \"subscription_plans_admin_all\"
  on public.subscription_plans
  for all
  to authenticated
  using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

