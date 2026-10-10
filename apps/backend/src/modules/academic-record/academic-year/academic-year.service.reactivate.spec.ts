import { ConflictException } from '@nestjs/common';
import { AcademicYearService } from './academic-year.service';

function setup(opts: { clash?: boolean; active?: boolean }) {
  const academicYear = {
    findUnique: jest.fn().mockResolvedValue({ id: 'y1', year: 2565, isActive: opts.active ?? false }),
    findFirst: jest.fn().mockResolvedValue(opts.clash ? { id: 'x' } : null),
    update: jest.fn().mockResolvedValue({ id: 'y1', isActive: true }),
  };
  return { service: new AcademicYearService({ academicYear } as never), academicYear };
}

describe('AcademicYearService reactivate', () => {
  it('restores the same year row', async () => {
    const { service, academicYear } = setup({});
    await service.reactivate('y1');
    expect(academicYear.update).toHaveBeenCalledWith({ where: { id: 'y1' }, data: { isActive: true } });
  });

  it('refuses when the year number is already in use by an active year', async () => {
    const { service, academicYear } = setup({ clash: true });
    await expect(service.reactivate('y1')).rejects.toBeInstanceOf(ConflictException);
    expect(academicYear.update).not.toHaveBeenCalled();
  });

  it('refuses one that is already active', async () => {
    const { service } = setup({ active: true });
    await expect(service.reactivate('y1')).rejects.toThrow('ปีการศึกษานี้เปิดใช้งานอยู่แล้ว');
  });
});
