import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { conflictOnDuplicate } from '../../../common/util/reactivate.util';
import { AcademicYearService } from '../academic-year/academic-year.service';
import { CreateSemesterDto } from './dto/create-semester.dto';
import { UpdateSemesterDto } from './dto/update-semester.dto';

@Injectable()
export class SemesterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly academicYearService: AcademicYearService,
  ) {}

  async create(dto: CreateSemesterDto) {
    await this.academicYearService.findActiveByIdOrThrow(dto.academicYearId);
    await this.assertTermAvailable(dto.academicYearId, dto.term);
    return this.prisma.semester.create({ data: dto });
  }

  findAll() {
    return this.prisma.semester.findMany({ where: { isActive: true } });
  }

  async findOne(id: string) {
    const semester = await this.prisma.semester.findUnique({ where: { id } });
    if (!semester) {
      throw new NotFoundException(`Semester ${id} not found`);
    }
    return semester;
  }

  // Used by StudentCourseRecordService to validate a dependent relationship.
  async findActiveByIdOrThrow(id: string) {
    const semester = await this.prisma.semester.findUnique({ where: { id } });
    if (!semester || !semester.isActive) {
      throw new NotFoundException(`Active semester ${id} not found`);
    }
    return semester;
  }

  async update(id: string, dto: UpdateSemesterDto) {
    const semester = await this.findOne(id);

    if (dto.academicYearId) {
      await this.academicYearService.findActiveByIdOrThrow(dto.academicYearId);
    }
    const academicYearId = dto.academicYearId ?? semester.academicYearId;

    if (dto.term) {
      await this.assertTermAvailable(academicYearId, dto.term, id);
    }

    return this.prisma.semester.update({ where: { id }, data: dto });
  }

  findInactive() {
    return this.prisma.semester.findMany({
      where: { isActive: false },
      orderBy: [{ academicYearId: 'asc' }, { term: 'asc' }],
    });
  }

  async reactivate(id: string) {
    const semester = await this.findOne(id);
    if (semester.isActive) {
      throw new ConflictException('ภาคเรียนนี้เปิดใช้งานอยู่แล้ว');
    }
    const academicYear = await this.academicYearService.findOne(semester.academicYearId);
    if (!academicYear.isActive) {
      throw new ConflictException(
        `เปิดใช้งานไม่ได้ เพราะปีการศึกษา ${academicYear.year} ยังปิดใช้งานอยู่ ให้เปิดปีการศึกษาก่อน`,
      );
    }
    const message = 'เปิดใช้งานไม่ได้ เพราะภาคเรียนนี้มีอยู่แล้วในปีการศึกษาเดียวกันและใช้งานอยู่';
    const clash = await this.prisma.semester.findFirst({
      where: { academicYearId: semester.academicYearId, term: semester.term, isActive: true },
    });
    if (clash) throw new ConflictException(message);
    return conflictOnDuplicate(
      this.prisma.semester.update({ where: { id }, data: { isActive: true } }),
      message,
    );
  }

  async remove(id: string) {
    await this.findOne(id);

    // StudentCourseRecord is hard-delete (no isActive), so every row
    // referencing this semester counts as "still depends on it" — unlike
    // the isActive-scoped counts used elsewhere in the hierarchy.
    const recordCount = await this.prisma.studentCourseRecord.count({
      where: { semesterId: id },
    });
    if (recordCount > 0) {
      throw new ConflictException(
        `Cannot deactivate semester ${id}: ${recordCount} student course record(s) still reference it`,
      );
    }

    return this.prisma.semester.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private async assertTermAvailable(
    academicYearId: string,
    term: CreateSemesterDto['term'],
    excludeId?: string,
  ) {
    const existing = await this.prisma.semester.findFirst({
      where: { academicYearId, term, isActive: true },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(
        `Semester "${term}" is already in use within this academic year`,
      );
    }
  }
}
