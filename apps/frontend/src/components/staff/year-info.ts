import type { StaffYearLevelsReport } from '@eduanalyze-ai/shared-types';

export interface YearInfo {
  levelById: Map<string, number>;
  behindIds: Set<string>;
  labelByLevel: Map<number, string>;
}

// What the year-level report adds to the student list: which year each active
// student is in, who is behind plan, and what the backend calls each year. The
// counts themselves are not taken from here, so every page counts the same list.
export function yearInfoFrom(report: StaffYearLevelsReport | undefined): YearInfo {
  const info: YearInfo = {
    levelById: new Map(),
    behindIds: new Set(),
    labelByLevel: new Map(),
  };
  for (const bucket of report?.buckets ?? []) {
    info.labelByLevel.set(bucket.yearLevel, bucket.label);
    for (const student of bucket.students) {
      info.levelById.set(student.studentProfileId, bucket.yearLevel);
      if (student.onTrackStatus === 'behind') info.behindIds.add(student.studentProfileId);
    }
  }
  return info;
}

export const YEAR_LEVELS = [1, 2, 3, 4] as const;

export function yearLevelTitle(level: number): string {
  return level >= 4 ? 'ชั้นปีที่ 4 ขึ้นไป' : `ชั้นปีที่ ${level}`;
}

// One line for the page, in the backend's own terms (common/academic/year-level.ts).
export const BEHIND_PLAN_FORMULA =
  'ตามหลังแผน = หน่วยกิตที่ผ่านแล้วน้อยกว่าที่ควรมีเมื่อต้นปีการศึกษานี้ (หน่วยกิตรวมของหลักสูตร × จำนวนปีที่ผ่านมา ÷ ระยะเวลาของหลักสูตร)';
