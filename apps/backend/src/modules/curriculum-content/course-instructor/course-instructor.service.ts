import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ScopeResolverService } from '../../../common/scope/scope-resolver.service';
import { RequestUser } from '../../auth/request-user.interface';
import { UserService } from '../../users/user/user.service';
import { UserRoleService } from '../../users/user-role/user-role.service';
import { CourseService } from '../course/course.service';
import { CreateCourseInstructorDto } from './dto/create-course-instructor.dto';

@Injectable()
export class CourseInstructorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly userRoleService: UserRoleService,
    private readonly courseService: CourseService,
    private readonly scopeResolverService: ScopeResolverService,
  ) {}

  async create(dto: CreateCourseInstructorDto) {
    await this.userService.findById(dto.userId);
    await this.courseService.findActiveByIdOrThrow(dto.courseId);

    const hasInstructorRole = await this.userRoleService.hasRole(
      dto.userId,
      Role.INSTRUCTOR,
    );
    if (!hasInstructorRole) {
      throw new BadRequestException(
        `User ${dto.userId} does not have the INSTRUCTOR role assigned`,
      );
    }

    try {
      return await this.prisma.courseInstructor.create({
        data: { userId: dto.userId, courseId: dto.courseId },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `User ${dto.userId} is already assigned to course ${dto.courseId}`,
        );
      }
      throw error;
    }
  }

  async findAll(courseId?: string) {
    return this.prisma.courseInstructor.findMany({
      where: courseId ? { courseId } : undefined,
    });
  }

  async remove(id: string, requester: RequestUser) {
    const existing = await this.prisma.courseInstructor.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Course instructor assignment ${id} not found`);
    }

    if (!requester.roles.includes('SUPER_ADMIN')) {
      const ancestry = await this.scopeResolverService.resolveAncestry(
        'course',
        existing.courseId,
      );
      const effectiveScopes = await this.scopeResolverService.getEffectiveScopes(
        requester.userId,
      );
      if (!this.scopeResolverService.isCovered(ancestry, effectiveScopes)) {
        throw new ForbiddenException('You do not have scope covering this course');
      }
    }

    return this.prisma.courseInstructor.delete({ where: { id } });
  }
}
