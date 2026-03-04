## Supabase data model

初期スキーマは `supabase/migrations/001_init.sql` で定義しています。

### Tables

- **words**
  - `id uuid primary key default gen_random_uuid()`
  - `english text not null`
  - `japanese text not null`
  - `created_at timestamptz not null default now()`

- **user_progress**
  - `user_id uuid not null references auth.users(id) on delete cascade`
  - `word_id uuid not null references public.words(id) on delete cascade`
  - `correct_count integer not null default 0`
  - `wrong_count integer not null default 0`
  - `last_answered_at timestamptz`
  - Primary key: `(user_id, word_id)`

- **admin_users**
  - `user_id uuid primary key references auth.users(id) on delete cascade`
  - `created_at timestamptz not null default now()`

### Row Level Security

全テーブルで RLS を有効化。

- **words**
  - `authenticated` は SELECT 可能。
  - INSERT / UPDATE / DELETE は `admin_users` に自分の `auth.uid()` が含まれるユーザーのみ許可。

- **user_progress**
  - SELECT / INSERT / UPDATE は「自分の行」（`user_id = auth.uid()`）のみ許可。

- **admin_users**
  - SELECT / INSERT / DELETE は `admin_users` に自分の `auth.uid()` が含まれるユーザー（＝管理者）のみ許可。  
  - 最初は管理者が 0 人のため、**最初の 1 件は Supabase SQL Editor で `insert` する**必要があります（SQL Editor は RLS をバイパスして実行されます）。手順はプロジェクト直下の README「Supabaseでのセットアップ手順」を参照してください。
