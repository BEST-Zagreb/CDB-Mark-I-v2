"use client";

import { useRef, useState } from "react";
import { Download, FileSpreadsheet, Save, Upload, X } from "lucide-react";
import type { CompanyFormData } from "@/types/company";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

type BulkCreateResult = {
  createdCount: number;
  createdIds: number[];
  skipped: Array<{ index: number; name: string; reason: string }>;
  failed: Array<{ index: number; name: string; error: string }>;
};

type ColumnKey = keyof CompanyFormData;

const COLUMNS: Array<{
  key: ColumnKey;
  label: string;
  required?: boolean;
}> = [
  { key: "name", label: "Company Name", required: true },
  { key: "country", label: "Country", required: true },
  { key: "url", label: "Website URL" },
  { key: "phone", label: "Phone" },
  { key: "address", label: "Address" },
  { key: "city", label: "City" },
  { key: "zip", label: "ZIP" },
  { key: "budgeting_month", label: "Budgeting Month" },
  { key: "comment", label: "Comment" },
];

function normalizeHeader(header: unknown) {
  return (header ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/_/g, "");
}

const HEADER_TO_KEY: Record<string, ColumnKey> = {
  name: "name",
  companyname: "name",
  naziv: "name",
  nazivtvrtke: "name",

  country: "country",
  država: "country",
  drzava: "country",

  url: "url",
  website: "url",
  websiteurl: "url",
  web: "url",

  phone: "phone",
  telefon: "phone",
  mobitel: "phone",

  address: "address",
  adresa: "address",

  city: "city",
  grad: "city",

  zip: "zip",
  zipcode: "zip",
  postanskibroj: "zip",

  budgetingmonth: "budgeting_month",
  budgeting_month: "budgeting_month",
  mjesecbudzetiranja: "budgeting_month",

  comment: "comment",
  komentar: "comment",
  napomena: "comment",
};

function downloadCompaniesTemplate() {
  const headers = COLUMNS.map((c) => c.label);
  const example: string[] = COLUMNS.map((c) => {
    if (c.key === "name") return "Example d.o.o.";
    if (c.key === "country") return "Croatia";
    if (c.key === "url") return "www.example.com";
    return "";
  });

  const sheet = XLSX.utils.aoa_to_sheet([headers, example]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Companies");

  const instructions = XLSX.utils.aoa_to_sheet([
    ["Instructions"],
    ["- Fill in one company per row"],
    ["- Required: Company Name, Country"],
    ["- Keep the header row unchanged"],
  ]);
  XLSX.utils.book_append_sheet(workbook, instructions, "Instructions");

  const data = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([data],
    {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "template.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function readCompaniesFromWorkbook(buffer: ArrayBuffer): CompanyFormData[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  if (!sheet) return [];

  const aoa = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    blankrows: false,
    defval: "",
  }) as unknown[][];

  if (aoa.length < 2) return [];

  const rawHeaders = aoa[0] ?? [];
  const headerKeys = rawHeaders
    .map(normalizeHeader)
    .map((h) => HEADER_TO_KEY[h] ?? null);

  const hasAnyMapped = headerKeys.some(Boolean);

  const rows: CompanyFormData[] = [];
  for (let i = 1; i < aoa.length; i++) {
    const row = aoa[i] ?? [];

    const obj: CompanyFormData = {
      name: "",
      url: "",
      address: "",
      city: "",
      zip: "",
      country: "",
      phone: "",
      budgeting_month: "",
      comment: "",
    };

    if (hasAnyMapped) {
      for (let c = 0; c < row.length; c++) {
        const key = headerKeys[c];
        if (!key) continue;
        obj[key] = (row[c] ?? "").toString();
      }
    } else {
      // Fallback: assume template column order
      for (let c = 0; c < COLUMNS.length; c++) {
        const key = COLUMNS[c]?.key;
        if (!key) continue;
        obj[key] = (row[c] ?? "").toString();
      }
    }

    const isBlank = Object.values(obj).every((v) => v.toString().trim() === "");
    if (!isBlank) rows.push(obj);
  }

  return rows;
}

export function BulkCompaniesDialog({
  open,
  onOpenChange,
  onSave,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (rows: CompanyFormData[]) => Promise<BulkCreateResult>;
  isSaving: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<CompanyFormData[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  const [resultOpen, setResultOpen] = useState(false);
  const [result, setResult] = useState<BulkCreateResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSave = parsedRows.length > 0 && !isSaving;

  const parseFile = async (nextFile: File) => {
    setParseError(null);
    setParsedRows([]);
    setFile(nextFile);

    try {
      const buffer = await nextFile.arrayBuffer();
      const rows = readCompaniesFromWorkbook(buffer);
      if (rows.length === 0) {
        setParseError("No data rows found. Make sure the first sheet contains a header row and at least one company.");
        return;
      }
      setParsedRows(rows);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to parse Excel file";
      setParseError(msg);
    }
  };

  const handleClose = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setResultOpen(false);
      setResult(null);
      setFile(null);
      setParsedRows([]);
      setParseError(null);
    }
  };

  const handleSave = async () => {
    if (!canSave) return;

    const res = await onSave(parsedRows);
    setResult(res);
    setResultOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Add multiple companies</DialogTitle>
            <DialogDescription>
              Download the template, fill it in Excel, then upload it here. We will create all new companies and skip duplicates by name (case-insensitive + trim).
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between gap-2">
            <Button type="button" variant="outline" onClick={downloadCompaniesTemplate} disabled={isSaving}>
              <Download className="size-4" />
              Download template.xlsx
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSaving}
            >
              <Upload className="size-4" />
              Choose file
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void parseFile(f);
              }}
            />
          </div>

          <div
            className={cn(
              "rounded-md border border-dashed p-6 transition-colors",
              "flex flex-col items-center justify-center text-center gap-2",
              "bg-muted/20",
              isSaving && "opacity-60"
            )}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
            }}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) void parseFile(f);
            }}
          >
            <FileSpreadsheet className="size-8 text-muted-foreground" />
            <div className="text-sm">
              Drag and drop your filled <span className="font-medium">.xlsx</span> here
            </div>
            <div className="text-xs text-muted-foreground">
              First sheet should contain the header row.
            </div>
          </div>

          {file && (
            <div className="flex items-center justify-between gap-2 rounded-md border p-3">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{file.name}</div>
                <div className="text-xs text-muted-foreground">
                  {parseError
                    ? "Failed to parse"
                    : `${parsedRows.length} row(s) parsed`}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setFile(null);
                  setParsedRows([]);
                  setParseError(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                disabled={isSaving}
                aria-label="Remove file"
              >
                <X className="size-4" />
              </Button>
            </div>
          )}

          {parseError && (
            <div className="text-sm text-destructive">{parseError}</div>
          )}

          <div className="text-xs text-muted-foreground">
            Required columns: Company Name, Country. You can rename headers, but keep them recognizable (e.g. “Company Name”, “Country”).
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>

            <Button type="button" onClick={handleSave} disabled={!canSave}>
              <Save className="size-4" />
              {isSaving ? "Saving..." : "Save companies"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Bulk add result</DialogTitle>
            <DialogDescription>
              {result
                ? `Created ${result.createdCount} compan${result.createdCount === 1 ? "y" : "ies"}.`
                : ""}
            </DialogDescription>
          </DialogHeader>

          {result && (
            <div className="space-y-4">
              {result.skipped.length > 0 && (
                <div>
                  <div className="font-medium mb-2">Skipped</div>
                  <ul className="space-y-1 text-sm text-muted-foreground max-h-40 overflow-auto">
                    {result.skipped
                      .sort((a, b) => a.index - b.index)
                      .map((s) => (
                        <li key={`sk-${s.index}-${s.name}`}>
                          Row {s.index + 2}: {s.name || "(no name)"} — {s.reason}
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {result.failed.length > 0 && (
                <div>
                  <div className="font-medium mb-2 text-destructive">Errors</div>
                  <ul className="space-y-1 text-sm text-muted-foreground max-h-40 overflow-auto">
                    {result.failed
                      .sort((a, b) => a.index - b.index)
                      .map((f) => (
                        <li key={`fl-${f.index}-${f.name}`}>
                          Row {f.index + 2}: {f.name || "(no name)"} — {f.error}
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {result.skipped.length === 0 && result.failed.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  All companies were created successfully.
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" onClick={() => setResultOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
