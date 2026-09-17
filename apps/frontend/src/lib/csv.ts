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
