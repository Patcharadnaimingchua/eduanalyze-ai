import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SemesterTerm } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { BulkCreateAcademicYearsDto } from './dto/bulk-create-academic-years.dto';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto';

@Injectable()
export class AcademicYearService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAcademicYearDto) {
    await this.assertYearAvailable(dto.year);
    return this.prisma.academicYear.create({ data: dto });
  }

  // All-or-nothing: one transaction creates the missing years and the missing
  // terms of every requested year. Rows that already exist (active) are
  // reported as 'skipped', not errors, so re-running the same request is
  // idempotent. Any real failure (incl. a concurrent duplicate hitting the
  // partial unique index) rolls everything back.
  async bulkCreate(dto: BulkCreateAcademicYearsDto) {
    const endYear = dto.startYear + dto.yearCount - 1;
    if (endYear > 2700) {
      throw new BadRequestException(
        `Last year ${endYear} exceeds 2700 — reduce yearCount or startYear`,
      );
    }
    const years = Array.from(
      { length: dto.yearCount },
      (_, i) => dto.startYear + i,
    );

    try {
      return await this.prisma.$transaction(async (tx) => {
        const existingYears = await tx.academicYear.findMany({
          where: { year: { in: years }, isActive: true },
        });
        const yearRows = new Map(existingYears.map((y) => [y.year, y]));
        const createdYears = new Set<number>();
        for (const year of years) {
          if (!yearRows.has(year)) {
            yearRows.set(year, await tx.academicYear.create({ data: { year } }));
            createdYears.add(year);
          }
        }

        const yearIds = years.map((y) => yearRows.get(y)!.id);
        const existingSemesters = dto.terms.length
          ? await tx.semester.findMany({
              where: {
                academicYearId: { in: yearIds },
                term: { in: dto.terms },
                isActive: true,
              },
              select: { academicYearId: true, term: true },
            })
          : [];
        const haveTerm = new Set(
          existingSemesters.map((s) => `${s.academicYearId}:${s.term}`),
        );
        const missing: { academicYearId: string; term: SemesterTerm }[] = [];
        for (const year of years) {
          const academicYearId = yearRows.get(year)!.id;
          for (const term of dto.terms) {
            if (!haveTerm.has(`${academicYearId}:${term}`)) {
              missing.push({ academicYearId, term });
            }
          }
        }
        if (missing.length > 0) {
          await tx.semester.createMany({ data: missing });
        }
        const createdTerm = new Set(
          missing.map((m) => `${m.academicYearId}:${m.term}`),
        );

        return {
          years: years.map((year) => {
            const academicYearId = yearRows.get(year)!.id;
            return {
              year,
              status: createdYears.has(year) ? 'created' : 'skipped',
              semesters: dto.terms.map((term) => ({
                term,
                status: createdTerm.has(`${academicYearId}:${term}`)
                  ? 'created'
                  : 'skipped',
              })),
            };
          }),
        };
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Another request created the same year or term at the same time — nothing was saved, please retry',
        );
      }
      throw error;
    }
  }

  findAll() {
    return this.prisma.academicYear.findMany({ where: { isActive: true } });
  }

  async findOne(id: string) {
    const academicYear = await this.prisma.academicYear.findUnique({
      where: { id },
    });
    if (!academicYear) {
      throw new NotFoundException(`Academic year ${id} not found`);
    }
    return academicYear;
  }

  // Used by SemesterService to validate a dependent relationship.
  async findActiveByIdOrThrow(id: string) {
    const academicYear = await this.prisma.academicYear.findUnique({
      where: { id },
    });
    if (!academicYear || !academicYear.isActive) {
      throw new NotFoundException(`Active academic year ${id} not found`);
    }
    return academicYear;
  }

  async update(id: string, dto: UpdateAcademicYearDto) {
    await this.findOne(id);
    if (dto.year) {
      await this.assertYearAvailable(dto.year, id);
    }
    return this.prisma.academicYear.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);

    const activeSemesterCount = await this.prisma.semester.count({
      where: { academicYearId: id, isActive: true },
    });
    if (activeSemesterCount > 0) {
      throw new ConflictException(
        `Cannot deactivate academic year ${id}: ${activeSemesterCount} active semester(s) still belong to it`,
      );
    }

    return this.prisma.academicYear.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private async assertYearAvailable(year: number, excludeId?: string) {
    const existing = await this.prisma.academicYear.findFirst({
      where: { year, isActive: true },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(`Academic year ${year} is already in use`);
    }
  }
}
