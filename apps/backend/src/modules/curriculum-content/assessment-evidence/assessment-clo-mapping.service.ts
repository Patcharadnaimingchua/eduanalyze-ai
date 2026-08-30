import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CloService } from '../clo/clo.service';
import { AssessmentDefinitionService } from './assessment-definition.service';
import { CreateAssessmentCloMappingDto } from './dto/create-assessment-clo-mapping.dto';

@Injectable()
export class AssessmentCloMappingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloService: CloService,
    private readonly assessmentDefinitionService: AssessmentDefinitionService,
  ) {}

  async create(dto: CreateAssessmentCloMappingDto) {
    await this.assessmentDefinitionService.assertBelongsToCourse(
      dto.assessmentDefinitionId,
      dto.courseId,
    );
    await this.cloService.findActiveByIdOrThrow(dto.cloId);
    await this.assertAvailable(dto.assessmentDefinitionId, dto.cloId);

    return this.prisma.assessmentCloMapping.create({
      data: {
        weight: dto.weight,
        maxScoreOverride: dto.maxScoreOverride,
        assessmentDefinitionId: dto.assessmentDefinitionId,
        cloId: dto.cloId,
      },
    });
  }

  findAllByDefinition(assessmentDefinitionId: string) {
    return this.prisma.assessmentCloMapping.findMany({
      where: { assessmentDefinitionId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Verifies assessmentDefinitionId genuinely belongs to courseId (the
  // guard only proves the requester may act on courseId, not that this
  // particular definition is really inside it) before listing.
  async findAllByDefinitionInCourse(assessmentDefinitionId: string, courseId: string) {
    await this.assessmentDefinitionService.assertBelongsToCourse(assessmentDefinitionId, courseId);
    return this.findAllByDefinition(assessmentDefinitionId);
  }

  async findActiveByIdOrThrow(id: string) {
    const mapping = await this.prisma.assessmentCloMapping.findUnique({ where: { id } });
    if (!mapping || !mapping.isActive) {
      throw new NotFoundException(`Active assessment CLO mapping ${id} not found`);
    }
    return mapping;
  }

  // Same courseId-integrity role as AssessmentDefinitionService's own
  // assertBelongsToCourse — resolves up one more level (mapping ->
  // definition -> course) for StudentAssessmentScoreService.
  async assertBelongsToCourse(assessmentCloMappingId: string, courseId: string) {
    const mapping = await this.findActiveByIdOrThrow(assessmentCloMappingId);
    await this.assessmentDefinitionService.assertBelongsToCourse(
      mapping.assessmentDefinitionId,
      courseId,
    );
    return mapping;
  }

  // findFirst, not findUnique — CONVENTIONS.md §7: assessment_clo_mappings
  // combines isActive with a natural-key uniqueness rule, enforced by a
  // partial index the Prisma client has no compound-key shorthand for.
  private async assertAvailable(assessmentDefinitionId: string, cloId: string) {
    const existing = await this.prisma.assessmentCloMapping.findFirst({
      where: { assessmentDefinitionId, cloId, isActive: true },
    });
    if (existing) {
      throw new ConflictException(
        `This assessment is already mapped to CLO ${cloId}`,
      );
    }
  }
}
