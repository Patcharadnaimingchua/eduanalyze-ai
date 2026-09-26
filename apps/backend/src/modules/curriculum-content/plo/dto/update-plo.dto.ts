import { OmitType, PartialType } from '@nestjs/swagger';
import { CreatePloDto } from './create-plo.dto';

// Parent is immutable: ScopeGuard only checks the current parent, so re-parenting would bypass scope.
export class UpdatePloDto extends PartialType(OmitType(CreatePloDto, ['curriculumId'] as const)) {}
