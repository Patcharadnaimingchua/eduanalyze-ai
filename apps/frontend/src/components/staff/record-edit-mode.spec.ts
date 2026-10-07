import { GRADE_SAVES_NOW_NOTICE, recordModeView } from './record-edit-mode';

describe('recordModeView', () => {
  it('offers nothing that writes while viewing', () => {
    expect(recordModeView(false)).toEqual({
      gradeAs: 'text',
      showDelete: false,
      showAddCourse: false,
      showNotice: false,
    });
  });

  it('offers the grade picker, delete and add while editing, with the notice', () => {
    expect(recordModeView(true)).toEqual({
      gradeAs: 'select',
      showDelete: true,
      showAddCourse: true,
      showNotice: true,
    });
  });

  it('words the notice as the page shows it', () => {
    expect(GRADE_SAVES_NOW_NOTICE).toBe('การเปลี่ยนเกรดจะบันทึกทันที');
  });
});
