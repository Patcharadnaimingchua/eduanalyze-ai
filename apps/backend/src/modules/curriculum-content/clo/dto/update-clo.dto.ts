import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateCloDto } from './create-clo.dto';

// Parent is immutable: ScopeGuard only checks the current parent, so re-parenting would bypass scope.
export class UpdateCloDto extends PartialType(OmitType(CreateCloDto, ['courseId'] as const)) {}
