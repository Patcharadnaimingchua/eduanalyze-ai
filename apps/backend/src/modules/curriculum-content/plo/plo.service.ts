import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CurriculumService } from '../../organization/curriculum/curriculum.service';
import { CreatePloDto } from './dto/create-plo.dto';
import { UpdatePloDto } from './dto/update-plo.dto';

@Injectable()
export class PloService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly curriculumService: CurriculumService,
  ) {}

  async create(dto: CreatePloDto) {
    await this.curriculumService.findActiveByIdOrThrow(dto.curriculumId);
    await this.assertCodeAvailable(dto.curriculumId, dto.code);
    return this.prisma.plo.create({ data: dto });
  }

  findAll() {
    return this.prisma.plo.findMany({ where: { isActive: true } });
  }

  async findOne(id: string) {
    const plo = await this.prisma.plo.findUnique({ where: { id } });
    if (!plo) {
      throw new NotFoundException(`PLO ${id} not found`);
    }
    return plo;
  }

  // Used by CloPloMappingService to validate a dependent relationship.
  async findActiveByIdOrThrow(id: string) {
    const plo = await this.prisma.plo.findUnique({ where: { id } });
    if (!plo || !plo.isActive) {
      throw new NotFoundException(`Active PLO ${id} not found`);
    }
    return plo;
  }

  async update(id: string, dto: UpdatePloDto) {
    const plo = await this.findOne(id);

    if (dto.curriculumId) {
      await this.curriculumService.findActiveByIdOrThrow(dto.curriculumId);
    }
    const curriculumId = dto.curriculumId ?? plo.curriculumId;

    if (dto.code) {
      await this.assertCodeAvailable(curriculumId, dto.code, id);
    }

    return this.prisma.plo.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);

    const activeMappingCount = await this.prisma.cloPloMapping.count({
      where: { ploId: id, isActive: true },
    });
    if (activeMappingCount > 0) {
      throw new ConflictException(
        `Cannot deactivate PLO ${id}: ${activeMappingCount} active CLO-PLO mapping(s) still reference it`,
      );
    }

    return this.prisma.plo.update({ where: { id }, data: { isActive: false } });
  }

  private async assertCodeAvailable(
    curriculumId: string,
    code: string,
    excludeId?: string,
  ) {
    const existing = await this.prisma.plo.findUnique({
      where: { curriculumId_code: { curriculumId, code } },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(
        `PLO code "${code}" is already in use within this curriculum`,
      );
    }
  }
}
