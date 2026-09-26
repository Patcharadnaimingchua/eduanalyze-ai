import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateCourseDto } from './create-course.dto';

// Parent is immutable: ScopeGuard only checks the current parent, so re-parenting would bypass scope.
// categoryId stays editable — CourseService checks it belongs to the course's own curriculum.
export class UpdateCourseDto extends PartialType(
  OmitType(CreateCourseDto, ['curriculumId'] as const),
) {}
