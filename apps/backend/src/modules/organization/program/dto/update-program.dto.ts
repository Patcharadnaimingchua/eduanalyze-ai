import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateProgramDto } from './create-program.dto';

// Parent is immutable: ScopeGuard only checks the current parent, so re-parenting would bypass scope.
export class UpdateProgramDto extends PartialType(
  OmitType(CreateProgramDto, ['departmentId'] as const),
) {}
