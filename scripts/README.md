# Scripts

## `generate-video-quizzes.ts`

YouTubeプレイリストの各動画から字幕を取得し、Claude APIで確認テスト問題を生成するスクリプト。

### セットアップ

```bash
# 依存パッケージをインストール（devDepsに追加する必要あり）
npm install --save-dev @anthropic-ai/sdk youtube-transcript tsx

# yt-dlp をインストール（プレイリスト取得用）
# Mac: brew install yt-dlp
# Linux: pipx install yt-dlp
```

### 実行

```bash
export ANTHROPIC_API_KEY=sk-ant-xxxxx
# デフォルトは英検3級の学研プレイリスト。別のプレイリストにするなら指定
# export PLAYLIST_ID=PL...

mkdir -p out
npx tsx scripts/generate-video-quizzes.ts > out/video-quizzes.sql
```

### コスト目安

- claude-haiku-4-5 使用、31本×5問生成で **約 $0.30〜0.50**
- 一度生成してDBに保存するので繰り返し実行は不要

### 生成後の手順

```bash
# 1. 出力を確認
less out/video-quizzes.sql

# 2. 最初と最後だけでも目視チェック
head -5 out/video-quizzes.sql
tail -5 out/video-quizzes.sql

# 3. Supabase SQL Editor に貼り付けて実行
```

### うまくいかない場合

- **字幕が取れない動画**: スクリプトは自動的にタイトルのみでフォールバック生成します。
- **特定動画だけ再生成したい**: スクリプトを修正して `videos` を1件だけ返すようにするか、出力SQLから該当行だけ取り出して使う。
- **問題の品質が微妙**: `/admin` で手動編集（※ 管理UIは今後追加予定）。もしくはSQLで直接UPDATE。

### テーブル構造

- `video_quiz_questions`: 問題本体（video_idで各動画に紐付け）
- `video_quiz_attempts`: ユーザーごとの挑戦履歴
