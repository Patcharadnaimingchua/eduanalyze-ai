import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto';

@Injectable()
export class AcademicYearService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAcademicYearDto) {
    await this.assertYearAvailable(dto.year);
    return this.prisma.academicYear.create({ data: dto });
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
    const existing = await this.prisma.academicYear.findUnique({
      where: { year },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(`Academic year ${year} is already in use`);
    }
  }
}
