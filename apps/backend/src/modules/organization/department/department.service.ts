import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { conflictOnDuplicate } from '../../../common/util/reactivate.util';
import { FacultyService } from '../faculty/faculty.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly facultyService: FacultyService,
  ) {}

  async create(dto: CreateDepartmentDto) {
    await this.facultyService.findActiveByIdOrThrow(dto.facultyId);
    await this.assertCodeAvailable(dto.facultyId, dto.code);
    return this.prisma.department.create({ data: dto });
  }

  findAll() {
    return this.prisma.department.findMany({ where: { isActive: true } });
  }

  async findOne(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
    });
    if (!department) {
      throw new NotFoundException(`Department ${id} not found`);
    }
    return department;
  }

  // Used by ProgramService to validate a dependent relationship.
  async findActiveByIdOrThrow(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
    });
    if (!department || !department.isActive) {
      throw new NotFoundException(`Active department ${id} not found`);
    }
    return department;
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    const { facultyId } = await this.findOne(id);

    if (dto.code) {
      await this.assertCodeAvailable(facultyId, dto.code, id);
    }

    return this.prisma.department.update({ where: { id }, data: dto });
  }

  findInactive() {
    return this.prisma.department.findMany({
      where: { isActive: false },
      orderBy: { code: 'asc' },
    });
  }

  async reactivate(id: string) {
    const department = await this.findOne(id);
    if (department.isActive) {
      throw new ConflictException('ภาควิชานี้เปิดใช้งานอยู่แล้ว');
    }
    const faculty = await this.facultyService.findOne(department.facultyId);
    if (!faculty.isActive) {
      throw new ConflictException(
        `เปิดใช้งานไม่ได้ เพราะคณะ "${faculty.name}" ยังปิดใช้งานอยู่ ให้เปิดคณะก่อน`,
      );
    }
    const message = `เปิดใช้งานไม่ได้ เพราะรหัสภาควิชา "${department.code}" ถูกใช้โดยภาควิชาอื่นในคณะนี้ที่ใช้งานอยู่แล้ว`;
    const clash = await this.prisma.department.findFirst({
      where: { facultyId: department.facultyId, code: department.code, isActive: true },
    });
    if (clash) throw new ConflictException(message);
    return conflictOnDuplicate(
      this.prisma.department.update({ where: { id }, data: { isActive: true } }),
      message,
    );
  }

  async remove(id: string) {
    await this.findOne(id);

    const activeProgramCount = await this.prisma.program.count({
      where: { departmentId: id, isActive: true },
    });
    if (activeProgramCount > 0) {
      throw new ConflictException(
        `Cannot deactivate department ${id}: ${activeProgramCount} active program(s) still belong to it`,
      );
    }

    return this.prisma.department.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private async assertCodeAvailable(
    facultyId: string,
    code: string,
    excludeId?: string,
  ) {
    const existing = await this.prisma.department.findFirst({
      where: { facultyId, code, isActive: true },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(
        `Department code "${code}" is already in use within this faculty`,
      );
    }
  }
}
