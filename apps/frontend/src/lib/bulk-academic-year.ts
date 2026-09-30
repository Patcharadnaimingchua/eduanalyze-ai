import type {
  BulkCreateAcademicYearsResponse,
  SemesterTerm,
} from '@eduanalyze-ai/shared-types';
import { bulkCreateAcademicYears } from '@/lib/api/admin';
import { SEMESTER_TERM_LABELS } from '@/lib/grade-label';

export const ALL_TERMS: SemesterTerm[] = ['FIRST', 'SECOND', 'SUMMER'];

export type ResultStatus = 'created' | 'skipped';
export type ResultRow = { label: string; status: ResultStatus };

export function flattenBulkResult(result: BulkCreateAcademicYearsResponse): ResultRow[] {
  return result.years.flatMap((y) => [
    { label: `ปีการศึกษา ${y.year}`, status: y.status },
    ...y.semesters.map((s) => ({
      label: `${y.year} ${SEMESTER_TERM_LABELS[s.term]}`,
      status: s.status,
    })),
  ]);
}

// One atomic request: the server creates every missing year/term in a single
// transaction, so an error means nothing was saved.
export async function bulkGenerateAcademicYears(
  startYear: number,
  count: number,
  terms: SemesterTerm[] = ALL_TERMS,
): Promise<ResultRow[]> {
  const result = await bulkCreateAcademicYears({ startYear, yearCount: count, terms });
  return flattenBulkResult(result);
}
