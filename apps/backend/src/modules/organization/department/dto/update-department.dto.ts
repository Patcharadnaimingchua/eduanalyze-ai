import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateDepartmentDto } from './create-department.dto';

// Parent is immutable: ScopeGuard only checks the current parent, so re-parenting would bypass scope.
export class UpdateDepartmentDto extends PartialType(
  OmitType(CreateDepartmentDto, ['facultyId'] as const),
) {}
