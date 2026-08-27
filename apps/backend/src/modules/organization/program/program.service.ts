import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PrismaClientOrTx } from '../../../prisma/prisma.types';
import { DepartmentService } from '../department/department.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';

@Injectable()
export class ProgramService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly departmentService: DepartmentService,
  ) {}

  async create(dto: CreateProgramDto) {
    await this.departmentService.findActiveByIdOrThrow(dto.departmentId);
    await this.assertNameAvailable(dto.departmentId, dto.name);
    await this.assertCodeAvailable(dto.departmentId, dto.code);
    return this.prisma.program.create({ data: dto });
  }

  findAll() {
    return this.prisma.program.findMany({ where: { isActive: true } });
  }

  async findOne(id: string) {
    const program = await this.prisma.program.findUnique({ where: { id } });
    if (!program) {
      throw new NotFoundException(`Program ${id} not found`);
    }
    return program;
  }

  // Used by CurriculumService and StudentProfileService to validate a
  // dependent relationship.
  async findActiveByIdOrThrow(id: string, tx: PrismaClientOrTx = this.prisma) {
    const program = await tx.program.findUnique({ where: { id } });
    if (!program || !program.isActive) {
      throw new NotFoundException(`Active program ${id} not found`);
    }
    return program;
  }

  async update(id: string, dto: UpdateProgramDto) {
    const program = await this.findOne(id);

    if (dto.departmentId) {
      await this.departmentService.findActiveByIdOrThrow(dto.departmentId);
    }
    const departmentId = dto.departmentId ?? program.departmentId;

    if (dto.name) {
      await this.assertNameAvailable(departmentId, dto.name, id);
    }
    if (dto.code) {
      await this.assertCodeAvailable(departmentId, dto.code, id);
    }

    return this.prisma.program.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);

    const activeCurriculumCount = await this.prisma.curriculum.count({
      where: { programId: id, isActive: true },
    });
    if (activeCurriculumCount > 0) {
      throw new ConflictException(
        `Cannot deactivate program ${id}: ${activeCurriculumCount} active curriculum(a) still belong to it`,
      );
    }

    return this.prisma.program.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private async assertNameAvailable(
    departmentId: string,
    name: string,
    excludeId?: string,
  ) {
    const existing = await this.prisma.program.findFirst({
      where: { departmentId, name, isActive: true },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(
        `Program name "${name}" is already in use within this department`,
      );
    }
  }

  private async assertCodeAvailable(
    departmentId: string,
    code: string,
    excludeId?: string,
  ) {
    const existing = await this.prisma.program.findFirst({
      where: { departmentId, code, isActive: true },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(
        `Program code "${code}" is already in use within this department`,
      );
    }
  }
}
