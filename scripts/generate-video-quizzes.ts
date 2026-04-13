/**
 * YouTube プレイリストの各動画から、字幕を元にClaudeで確認テスト問題を生成し
 * video_quiz_questions テーブル用のSQLを出力するスクリプト。
 *
 * 使い方:
 *   1. 依存インストール:
 *      npm i -D @anthropic-ai/sdk youtube-transcript tsx
 *   2. 環境変数を設定:
 *      export ANTHROPIC_API_KEY=sk-ant-...
 *      (必要なら) export PLAYLIST_ID=PL4XvPDGlQIXzcAw-I7w8LNsyblSUr7KLR
 *   3. 実行:
 *      npx tsx scripts/generate-video-quizzes.ts > out/video-quizzes.sql
 *   4. 生成されたSQLをSupabase SQL Editorで実行
 *
 * 注意:
 *   - 一度実行すれば良い（結果はDBに保存されるため）
 *   - 31本×5問生成でAPIコスト約$0.50（claude-haiku-4-5使用）
 *   - 字幕が取れなかった動画はタイトルのみで生成する
 */

import Anthropic from "@anthropic-ai/sdk";
import { YoutubeTranscript } from "youtube-transcript";
import { execSync } from "node:child_process";

const PLAYLIST_ID =
  process.env.PLAYLIST_ID ?? "PL4XvPDGlQIXzcAw-I7w8LNsyblSUr7KLR";
const QUESTIONS_PER_VIDEO = 5;
const MODEL = "claude-haiku-4-5-20251001";

type VideoInfo = {
  id: string;
  title: string;
};

type QuizQuestion = {
  question_text: string;
  choice_1: string;
  choice_2: string;
  choice_3: string;
  choice_4: string;
  correct_choice: 1 | 2 | 3 | 4;
  explanation: string;
};

function fetchPlaylistVideos(playlistId: string): VideoInfo[] {
  // yt-dlp でプレイリストの動画一覧を取得（ローカルでの実行を想定）
  const raw = execSync(
    `yt-dlp --flat-playlist --print "%(id)s|%(title)s" "https://www.youtube.com/playlist?list=${playlistId}"`,
    { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
  );
  return raw
    .trim()
    .split("\n")
    .map((line) => {
      const [id, ...titleParts] = line.split("|");
      return { id: id.trim(), title: titleParts.join("|").trim() };
    })
    .filter((v) => v.id);
}

async function fetchTranscript(videoId: string): Promise<string | null> {
  try {
    const items = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: "ja",
    });
    return items.map((i) => i.text).join(" ");
  } catch {
    try {
      const items = await YoutubeTranscript.fetchTranscript(videoId);
      return items.map((i) => i.text).join(" ");
    } catch {
      return null;
    }
  }
}

function buildPrompt(
  title: string,
  transcript: string | null,
  n: number,
): string {
  const contentBlock = transcript
    ? `動画の字幕（文字起こし）:\n${transcript.slice(0, 8000)}`
    : `動画タイトルから推測される内容に基づいて問題を作ってください。`;

  return `あなたは英検3級の熟練教師です。以下のYouTube学習動画の内容を元に、動画を見た学習者（中学生）が「ちゃんと理解できたか」を確認する4択問題を${n}問作成してください。

動画タイトル: ${title}

${contentBlock}

作問ルール:
- 動画で実際に説明された文法ポイントのみを扱う（動画に出てこない別の文法事項は出さない）
- 簡単すぎず、難しすぎず、中学生が理解を確認できる難易度
- 問題文は英文＋日本語の指示を含める（例: "次の文の( )に入る最も適切なものを選びなさい。He ( ) a student."）
- 選択肢は4つ、すべて紛らわしさが適切にあるもの
- 解説は簡潔に日本語で（30文字以内）
- 問題は重複しないよう多様性を持たせる

必ず以下のJSON形式のみで出力してください。前置きや説明は不要:

{
  "questions": [
    {
      "question_text": "次の文の( )に入る最も適切なものを選びなさい。He ( ) a student.",
      "choice_1": "is",
      "choice_2": "are",
      "choice_3": "am",
      "choice_4": "be",
      "correct_choice": 1,
      "explanation": "主語がheなのでisを使います"
    }
  ]
}`;
}

async function generateQuestions(
  client: Anthropic,
  title: string,
  transcript: string | null,
): Promise<QuizQuestion[]> {
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 3000,
    messages: [
      {
        role: "user",
        content: buildPrompt(title, transcript, QUESTIONS_PER_VIDEO),
      },
    ],
  });

  const textBlock = res.content.find((c) => c.type === "text");
  if (!textBlock || textBlock.type !== "text") return [];
  const text = textBlock.text;

  // JSONの抽出（余計なテキストが混ざる可能性に備える）
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return [];

  try {
    const parsed = JSON.parse(match[0]) as { questions: QuizQuestion[] };
    return parsed.questions ?? [];
  } catch (e) {
    console.error(`JSON parse failed: ${e}`);
    return [];
  }
}

function escapeSql(s: string): string {
  return s.replace(/'/g, "''");
}

function toSqlValue(q: QuizQuestion, videoId: string, order: number): string {
  return `('${escapeSql(videoId)}','${escapeSql(q.question_text)}','${escapeSql(q.choice_1)}','${escapeSql(q.choice_2)}','${escapeSql(q.choice_3)}','${escapeSql(q.choice_4)}',${q.correct_choice},'${escapeSql(q.explanation ?? "")}',${order})`;
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ERROR: ANTHROPIC_API_KEY is not set");
    process.exit(1);
  }
  const client = new Anthropic({ apiKey });

  console.error(`Fetching playlist: ${PLAYLIST_ID}`);
  const videos = fetchPlaylistVideos(PLAYLIST_ID);
  console.error(`Found ${videos.length} videos`);

  const allInserts: string[] = [];

  for (let i = 0; i < videos.length; i++) {
    const v = videos[i];
    console.error(`[${i + 1}/${videos.length}] ${v.title} (${v.id})`);

    const transcript = await fetchTranscript(v.id);
    if (transcript) {
      console.error(`  transcript: ${transcript.length} chars`);
    } else {
      console.error(`  transcript: UNAVAILABLE (falling back to title-only)`);
    }

    const questions = await generateQuestions(client, v.title, transcript);
    console.error(`  generated ${questions.length} questions`);

    questions.forEach((q, idx) => {
      allInserts.push(toSqlValue(q, v.id, idx + 1));
    });

    // Simple rate limiting
    await new Promise((r) => setTimeout(r, 500));
  }

  if (allInserts.length === 0) {
    console.error("No questions generated. Aborting SQL output.");
    process.exit(1);
  }

  console.log(
    `-- Generated on ${new Date().toISOString()} for playlist ${PLAYLIST_ID}`,
  );
  console.log(`-- ${allInserts.length} questions from ${videos.length} videos`);
  console.log(
    `insert into public.video_quiz_questions (video_id, question_text, choice_1, choice_2, choice_3, choice_4, correct_choice, explanation, display_order) values`,
  );
  console.log(allInserts.join(",\n") + ";");
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
