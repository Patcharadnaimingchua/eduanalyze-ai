// No CSV library in this project — small hand-rolled RFC 4180 serializer,
// same "no dependency for something this small" approach as the hand-built
// charts (grade-distribution-chart.tsx, plo-radar-chart.tsx).

// Formula-injection guard: fullName is user-entered and could start with
// = + - @ (or a tab/CR), which Excel/Sheets would interpret as a formula
// on open. Prefixing with ' neutralizes it while staying human-readable.
const FORMULA_PREFIX_PATTERN = /^[=+\-@\t\r]/;

function escapeCsvField(value: string): string {
  const guarded = FORMULA_PREFIX_PATTERN.test(value) ? `'${value}` : value;
  if (/[",\r\n]/.test(guarded)) {
    return `"${guarded.replace(/"/g, '""')}"`;
  }
  return guarded;
}

export function toCsv(headers: string[], rows: string[][]): string {
  return [headers, ...rows]
    .map((row) => row.map(escapeCsvField).join(','))
    .join('\r\n');
}

function stripBom(text: string): string {
  return text.startsWith('﻿') ? text.slice(1) : text;
}

// Undoes escapeCsvField's guard. Ambiguous by nature: a value the user really
// typed as '=x is indistinguishable from a guarded =x, so it decodes to =x.
// Acceptable — the guard is lossy at the source, and no field we import
// (studentCode/score/status) can legitimately start with an apostrophe.
function unguardFormulaPrefix(value: string): string {
  return value.startsWith("'") && FORMULA_PREFIX_PATTERN.test(value.slice(1))
    ? value.slice(1)
    : value;
}

// Starts just past the opening quote. An unterminated quote is tolerated
// rather than thrown on — the import preview reports bad rows, and a parse
// that dies on the first malformed byte can't show the user what to fix.
function readQuotedField(src: string, start: number): { value: string; next: number } {
  let value = '';
  let i = start;
  while (i < src.length) {
    if (src[i] !== '"') {
      value += src[i];
      i += 1;
    } else if (src[i + 1] === '"') {
      value += '"';
      i += 2;
    } else {
      return { value, next: i + 1 };
    }
  }
  return { value, next: i };
}

function readBareField(src: string, start: number): { value: string; next: number } {
  let i = start;
  while (i < src.length && src[i] !== ',' && src[i] !== '\r' && src[i] !== '\n') {
    i += 1;
  }
  return { value: src.slice(start, i), next: i };
}

function skipLineBreak(src: string, i: number): number {
  if (src[i] === '\r' && src[i + 1] === '\n') return i + 2;
  if (src[i] === '\r' || src[i] === '\n') return i + 1;
  return i;
}

// Inverse of toCsv: parseCsv(toCsv(headers, rows)) round-trips. Accepts both
// CRLF and LF, strips the BOM downloadCsv writes, and reverses the formula
// guard. Returns raw cells only — header interpretation belongs to callers.
export function parseCsv(text: string): string[][] {
  const src = stripBom(text);
  if (src === '') return [];

  const rows: string[][] = [];
  let row: string[] = [];
  let i = 0;

  // Reads a field first on every pass, so a trailing comma still yields the
  // empty field after it ("a," is two cells, not one).
  while (true) {
    const field = src[i] === '"' ? readQuotedField(src, i + 1) : readBareField(src, i);
    row.push(unguardFormulaPrefix(field.value));
    i = field.next;

    if (src[i] === ',') {
      i += 1;
      continue;
    }

    rows.push(row);
    row = [];
    if (i >= src.length) break;
    i = skipLineBreak(src, i);
    // A line break at the very end terminates the data — no phantom last row.
    if (i >= src.length) break;
  }

  return rows;
}

// UTF-8 BOM so Excel (Windows especially) doesn't mis-decode Thai text.
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
