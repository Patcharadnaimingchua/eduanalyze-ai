'use client';

import { useRef, useState } from 'react';
import type { StudentRosterEntry } from '@eduanalyze-ai/shared-types';
import {
  executeScoreImport,
  parseScoreCsv,
  ScoreCsvFormatError,
  type ImportResultRow,
  type ParsedScoreRow,
  type ReadyScoreRow,
} from '@/lib/assessment-score-import';
import { ASSESSMENT_SCORE_STATUS_LABELS } from '@/lib/grade-label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Inline rather than a modal: there is no Dialog primitive in this project
// and adding one for a single flow would mean a new Radix dependency. Same
// shape as bulk-academic-year-form's inline result panel.

function PreviewTable({ rows }: Readonly<{ rows: ParsedScoreRow[] }>) {
  return (
    <div className="max-h-72 overflow-auto rounded-md border border-slate-200">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-slate-50">
          <tr className="border-b border-slate-100 text-left text-xs text-muted-foreground">
            <th className="px-3 py-2 font-medium">แถว</th>
            <th className="px-3 py-2 font-medium">รหัสนักศึกษา</th>
            <th className="px-3 py-2 font-medium">ชื่อ-นามสกุล</th>
            <th className="px-3 py-2 font-medium">สถานะ</th>
            <th className="px-3 py-2 font-medium">คะแนน</th>
            <th className="px-3 py-2 font-medium">ผล</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.rowNumber} className="border-b border-slate-50">
              <td className="px-3 py-2 text-muted-foreground">{row.rowNumber}</td>
              <td className="px-3 py-2 text-primary">{row.studentCode || '—'}</td>
              <td className="px-3 py-2 text-muted-foreground">{row.fullName || '—'}</td>
              <td className="px-3 py-2 text-muted-foreground">
                {row.verdict === 'ready'
                  ? ASSESSMENT_SCORE_STATUS_LABELS[row.status]
                  : row.statusText.trim() || '—'}
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {row.verdict === 'ready'
                  ? (row.score ?? '—')
                  : row.scoreText.trim() || '—'}
              </td>
              <td className="px-3 py-2">
                {row.verdict === 'ready' ? (
                  <Badge tone="green">พร้อมนำเข้า</Badge>
                ) : (
                  <span className="text-xs text-destructive">{row.error}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResultList({ results }: Readonly<{ results: ImportResultRow[] }>) {
  const imported = results.filter((r) => r.outcome === 'imported').length;
  const failed = results.filter((r) => r.outcome === 'failed');

  return (
    <div className="space-y-2 rounded-md border border-slate-200 p-3">
      <p className="text-sm text-primary">
        นำเข้าสำเร็จ {imported} รายการ
        {failed.length > 0 && ` · ผิดพลาด ${failed.length} รายการ`}
      </p>
      {failed.length > 0 && (
        <ul className="space-y-1">
          {failed.map((r) => (
            <li key={r.rowNumber} className="flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">
                แถว {r.rowNumber} · {r.studentCode}
              </span>
              <span className="text-destructive">{r.error}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ScoreCsvImportPanel({
  courseId,
  assessmentCloMappingId,
  roster,
  effectiveMax,
  onImported,
  onClose,
}: Readonly<{
  courseId: string;
  assessmentCloMappingId: string;
  roster: StudentRosterEntry[];
  effectiveMax: number;
  onImported: () => void;
  onClose: () => void;
}>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedScoreRow[] | null>(null);
  const [formatError, setFormatError] = useState<string | null>(null);
  const [results, setResults] = useState<ImportResultRow[] | null>(null);
  const [importing, setImporting] = useState(false);

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Let the same file be picked again after a cancel.
    event.target.value = '';
    if (!file) return;

    setFileName(file.name);
    setRows(null);
    setResults(null);
    setFormatError(null);

    try {
      setRows(parseScoreCsv(await file.text(), roster, effectiveMax));
    } catch (error) {
      setFormatError(
        error instanceof ScoreCsvFormatError ? error.message : 'ไม่สามารถอ่านไฟล์นี้ได้',
      );
    }
  }

  async function onConfirm() {
    if (!rows) return;
    const ready = rows.filter((row): row is ReadyScoreRow => row.verdict === 'ready');
    setImporting(true);
    try {
      setResults(await executeScoreImport(ready, { courseId, assessmentCloMappingId }));
      onImported();
    } finally {
      setImporting(false);
    }
  }

  const readyCount = rows?.filter((r) => r.verdict === 'ready').length ?? 0;
  const invalidCount = (rows?.length ?? 0) - readyCount;

  return (
    <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50/50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-primary">นำเข้าคะแนนจากไฟล์ CSV</p>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          ปิด
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        คะแนนจะถูกบันทึกเข้ากับ assessment และ CLO ที่เลือกไว้ด้านบน โดยอ้างอิงการลงทะเบียนครั้งล่าสุดของนักศึกษา
        หากนำเข้าไฟล์เดิมซ้ำ ระบบจะเขียนทับค่าเดิม ไม่สร้างรายการซ้ำ
      </p>

      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={onFileChange}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          เลือกไฟล์ CSV
        </Button>
        {fileName && <span className="text-xs text-muted-foreground">{fileName}</span>}
      </div>

      {formatError && (
        <Alert variant="destructive">
          <AlertDescription>{formatError}</AlertDescription>
        </Alert>
      )}

      {rows && !results && (
        <div className="space-y-3">
          <p className="text-sm text-primary">
            ตรวจไฟล์แล้ว {rows.length} แถว · พร้อมนำเข้า {readyCount}
            {invalidCount > 0 && ` · ผิดพลาด ${invalidCount}`}
          </p>
          <PreviewTable rows={rows} />
          {invalidCount > 0 && (
            <p className="text-xs text-muted-foreground">
              แถวที่ผิดพลาดจะไม่ถูกนำเข้า แก้ไขไฟล์แล้วเลือกใหม่อีกครั้งเพื่อนำเข้าส่วนที่เหลือ
            </p>
          )}
          <div className="flex gap-2">
            <Button type="button" onClick={onConfirm} disabled={importing || readyCount === 0}>
              {importing ? 'กำลังนำเข้า...' : `ยืนยันนำเข้า ${readyCount} แถว`}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={importing}>
              ยกเลิก
            </Button>
          </div>
        </div>
      )}

      {results && <ResultList results={results} />}
    </div>
  );
}
