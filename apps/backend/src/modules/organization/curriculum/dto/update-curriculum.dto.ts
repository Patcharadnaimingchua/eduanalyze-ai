import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateCurriculumDto } from './create-curriculum.dto';

// Parent is immutable: ScopeGuard only checks the current parent, so re-parenting would bypass scope.
export class UpdateCurriculumDto extends PartialType(
  OmitType(CreateCurriculumDto, ['programId'] as const),
) {}
