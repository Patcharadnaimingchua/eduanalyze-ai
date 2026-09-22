import { isAxiosError } from 'axios';
import type { SemesterTerm } from '@eduanalyze-ai/shared-types';
import { createAcademicYear, createSemester } from '@/lib/api/admin';
import { fetchAcademicYears } from '@/lib/api/academic-record';
import { SEMESTER_TERM_LABELS } from '@/lib/grade-label';

const TERMS: SemesterTerm[] = ['FIRST', 'SECOND', 'SUMMER'];

export type ResultStatus = 'created' | 'skipped' | 'failed';
export type ResultRow = { label: string; status: ResultStatus };

// Attempts a create and always resolves to a ResultRow instead of throwing —
// a 409 means "already exists" (not an error to report), so the whole batch
// never aborts on a duplicate. See academic-year-form.tsx for the same
// 409-as-friendly-message convention on the single-create path.
async function attemptCreate<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<{ row: ResultRow; value: T | null }> {
  try {
    const value = await fn();
    return { row: { label, status: 'created' }, value };
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 409) {
      return { row: { label, status: 'skipped' }, value: null };
    }
    return { row: { label, status: 'failed' }, value: null };
  }
}

// Sequential on purpose: the server's duplicate check is a read-then-write
// without a transaction, so parallel creates would race past it and fail on
// the DB constraint as a 500 instead of the 409 this batch treats as
// "already exists". Every loop below keeps that one-at-a-time shape.
async function createYears(targetYears: number[]) {
  const rows: ResultRow[] = [];
  const yearIds = new Map<number, string>();

  for (const year of targetYears) {
    const { row, value } = await attemptCreate(`ปีการศึกษา ${year}`, () =>
      createAcademicYear({ year }),
    );
    rows.push(row);
    if (value) {
      yearIds.set(year, value.id);
    }
  }

  return { rows, yearIds };
}

// Years skipped as duplicates have no id from the failed POST — resolve
// them with a single fresh GET rather than trusting stale query-cache
// props, so semester creation still has an academicYearId to use.
async function resolveMissingYearIds(
  targetYears: number[],
  yearIds: Map<number, string>,
) {
  if (yearIds.size >= targetYears.length) {
    return;
  }

  const allYears = await fetchAcademicYears();
  for (const year of targetYears) {
    if (yearIds.has(year)) {
      continue;
    }
    const existing = allYears.find((y) => y.year === year);
    if (existing) {
      yearIds.set(year, existing.id);
    }
  }
}

async function createSemestersForYears(
  targetYears: number[],
  yearIds: Map<number, string>,
) {
  const rows: ResultRow[] = [];

  for (const year of targetYears) {
    const academicYearId = yearIds.get(year);
    // Creation failed and no existing row resolved — skip its semesters.
    if (!academicYearId) {
      continue;
    }

    for (const term of TERMS) {
      const { row } = await attemptCreate(
        `${year} ${SEMESTER_TERM_LABELS[term]}`,
        () => createSemester({ term, academicYearId }),
      );
      rows.push(row);
    }
  }

  return rows;
}

export async function bulkGenerateAcademicYears(
  startYear: number,
  count: number,
): Promise<ResultRow[]> {
  const targetYears = Array.from({ length: count }, (_, i) => startYear + i);

  const { rows, yearIds } = await createYears(targetYears);
  await resolveMissingYearIds(targetYears, yearIds);
  rows.push(...(await createSemestersForYears(targetYears, yearIds)));

  return rows;
}
