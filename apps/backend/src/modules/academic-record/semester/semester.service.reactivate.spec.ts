import { ConflictException } from '@nestjs/common';
import { SemesterService } from './semester.service';

function setup(opts: { parentActive?: boolean; clash?: boolean; active?: boolean }) {
  const semester = {
    findUnique: jest.fn().mockResolvedValue({
      id: 's1',
      academicYearId: 'y1',
      term: 'FIRST',
      isActive: opts.active ?? false,
    }),
    findFirst: jest.fn().mockResolvedValue(opts.clash ? { id: 'x' } : null),
    update: jest.fn().mockResolvedValue({ id: 's1', isActive: true }),
  };
  const academicYearService = {
    findOne: jest.fn().mockResolvedValue({ id: 'y1', year: 2565, isActive: opts.parentActive ?? true }),
  };
  return {
    service: new SemesterService({ semester } as never, academicYearService as never),
    semester,
  };
}

describe('SemesterService reactivate', () => {
  it('restores it when the academic year is active and the term is free', async () => {
    const { service, semester } = setup({});
    await service.reactivate('s1');
    expect(semester.update).toHaveBeenCalledWith({ where: { id: 's1' }, data: { isActive: true } });
  });

  it('refuses while the academic year is still deactivated and names it', async () => {
    const { service, semester } = setup({ parentActive: false });
    await expect(service.reactivate('s1')).rejects.toThrow(/ปีการศึกษา 2565 ยังปิดใช้งานอยู่/);
    expect(semester.update).not.toHaveBeenCalled();
  });

  it('refuses when the same term is already active in that year', async () => {
    const { service } = setup({ clash: true });
    await expect(service.reactivate('s1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('refuses one that is already active', async () => {
    const { service } = setup({ active: true });
    await expect(service.reactivate('s1')).rejects.toThrow('ภาคเรียนนี้เปิดใช้งานอยู่แล้ว');
  });
});
