import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type ImportRequestBody = {
  csvText?: string;
};

function parseCsv(csvText: string) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    throw new Error("CSV is empty");
  }

  const [header, ...rows] = lines;
  if (header.toLowerCase() !== "english,japanese") {
    throw new Error('Header must be "english,japanese"');
  }

  const records: { english: string; japanese: string }[] = [];

  rows.forEach((line, index) => {
    const [englishRaw, japaneseRaw] = line.split(",");
    const english = (englishRaw ?? "").trim();
    const japanese = (japaneseRaw ?? "").trim();

    if (!english && !japanese) {
      return;
    }

    if (!english || !japanese) {
      throw new Error(
        `Both english and japanese are required (line ${index + 2})`,
      );
    }

    records.push({ english, japanese });
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

    const { error: insertError } = await supabase.from("words").insert(records);

    if (insertError) {
      return NextResponse.json(
        { ok: false, error: insertError.message },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: `Imported ${records.length} words`,
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

