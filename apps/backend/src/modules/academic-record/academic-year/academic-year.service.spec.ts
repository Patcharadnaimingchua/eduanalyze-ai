import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

describe('AcademicYearService.bulkCreate', () => {
  function setupBulk(opts: {
    existingYears?: { id: string; year: number }[];
    existingSemesters?: { academicYearId: string; term: string }[];
    createError?: Error;
  }) {
    let seq = 0;
    const tx = {
      academicYear: {
        findMany: jest.fn().mockResolvedValue(opts.existingYears ?? []),
        create: jest.fn().mockImplementation(({ data }) => {
          if (opts.createError) return Promise.reject(opts.createError);
          seq += 1;
          return Promise.resolve({ id: `new-${seq}`, year: data.year });
        }),
      },
      semester: {
        findMany: jest.fn().mockResolvedValue(opts.existingSemesters ?? []),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    const prisma = {
      $transaction: jest.fn().mockImplementation((fn) => fn(tx)),
    };
    const service = new AcademicYearService(
      prisma as unknown as PrismaService,
    );
    return { service, prisma, tx };
  }

  it('creates missing years and terms in one transaction', async () => {
    const { service, prisma, tx } = setupBulk({});
    const result = await service.bulkCreate({
      startYear: 2570,
      yearCount: 2,
      terms: ['FIRST', 'SECOND'],
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.academicYear.create).toHaveBeenCalledTimes(2);
    expect(tx.semester.createMany).toHaveBeenCalledWith({
      data: [
        { academicYearId: 'new-1', term: 'FIRST' },
        { academicYearId: 'new-1', term: 'SECOND' },
        { academicYearId: 'new-2', term: 'FIRST' },
        { academicYearId: 'new-2', term: 'SECOND' },
      ],
    });
    expect(result.years.map((y) => y.status)).toEqual(['created', 'created']);
    expect(result.years[0].semesters.map((s) => s.status)).toEqual([
      'created',
      'created',
    ]);
  });

  it('skips existing years and terms without error (idempotent)', async () => {
    const { service, tx } = setupBulk({
      existingYears: [
        { id: 'ay-70', year: 2570 },
        { id: 'ay-71', year: 2571 },
      ],
      existingSemesters: [
        { academicYearId: 'ay-70', term: 'FIRST' },
        { academicYearId: 'ay-70', term: 'SECOND' },
        { academicYearId: 'ay-71', term: 'FIRST' },
        { academicYearId: 'ay-71', term: 'SECOND' },
      ],
    });
    const result = await service.bulkCreate({
      startYear: 2570,
      yearCount: 2,
      terms: ['FIRST', 'SECOND'],
    });
    expect(tx.academicYear.create).not.toHaveBeenCalled();
    expect(tx.semester.createMany).not.toHaveBeenCalled();
    expect(result.years.flatMap((y) => [y.status, ...y.semesters.map((s) => s.status)]))
      .toEqual(Array(6).fill('skipped'));
  });

  it('creates only the missing term of an existing year', async () => {
    const { service, tx } = setupBulk({
      existingYears: [{ id: 'ay-70', year: 2570 }],
      existingSemesters: [{ academicYearId: 'ay-70', term: 'FIRST' }],
    });
    const result = await service.bulkCreate({
      startYear: 2570,
      yearCount: 1,
      terms: ['FIRST', 'SECOND'],
    });
    expect(tx.semester.createMany).toHaveBeenCalledWith({
      data: [{ academicYearId: 'ay-70', term: 'SECOND' }],
    });
    expect(result.years[0].status).toBe('skipped');
    expect(result.years[0].semesters.map((s) => s.status)).toEqual([
      'skipped',
      'created',
    ]);
  });

  it('empty terms creates years only', async () => {
    const { service, tx } = setupBulk({});
    await service.bulkCreate({ startYear: 2570, yearCount: 1, terms: [] });
    expect(tx.academicYear.create).toHaveBeenCalledTimes(1);
    expect(tx.semester.findMany).not.toHaveBeenCalled();
    expect(tx.semester.createMany).not.toHaveBeenCalled();
  });

  it('propagates a mid-transaction failure (Prisma rolls the whole tx back)', async () => {
    const { service, tx } = setupBulk({ createError: new Error('db down') });
    await expect(
      service.bulkCreate({ startYear: 2570, yearCount: 2, terms: ['FIRST'] }),
    ).rejects.toThrow('db down');
    expect(tx.semester.createMany).not.toHaveBeenCalled();
  });

  it('maps a concurrent duplicate (P2002) to 409', async () => {
    const p2002 = new Prisma.PrismaClientKnownRequestError('dup', {
      code: 'P2002',
      clientVersion: 'test',
    });
    const { service } = setupBulk({ createError: p2002 });
    await expect(
      service.bulkCreate({ startYear: 2570, yearCount: 1, terms: [] }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects a range ending above 2700 with 400 before opening a transaction', async () => {
    const { service, prisma } = setupBulk({});
    await expect(
      service.bulkCreate({ startYear: 2699, yearCount: 5, terms: [] }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
