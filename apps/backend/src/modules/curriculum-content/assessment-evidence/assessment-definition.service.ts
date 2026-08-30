import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CourseService } from '../course/course.service';
import { SemesterService } from '../../academic-record/semester/semester.service';
import { CreateAssessmentDefinitionDto } from './dto/create-assessment-definition.dto';

@Injectable()
export class AssessmentDefinitionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courseService: CourseService,
    private readonly semesterService: SemesterService,
  ) {}

  async create(dto: CreateAssessmentDefinitionDto) {
    await this.courseService.findActiveByIdOrThrow(dto.courseId);
    await this.semesterService.findActiveByIdOrThrow(dto.semesterId);
    return this.prisma.assessmentDefinition.create({
      data: {
        title: dto.title,
        kind: dto.kind,
        maxScore: dto.maxScore,
        missingScorePolicy: dto.missingScorePolicy,
        courseId: dto.courseId,
        semesterId: dto.semesterId,
      },
    });
  }

  findAllByCourse(courseId: string) {
    return this.prisma.assessmentDefinition.findMany({
      where: { courseId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findActiveByIdOrThrow(id: string) {
    const definition = await this.prisma.assessmentDefinition.findUnique({ where: { id } });
    if (!definition || !definition.isActive) {
      throw new NotFoundException(`Active assessment definition ${id} not found`);
    }
    return definition;
  }

  // Used by AssessmentCloMappingService/StudentAssessmentScoreService to
  // verify a caller-supplied courseId actually matches the resource's
  // real course — the InstructorOrScopeGuard on those routes authorizes
  // against the DTO's courseId field directly, so this is what stops a
  // mismatched courseId from ever granting access to the wrong course's
  // data (see CreateAssessmentCloMappingDto's comment).
  async assertBelongsToCourse(assessmentDefinitionId: string, courseId: string) {
    const definition = await this.findActiveByIdOrThrow(assessmentDefinitionId);
    if (definition.courseId !== courseId) {
      throw new NotFoundException(
        `Assessment definition ${assessmentDefinitionId} not found in course ${courseId}`,
      );
    }
    return definition;
  }
}
