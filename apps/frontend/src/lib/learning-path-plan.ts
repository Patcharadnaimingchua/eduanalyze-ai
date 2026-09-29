// The saved plan can go stale (a course got passed, or a prerequisite
// changed since saving), so only ids that are still plannable are kept;
// with nothing saved the recommendation is used.
export function resolveInitialPlan(
  savedIds: string[] | null,
  availableIds: string[],
  recommendedIds: string[],
): { planIds: string[]; droppedCount: number } {
  if (savedIds === null) return { planIds: recommendedIds, droppedCount: 0 };
  const available = new Set(availableIds);
  const planIds = savedIds.filter((id) => available.has(id));
  return { planIds, droppedCount: savedIds.length - planIds.length };
}

export function isPlanDirty(baselineIds: string[], currentIds: string[]): boolean {
  return (
    baselineIds.length !== currentIds.length || baselineIds.some((id, i) => id !== currentIds[i])
  );
}

export const UNSAVED_PLAN_RESET_CONFIRM_MESSAGE =
  'แผนที่แก้ไขไว้ยังไม่ได้บันทึก การรีเซ็ตจะลบแผนที่บันทึกไว้และกลับไปใช้แผนที่แนะนำ ต้องการดำเนินการต่อหรือไม่?';
