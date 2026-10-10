import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FacultyService } from './faculty.service';

function setup(opts: { row?: { id: string; code: string; isActive: boolean } | null; clash?: boolean }) {
  const faculty = {
    findUnique: jest.fn().mockResolvedValue(opts.row ?? null),
    findFirst: jest.fn().mockResolvedValue(opts.clash ? { id: 'other' } : null),
    update: jest.fn().mockResolvedValue({ id: 'f1', isActive: true }),
    findMany: jest.fn().mockResolvedValue([]),
  };
  return { service: new FacultyService({ faculty } as never), faculty };
}

describe('FacultyService reactivate', () => {
  it('restores the same row', async () => {
    const { service, faculty } = setup({ row: { id: 'f1', code: 'ENG', isActive: false } });
    await service.reactivate('f1');
    expect(faculty.update).toHaveBeenCalledWith({ where: { id: 'f1' }, data: { isActive: true } });
  });

  it('is 404 for an unknown id', async () => {
    const { service } = setup({ row: null });
    await expect(service.reactivate('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('refuses one that is already active, in Thai', async () => {
    const { service, faculty } = setup({ row: { id: 'f1', code: 'ENG', isActive: true } });
    await expect(service.reactivate('f1')).rejects.toThrow('คณะนี้เปิดใช้งานอยู่แล้ว');
    expect(faculty.update).not.toHaveBeenCalled();
  });

  it('refuses when an active faculty already uses the code', async () => {
    const { service, faculty } = setup({
      row: { id: 'f1', code: 'ENG', isActive: false },
      clash: true,
    });
    await expect(service.reactivate('f1')).rejects.toThrow(/รหัสคณะ "ENG"/);
    expect(faculty.update).not.toHaveBeenCalled();
  });

  it('turns a concurrent duplicate into the same 409', async () => {
    const { service, faculty } = setup({ row: { id: 'f1', code: 'ENG', isActive: false } });
    faculty.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'x' }),
    );
    await expect(service.reactivate('f1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('lists only deactivated faculties', async () => {
    const { service, faculty } = setup({});
    await service.findInactive();
    expect(faculty.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: false } }),
    );
  });
});
