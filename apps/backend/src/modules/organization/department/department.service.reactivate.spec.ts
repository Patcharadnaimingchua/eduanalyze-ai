import { ConflictException } from '@nestjs/common';
import { DepartmentService } from './department.service';

function setup(opts: { parentActive?: boolean; clash?: boolean; active?: boolean }) {
  const department = {
    findUnique: jest.fn().mockResolvedValue({
      id: 'd1',
      facultyId: 'f1',
      code: 'CPE',
      isActive: opts.active ?? false,
    }),
    findFirst: jest.fn().mockResolvedValue(opts.clash ? { id: 'other' } : null),
    update: jest.fn().mockResolvedValue({ id: 'd1', isActive: true }),
  };
  const facultyService = {
    findOne: jest.fn().mockResolvedValue({ id: 'f1', name: 'วิศวกรรมศาสตร์', isActive: opts.parentActive ?? true }),
  };
  return {
    service: new DepartmentService({ department } as never, facultyService as never),
    department,
  };
}

describe('DepartmentService reactivate', () => {
  it('restores it when the faculty is active and the code is free', async () => {
    const { service, department } = setup({});
    await service.reactivate('d1');
    expect(department.update).toHaveBeenCalledWith({ where: { id: 'd1' }, data: { isActive: true } });
  });

  it('refuses while the faculty is still deactivated and says to open it first', async () => {
    const { service, department } = setup({ parentActive: false });
    await expect(service.reactivate('d1')).rejects.toThrow(/คณะ "วิศวกรรมศาสตร์" ยังปิดใช้งานอยู่/);
    expect(department.update).not.toHaveBeenCalled();
  });

  it('refuses when another active department in the faculty uses the code', async () => {
    const { service } = setup({ clash: true });
    await expect(service.reactivate('d1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('refuses one that is already active', async () => {
    const { service } = setup({ active: true });
    await expect(service.reactivate('d1')).rejects.toThrow('ภาควิชานี้เปิดใช้งานอยู่แล้ว');
  });
});
