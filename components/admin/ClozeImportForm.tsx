'use client';

import { useState, FormEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type ParsedRow = {
  question_text: string;
  choice_1: string;
  choice_2: string;
  choice_3: string;
  choice_4: string;
  correct_choice: string;
  explanation: string;
  line: number;
  error?: string;
};

function parseCsv(csvText: string): ParsedRow[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return [];
  }

  const [header, ...rows] = lines;
  if (
    header.toLowerCase() !==
    "question_text,choice_1,choice_2,choice_3,choice_4,correct_choice,explanation"
  ) {
    return [
      {
        question_text: "",
        choice_1: "",
        choice_2: "",
        choice_3: "",
        choice_4: "",
        correct_choice: "",
        explanation: "",
        line: 1,
        error:
          'Header must be "question_text,choice_1,choice_2,choice_3,choice_4,correct_choice,explanation"',
      },
    ];
  }

  const parsed: ParsedRow[] = [];

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
    const correct_choice = (correctRaw ?? "").trim();
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

    let error: string | undefined;
    const correctNum = Number(correct_choice);
    if (
      !question_text ||
      !choice_1 ||
      !choice_2 ||
      !choice_3 ||
      !choice_4 ||
      !correct_choice
    ) {
      error = "All fields except explanation are required";
    } else if (!Number.isInteger(correctNum) || correctNum < 1 || correctNum > 4) {
      error = "correct_choice must be 1, 2, 3, or 4";
    }

    parsed.push({
      question_text,
      choice_1,
      choice_2,
      choice_3,
      choice_4,
      correct_choice,
      explanation,
      line: lineNumber,
      error,
    });
  });

  return parsed;
}

export function ClozeImportForm() {
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handlePreview(e: FormEvent) {
    e.preventDefault();
    setStatus(null);
    setPreview(parseCsv(csvText));
  }

  async function handleImport(e: FormEvent) {
    e.preventDefault();
    setStatus(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/cloze-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ csvText }),
      });

      const json = (await response.json()) as {
        ok: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok || !json.ok) {
        setStatus(json.error ?? "Import failed");
        return;
      }

      setStatus(json.message ?? "Import completed");
      setPreview([]);
      setCsvText("");
    } catch {
      setStatus("Unexpected error during import");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFileChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    const text = await file.text();
    setCsvText(text);
    setPreview(parseCsv(text));
  }

  const firstRows = preview.slice(0, 10);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Paste CSV text or upload a file with a header row:
        <code className="ml-1 rounded bg-muted px-1 py-0.5 text-xs">
          question_text,choice_1,choice_2,choice_3,choice_4,correct_choice,explanation
        </code>
      </p>
      <form className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            CSV text
          </label>
          <Textarea
            name="csvText"
            rows={8}
            placeholder={
              "question_text,choice_1,choice_2,choice_3,choice_4,correct_choice,explanation\nWho takes part in the Olympic Games? Many famous ( ) from around the world.,passengers,travelers,animals,athletes,4,People who do sports are athletes."
            }
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            className="rounded-xl border-border"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Or upload file
          </label>
          <Input
            type="file"
            name="file"
            accept=".csv,text/csv"
            onChange={(e) => handleFileChange(e.target.files)}
            className="rounded-xl border-border"
          />
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl border-border font-medium"
            onClick={handlePreview}
          >
            Preview
          </Button>
          <Button
            type="button"
            className="w-full rounded-xl font-medium"
            onClick={handleImport}
            disabled={submitting}
          >
            {submitting ? "Importing..." : "Import"}
          </Button>
        </div>
      </form>
      {status && (
        <p
          className={
            status.includes("Imported") || status.includes("completed")
              ? "text-sm text-primary"
              : "text-sm text-destructive"
          }
          aria-live="polite"
        >
          {status}
        </p>
      )}
      {firstRows.length > 0 && (
        <div className="space-y-3">
          <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Preview (first 10 rows)
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-xs">
            <div className="grid grid-cols-[3rem,1fr] gap-2 font-medium">
              <div>Line</div>
              <div>Question</div>
            </div>
            {firstRows.map((row) => (
              <div
                key={row.line}
                className="mt-1 grid grid-cols-[3rem,1fr] gap-2"
              >
                <div>{row.line}</div>
                <div>
                  {row.question_text}
                  {row.error && (
                    <span className="ml-2 text-destructive">{row.error}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

