import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AcademicYearService } from './academic-year.service';

function setup(opts: { activeWithYear?: { id: string } | null } = {}) {
  const prisma = {
    academicYear: {
      findFirst: jest.fn().mockResolvedValue(opts.activeWithYear ?? null),
      findUnique: jest.fn().mockResolvedValue({ id: 'ay-1', isActive: true }),
      create: jest.fn().mockResolvedValue({ id: 'new', year: 2570 }),
      update: jest.fn().mockResolvedValue({ id: 'ay-1', year: 2570 }),
    },
  };
  const service = new AcademicYearService(prisma as unknown as PrismaService);
  return { service, prisma };
}

describe('AcademicYearService year uniqueness (soft delete aware)', () => {
  it('creates a year when only a soft-deleted row has that year', async () => {
    const { service, prisma } = setup({ activeWithYear: null });
    await service.create({ year: 2570 });
    expect(prisma.academicYear.findFirst).toHaveBeenCalledWith({
      where: { year: 2570, isActive: true },
    });
    expect(prisma.academicYear.create).toHaveBeenCalledWith({
      data: { year: 2570 },
    });
  });

  it('rejects with 409 when an active row already has that year', async () => {
    const { service, prisma } = setup({ activeWithYear: { id: 'other' } });
    await expect(service.create({ year: 2570 })).rejects.toThrow(
      ConflictException,
    );
    expect(prisma.academicYear.create).not.toHaveBeenCalled();
  });

  it('update ignores the row being updated but rejects another active row', async () => {
    const own = setup({ activeWithYear: { id: 'ay-1' } });
    await own.service.update('ay-1', { year: 2570 });
    expect(own.prisma.academicYear.update).toHaveBeenCalled();

    const other = setup({ activeWithYear: { id: 'other' } });
    await expect(other.service.update('ay-1', { year: 2570 })).rejects.toThrow(
      ConflictException,
    );
  });

  it('update on a missing year is 404', async () => {
    const { service, prisma } = setup();
    prisma.academicYear.findUnique.mockResolvedValue(null);
    await expect(service.update('nope', { year: 2570 })).rejects.toThrow(
      NotFoundException,
    );
  });
});
