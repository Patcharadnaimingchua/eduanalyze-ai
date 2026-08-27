import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';

@Injectable()
export class FacultyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFacultyDto) {
    await this.assertCodeAvailable(dto.code);
    return this.prisma.faculty.create({ data: dto });
  }

  findAll() {
    return this.prisma.faculty.findMany({ where: { isActive: true } });
  }

  async findOne(id: string) {
    const faculty = await this.prisma.faculty.findUnique({ where: { id } });
    if (!faculty) {
      throw new NotFoundException(`Faculty ${id} not found`);
    }
    return faculty;
  }

  // Used by DepartmentService (and any future consumer) to validate a
  // dependent relationship: the parent must exist and be active before a
  // child is allowed to reference it.
  async findActiveByIdOrThrow(id: string) {
    const faculty = await this.prisma.faculty.findUnique({ where: { id } });
    if (!faculty || !faculty.isActive) {
      throw new NotFoundException(`Active faculty ${id} not found`);
    }
    return faculty;
  }

  async update(id: string, dto: UpdateFacultyDto) {
    await this.findOne(id);
    if (dto.code) {
      await this.assertCodeAvailable(dto.code, id);
    }
    return this.prisma.faculty.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);

    const activeDepartmentCount = await this.prisma.department.count({
      where: { facultyId: id, isActive: true },
    });
    if (activeDepartmentCount > 0) {
      throw new ConflictException(
        `Cannot deactivate faculty ${id}: ${activeDepartmentCount} active department(s) still belong to it`,
      );
    }

    return this.prisma.faculty.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private async assertCodeAvailable(code: string, excludeId?: string) {
    const existing = await this.prisma.faculty.findFirst({
      where: { code, isActive: true },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(`Faculty code "${code}" is already in use`);
    }
  }
}
