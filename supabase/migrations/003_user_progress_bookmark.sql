-- Add a bookmarked flag to user_progress for marking difficult words.

alter table public.user_progress
  add column if not exists bookmarked boolean not null default false;

