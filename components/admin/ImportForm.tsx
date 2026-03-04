'use client';

import { useState, FormEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type ParsedRow = {
  english: string;
  japanese: string;
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
  if (header.toLowerCase() !== "english,japanese") {
    return [
      {
        english: "",
        japanese: "",
        line: 1,
        error: 'Header must be "english,japanese"',
      },
    ];
  }

  const parsed: ParsedRow[] = [];

  rows.forEach((line, index) => {
    const [englishRaw, japaneseRaw] = line.split(",");
    const english = (englishRaw ?? "").trim();
    const japanese = (japaneseRaw ?? "").trim();
    const lineNumber = index + 2;

    if (!english && !japanese) {
      return;
    }

    if (!english || !japanese) {
      parsed.push({
        english,
        japanese,
        line: lineNumber,
        error: "Both english and japanese are required",
      });
      return;
    }

    parsed.push({ english, japanese, line: lineNumber });
  });

  return parsed;
}

export function ImportForm() {
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
      const response = await fetch("/api/admin/import", {
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
          english,japanese
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
            placeholder={"english,japanese\napple,りんご"}
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
            <div className="grid grid-cols-[3rem,1fr,1fr] gap-2 font-medium">
              <div>Line</div>
              <div>English</div>
              <div>Japanese</div>
            </div>
            {firstRows.map((row) => (
              <div
                key={row.line}
                className="mt-1 grid grid-cols-[3rem,1fr,1fr] gap-2"
              >
                <div>{row.line}</div>
                <div>{row.english}</div>
                <div>
                  {row.japanese}
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

