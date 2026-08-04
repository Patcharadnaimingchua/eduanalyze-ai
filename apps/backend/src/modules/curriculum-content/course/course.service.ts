import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CurriculumService } from '../../organization/curriculum/curriculum.service';
import { CourseCategoryService } from '../course-category/course-category.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CourseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly curriculumService: CurriculumService,
    private readonly courseCategoryService: CourseCategoryService,
  ) {}

  async create(dto: CreateCourseDto) {
    await this.curriculumService.findActiveByIdOrThrow(dto.curriculumId);
    const category = await this.courseCategoryService.findActiveByIdOrThrow(
      dto.categoryId,
    );

    // The DB compound FK (curriculumId, categoryId) -> CourseCategory(curriculumId, id)
    // would reject a mismatch anyway, but checking here first gives a clear
    // error message instead of a raw Prisma foreign-key-violation.
    if (category.curriculumId !== dto.curriculumId) {
      throw new BadRequestException(
        `Course category ${dto.categoryId} does not belong to curriculum ${dto.curriculumId}`,
      );
    }

    await this.assertCodeAvailable(dto.curriculumId, dto.code);
    return this.prisma.course.create({ data: dto });
  }

  findAll() {
    return this.prisma.course.findMany({ where: { isActive: true } });
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) {
      throw new NotFoundException(`Course ${id} not found`);
    }
    return course;
  }

  // Used by PrerequisiteService to validate a dependent relationship.
  async findActiveByIdOrThrow(id: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course || !course.isActive) {
      throw new NotFoundException(`Active course ${id} not found`);
    }
    return course;
  }

  async update(id: string, dto: UpdateCourseDto) {
    const course = await this.findOne(id);

    if (dto.curriculumId) {
      await this.curriculumService.findActiveByIdOrThrow(dto.curriculumId);
    }
    const curriculumId = dto.curriculumId ?? course.curriculumId;

    if (dto.categoryId) {
      const category = await this.courseCategoryService.findActiveByIdOrThrow(
        dto.categoryId,
      );
      if (category.curriculumId !== curriculumId) {
        throw new BadRequestException(
          `Course category ${dto.categoryId} does not belong to curriculum ${curriculumId}`,
        );
      }
    }

    if (dto.code) {
      await this.assertCodeAvailable(curriculumId, dto.code, id);
    }

    return this.prisma.course.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);

    // Direction 1: other courses depend on this one as a prerequisite —
    // block, same shape as the hierarchy soft-delete convention.
    const dependentCount = await this.prisma.prerequisite.count({
      where: { prerequisiteCourseId: id },
    });
    if (dependentCount > 0) {
      throw new ConflictException(
        `Cannot deactivate course ${id}: ${dependentCount} other course(s) still require it as a prerequisite`,
      );
    }

    // Direction 2: this course itself has prerequisite requirements
    // (courseId = id) — those rows become meaningless once this course is
    // deactivated, so they're cascade-deleted in the same transaction as
    // the soft-delete, atomically.
    return this.prisma.$transaction(async (tx) => {
      await tx.prerequisite.deleteMany({ where: { courseId: id } });

      return tx.course.update({
        where: { id },
        data: { isActive: false },
      });
    });
  }

  private async assertCodeAvailable(
    curriculumId: string,
    code: string,
    excludeId?: string,
  ) {
    const existing = await this.prisma.course.findUnique({
      where: { curriculumId_code: { curriculumId, code } },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(
        `Course code "${code}" is already in use within this curriculum`,
      );
    }
  }
}
