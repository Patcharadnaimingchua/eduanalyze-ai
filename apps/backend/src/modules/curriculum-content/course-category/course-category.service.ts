import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CurriculumService } from '../../organization/curriculum/curriculum.service';
import { CreateCourseCategoryDto } from './dto/create-course-category.dto';
import { UpdateCourseCategoryDto } from './dto/update-course-category.dto';

@Injectable()
export class CourseCategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly curriculumService: CurriculumService,
  ) {}

  async create(dto: CreateCourseCategoryDto) {
    await this.curriculumService.findActiveByIdOrThrow(dto.curriculumId);
    await this.assertNameAvailable(dto.curriculumId, dto.name);
    return this.prisma.courseCategory.create({ data: dto });
  }

  findAll() {
    return this.prisma.courseCategory.findMany({ where: { isActive: true } });
  }

  async findOne(id: string) {
    const category = await this.prisma.courseCategory.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException(`Course category ${id} not found`);
    }
    return category;
  }

  // Used by CourseService and CurriculumRequirementService to validate a
  // dependent relationship.
  async findActiveByIdOrThrow(id: string) {
    const category = await this.prisma.courseCategory.findUnique({
      where: { id },
    });
    if (!category || !category.isActive) {
      throw new NotFoundException(`Active course category ${id} not found`);
    }
    return category;
  }

  async update(id: string, dto: UpdateCourseCategoryDto) {
    const category = await this.findOne(id);

    if (dto.curriculumId) {
      await this.curriculumService.findActiveByIdOrThrow(dto.curriculumId);
    }
    const curriculumId = dto.curriculumId ?? category.curriculumId;

    if (dto.name) {
      await this.assertNameAvailable(curriculumId, dto.name, id);
    }

    return this.prisma.courseCategory.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);

    const activeCourseCount = await this.prisma.course.count({
      where: { categoryId: id, isActive: true },
    });
    if (activeCourseCount > 0) {
      throw new ConflictException(
        `Cannot deactivate course category ${id}: ${activeCourseCount} active course(s) still belong to it`,
      );
    }

    return this.prisma.courseCategory.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private async assertNameAvailable(
    curriculumId: string,
    name: string,
    excludeId?: string,
  ) {
    const existing = await this.prisma.courseCategory.findUnique({
      where: { curriculumId_name: { curriculumId, name } },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(
        `Course category name "${name}" is already in use within this curriculum`,
      );
    }
  }
}
