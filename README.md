## Eiken Grade 3 Vocabulary Flashcard App (MVP)

Minimal Next.js + Supabase app for studying Eiken Grade 3 vocabulary with basic admin tooling.

### Tech stack

- Next.js (App Router) + TypeScript (strict)
- Tailwind CSS (v4) + shadcn/ui
- Supabase (Auth + Postgres)
- ESLint + Prettier
- Playwright for basic E2E tests

### Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a Supabase project**

   - Go to the Supabase dashboard and create a new project.
   - Note your project URL and `anon` public API key from the API settings.

3. **Configure environment variables**

   - Copy `.env.example` to `.env.local`:

     ```bash
     cp .env.example .env.local
     ```

   - Fill in:

     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **Apply database migrations**  
   → 手順の詳細は下記「[Supabaseでのセットアップ手順](#supabaseでのセットアップ手順)」を参照。

5. **Create the first user and admin**  
   → 同上。最初の管理者は SQL Editor で `admin_users` に 1 件 insert してください。

### Supabaseでのセットアップ手順

1. **Supabase プロジェクトを作成**
   - [Supabase Dashboard](https://supabase.com/dashboard) で New Project を作成する。
   - プロジェクトの **Settings > API** で、`Project URL` と `anon` の **public** key を控える。

2. **SQL Editor で初期スキーマを実行**
   - ダッシュボード左メニュー **SQL Editor** を開く。
   - **New query** で新規クエリを作成し、リポジトリの **`supabase/migrations/001_init.sql`** の内容をすべてコピーして貼り付ける。
   - **Run** を実行する。  
     → `words` / `user_progress` / `admin_users` の 3 テーブルと RLS ポリシーが作成される。

3. **最初の管理者の追加**
   - **Authentication > Users** で「Add user」からテスト用ユーザー（メール・パスワード）を作成する。
   - 作成したユーザーをクリックし、**User UID**（UUID）をコピーする。
   - **SQL Editor** で次の SQL を実行する（`<YOUR-USER-UUID>` をコピーした UID に置き換える）:
     ```sql
     insert into public.admin_users (user_id) values ('<YOUR-USER-UUID>');
     ```
   - SQL Editor はサービス側の権限で実行されるため、RLS の制限を受けずに 1 件目を追加できる。  
   - これでそのユーザーでログインすると、単語の追加・編集（CSV インポート含む）が可能になる。

4. **ありがちなエラー・注意**
   - **「permission denied」「row-level security」で弾かれる**  
     ログインに使っているユーザーが `admin_users` に含まれていないと、`words` の INSERT/UPDATE/DELETE や CSV インポートが RLS で拒否されます。上記 3 の手順で必ず 1 人以上を `admin_users` に追加してください。
   - **既に別のマイグレーション（例: 0001_init.sql）を実行済みの場合**  
     `001_init.sql` は「初回セットアップ用」です。既存 DB にそのまま流すとポリシー名や定義が重複してエラーになることがあります。新規プロジェクトで未実行の状態で 1 回だけ実行する想定です。
   - **anon key と service role key**  
     アプリの `.env.local` に置くのは **anon（public）key** だけにしてください。service role key は RLS をバイパスするため、クライアントやサーバーコードに含めないでください。

### Running the app

- **Dev server**

  ```bash
  npm run dev
  ```

- **Lint**

  ```bash
  npm run lint
  ```

- **E2E tests (Playwright)**

  ```bash
  npx playwright install
  npm run test:e2e
  ```

  The Playwright config will start the Next.js dev server automatically.

### Routes

- `/login`
  - Email/password login form (Supabase Auth).
  - If the user is already logged in, redirects to `/study`.

- `/study`
  - Auth-required.
  - Flashcard UI shell with mode hint (EN→JA / JA→EN), reveal answer button, and correct/wrong buttons (persistence wiring is left for later).

- `/admin`
  - Auth-required.
  - Admin dashboard shell with links to:
    - `/admin/words`
    - `/admin/import`
  - Actual admin rights are enforced at the database level via the `admin_users` table and RLS policies.

- `/admin/words`
  - Auth-required.
  - Table shell for listing vocabulary (`words` table). Data fetching is not implemented yet in the MVP.

- `/admin/import`
  - Auth-required.
  - CSV import UI:
    - Textarea to paste CSV.
    - File upload that auto-loads into the textarea.
    - **Preview** button: shows the first 10 parsed rows and any per-row validation errors (client-side).
    - **Import** button: sends the raw CSV text to `/api/admin/import`, where it is parsed and inserted into `words` with server-side validation.

### Data model & security

- See `supabase/README.md` for full details.
- Summary:
  - `words`: public vocabulary; all authenticated users can read; only admins (in `admin_users`) can write。CSV インポートなどで同じ単語が重複しないように、`lower(english), japanese` にユニークインデックスを張っており、大文字小文字だけ違う重複を防いでいます。
  - `user_progress`: per-user stats for each word; users can read/write only their own rows.
  - `admin_users`: allowlist of admin user ids; only the `service_role` key can manage it.

### Design choices / notes

- **Admin check**:
  - The simplest reliable approach is used: an `admin_users` table with `user_id` rows.
  - Row-level security ensures only admins can modify `words`, even if a route handler is misconfigured.
  - The API route for CSV import (`/api/admin/import`) also runs under RLS, so non-admins will receive an error if they try to import.

- **CSV parsing**:
  - Expected header: `english,japanese` (lowercase, in that order).
  - Client-side preview parses and displays the first 10 rows and inline validation errors.
  - Server-side import re-parses and validates the CSV before inserting into `words` to avoid trusting client parsing.

- **Ambiguities / assumptions**:
  - Sign-up / password reset flows are not implemented; you can create users via the Supabase dashboard or add your own flows later.
  - Study logic (spaced repetition, selection of next word, updating `user_progress`) is not implemented yet; `/study` is a UI shell ready to be wired to Supabase.
  - Admin-only UI enforcement (e.g. hiding `/admin` for non-admins) is not implemented yet; authorization is enforced in the database layer first.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
