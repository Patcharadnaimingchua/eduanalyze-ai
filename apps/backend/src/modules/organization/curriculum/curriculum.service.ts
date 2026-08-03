import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PrismaClientOrTx } from '../../../prisma/prisma.types';
import { ProgramService } from '../program/program.service';
import { CreateCurriculumDto } from './dto/create-curriculum.dto';
import { UpdateCurriculumDto } from './dto/update-curriculum.dto';

@Injectable()
export class CurriculumService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly programService: ProgramService,
  ) {}

  async create(dto: CreateCurriculumDto) {
    await this.programService.findActiveByIdOrThrow(dto.programId);
    await this.assertVersionAvailable(dto.programId, dto.version);

    if (dto.isOpenForRegistration) {
      return this.prisma.$transaction(async (tx) => {
        await this.unsetOtherOpenCurricula(tx, dto.programId);
        return tx.curriculum.create({ data: dto });
      });
    }

    return this.prisma.curriculum.create({ data: dto });
  }

  findAll() {
    return this.prisma.curriculum.findMany({ where: { isActive: true } });
  }

  async findOne(id: string) {
    const curriculum = await this.prisma.curriculum.findUnique({
      where: { id },
    });
    if (!curriculum) {
      throw new NotFoundException(`Curriculum ${id} not found`);
    }
    return curriculum;
  }

  // Used by StudentProfileService to validate a dependent relationship.
  async findActiveByIdOrThrow(
    id: string,
    tx: PrismaClientOrTx = this.prisma,
  ) {
    const curriculum = await tx.curriculum.findUnique({
      where: { id },
    });
    if (!curriculum || !curriculum.isActive) {
      throw new NotFoundException(`Active curriculum ${id} not found`);
    }
    return curriculum;
  }

  async update(id: string, dto: UpdateCurriculumDto) {
    const curriculum = await this.findOne(id);

    if (dto.programId) {
      await this.programService.findActiveByIdOrThrow(dto.programId);
    }
    const programId = dto.programId ?? curriculum.programId;

    if (dto.version) {
      await this.assertVersionAvailable(programId, dto.version, id);
    }

    if (dto.isOpenForRegistration) {
      return this.prisma.$transaction(async (tx) => {
        await this.unsetOtherOpenCurricula(tx, programId, id);
        return tx.curriculum.update({ where: { id }, data: dto });
      });
    }

    return this.prisma.curriculum.update({ where: { id }, data: dto });
  }

  // Curriculum is the leaf of the organization hierarchy — no child
  // entities depend on it, so soft-delete never needs a blocking check.
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.curriculum.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private async assertVersionAvailable(
    programId: string,
    version: string,
    excludeId?: string,
  ) {
    const existing = await this.prisma.curriculum.findUnique({
      where: { programId_version: { programId, version } },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(
        `Curriculum version "${version}" is already in use within this program`,
      );
    }
  }

  // isOpenForRegistration conflict rule (auto-unset, not reject): setting
  // one Curriculum to isOpenForRegistration = true must unset every other
  // Curriculum under the same programId that currently has
  // isOpenForRegistration = true, in the same transaction as the write
  // that sets it — so the two updates commit or roll back together and a
  // program is never left with zero or two curricula open for
  // registration at once.
  // Future: Phase 13 (Audit) should log this auto-unset as its own audit
  // entry, separate from the primary update, since it is a system-driven
  // side effect rather than a direct user action on that row.
  private async unsetOtherOpenCurricula(
    tx: Prisma.TransactionClient,
    programId: string,
    excludeId?: string,
  ) {
    await tx.curriculum.updateMany({
      where: {
        programId,
        isOpenForRegistration: true,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      data: { isOpenForRegistration: false },
    });
  }
}
