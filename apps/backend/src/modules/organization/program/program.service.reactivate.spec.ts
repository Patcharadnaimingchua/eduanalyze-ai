import { ConflictException } from '@nestjs/common';
import { ProgramService } from './program.service';

function setup(opts: { parentActive?: boolean; clash?: boolean; active?: boolean }) {
  const program = {
    findUnique: jest.fn().mockResolvedValue({
      id: 'p1',
      departmentId: 'd1',
      code: 'CPE',
      name: 'วิศวกรรมคอมพิวเตอร์',
      isActive: opts.active ?? false,
    }),
    findFirst: jest.fn().mockResolvedValueOnce(opts.clash ? { id: 'x' } : null).mockResolvedValueOnce(null),
    update: jest.fn().mockResolvedValue({ id: 'p1', isActive: true }),
  };
  const departmentService = {
    findOne: jest.fn().mockResolvedValue({ id: 'd1', name: 'วิศวกรรมคอมพิวเตอร์', isActive: opts.parentActive ?? true }),
  };
  return { service: new ProgramService({ program } as never, departmentService as never), program };
}

describe('ProgramService reactivate', () => {
  it('restores it when the department is active and code and name are free', async () => {
    const { service, program } = setup({});
    await service.reactivate('p1');
    expect(program.update).toHaveBeenCalledWith({ where: { id: 'p1' }, data: { isActive: true } });
  });

  it('refuses while the department is still deactivated', async () => {
    const { service, program } = setup({ parentActive: false });
    await expect(service.reactivate('p1')).rejects.toThrow(/ภาควิชา .* ยังปิดใช้งานอยู่/);
    expect(program.update).not.toHaveBeenCalled();
  });

  it('refuses when an active program in the department has the same code or name', async () => {
    const { service } = setup({ clash: true });
    await expect(service.reactivate('p1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('refuses one that is already active', async () => {
    const { service } = setup({ active: true });
    await expect(service.reactivate('p1')).rejects.toThrow('สาขานี้เปิดใช้งานอยู่แล้ว');
  });
});
