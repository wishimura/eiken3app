import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type ImportRequestBody = {
  csvText?: string;
};

type RecordInput = {
  question_text: string;
  choice_1: string;
  choice_2: string;
  choice_3: string;
  choice_4: string;
  correct_choice: number;
  explanation?: string;
};

function parseCsv(csvText: string): RecordInput[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    throw new Error("CSV is empty");
  }

  const [header, ...rows] = lines;
  if (
    header.toLowerCase() !==
    "question_text,choice_1,choice_2,choice_3,choice_4,correct_choice,explanation"
  ) {
    throw new Error(
      'Header must be "question_text,choice_1,choice_2,choice_3,choice_4,correct_choice,explanation"',
    );
  }

  const records: RecordInput[] = [];

  rows.forEach((line, index) => {
    const parts = line.split(",");
    const [
      questionRaw,
      c1Raw,
      c2Raw,
      c3Raw,
      c4Raw,
      correctRaw,
      explanationRaw,
    ] = parts;

    const question_text = (questionRaw ?? "").trim();
    const choice_1 = (c1Raw ?? "").trim();
    const choice_2 = (c2Raw ?? "").trim();
    const choice_3 = (c3Raw ?? "").trim();
    const choice_4 = (c4Raw ?? "").trim();
    const correct_choice_str = (correctRaw ?? "").trim();
    const explanation = (explanationRaw ?? "").trim();

    const lineNumber = index + 2;

    if (
      !question_text &&
      !choice_1 &&
      !choice_2 &&
      !choice_3 &&
      !choice_4
    ) {
      return;
    }

    if (
      !question_text ||
      !choice_1 ||
      !choice_2 ||
      !choice_3 ||
      !choice_4 ||
      !correct_choice_str
    ) {
      throw new Error(
        `All fields except explanation are required (line ${lineNumber})`,
      );
    }

    const correct_choice = Number(correct_choice_str);
    if (!Number.isInteger(correct_choice) || correct_choice < 1 || correct_choice > 4) {
      throw new Error(
        `correct_choice must be 1, 2, 3, or 4 (line ${lineNumber})`,
      );
    }

    records.push({
      question_text,
      choice_1,
      choice_2,
      choice_3,
      choice_4,
      correct_choice,
      explanation: explanation || undefined,
    });
  });

  if (records.length === 0) {
    throw new Error("No valid rows found");
  }

  return records;
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as ImportRequestBody;
    const csvText = (body.csvText ?? "").trim();

    if (!csvText) {
      return NextResponse.json(
        { ok: false, error: "csvText is required" },
        { status: 400 },
      );
    }

    const records = parseCsv(csvText);

    const { error: insertError } = await supabase
      .from("cloze_questions")
      .insert(records);

    if (insertError) {
      return NextResponse.json(
        { ok: false, error: insertError.message },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: `Imported ${records.length} cloze questions`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error during import";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 400 },
    );
  }
}

