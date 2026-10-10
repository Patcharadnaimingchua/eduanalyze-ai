import { ConflictException } from '@nestjs/common';
import { CurriculumService } from './curriculum.service';

function setup(opts: { parentActive?: boolean; clash?: boolean; active?: boolean }) {
  const curriculum = {
    findUnique: jest.fn().mockResolvedValue({
      id: 'c1',
      programId: 'p1',
      version: '2565',
      isActive: opts.active ?? false,
      isOpenForRegistration: true,
    }),
    findFirst: jest.fn().mockResolvedValue(opts.clash ? { id: 'x' } : null),
    update: jest.fn().mockResolvedValue({ id: 'c1', isActive: true }),
  };
  const programService = {
    findOne: jest.fn().mockResolvedValue({ id: 'p1', name: 'วิศวกรรมคอมพิวเตอร์', isActive: opts.parentActive ?? true }),
  };
  return {
    service: new CurriculumService({ curriculum } as never, programService as never),
    curriculum,
  };
}

describe('CurriculumService reactivate', () => {
  it('restores it but closed to registration, so a program never has two open', async () => {
    const { service, curriculum } = setup({});
    await service.reactivate('c1');
    expect(curriculum.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { isActive: true, isOpenForRegistration: false },
    });
  });

  it('refuses while the program is still deactivated', async () => {
    const { service, curriculum } = setup({ parentActive: false });
    await expect(service.reactivate('c1')).rejects.toThrow(/สาขา .* ยังปิดใช้งานอยู่/);
    expect(curriculum.update).not.toHaveBeenCalled();
  });

  it('refuses when the version is taken by an active curriculum of the program', async () => {
    const { service } = setup({ clash: true });
    await expect(service.reactivate('c1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('refuses one that is already active', async () => {
    const { service } = setup({ active: true });
    await expect(service.reactivate('c1')).rejects.toThrow('หลักสูตรนี้เปิดใช้งานอยู่แล้ว');
  });
});
