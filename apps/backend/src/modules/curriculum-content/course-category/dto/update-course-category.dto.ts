import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateCourseCategoryDto } from './create-course-category.dto';

// Parent is immutable: ScopeGuard only checks the current parent, so re-parenting would bypass scope.
export class UpdateCourseCategoryDto extends PartialType(
  OmitType(CreateCourseCategoryDto, ['curriculumId'] as const),
) {}
