// What the student's grade list offers in each mode. Viewing is the default:
// grades are plain text and nothing on the page can write. Editing shows the
// grade picker, the delete button and the add-course form.
export interface RecordModeView {
  gradeAs: 'text' | 'select';
  showDelete: boolean;
  showAddCourse: boolean;
  showNotice: boolean;
}

export function recordModeView(editing: boolean): RecordModeView {
  return editing
    ? { gradeAs: 'select', showDelete: true, showAddCourse: true, showNotice: true }
    : { gradeAs: 'text', showDelete: false, showAddCourse: false, showNotice: false };
}

// A grade change is sent as soon as "บันทึก" is pressed on that row; leaving
// the edit mode does not save or discard anything.
export const GRADE_SAVES_NOW_NOTICE = 'การเปลี่ยนเกรดจะบันทึกทันที';
export const GRADE_SAVES_NOW_DETAIL = 'เมื่อกด “บันทึก” ที่แถวนั้น';
