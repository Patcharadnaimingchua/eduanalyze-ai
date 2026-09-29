// A refetch must not overwrite what the instructor is typing; only an
// explicit action that changes the server data (save, CSV import) may.
export function shouldReseedScoreForm(isDirty: boolean, forceReseed: boolean): boolean {
  return !isDirty || forceReseed;
}

export const UNSAVED_SCORES_CONFIRM_MESSAGE =
  'มีคะแนนที่ยังไม่ได้บันทึก หากเปลี่ยนไปที่อื่นคะแนนที่แก้ไว้จะหายไป ต้องการดำเนินการต่อหรือไม่?';
