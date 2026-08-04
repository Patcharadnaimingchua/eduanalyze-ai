import { PartialType } from '@nestjs/swagger';
import { CreateCurriculumRequirementDto } from './create-curriculum-requirement.dto';

export class UpdateCurriculumRequirementDto extends PartialType(
  CreateCurriculumRequirementDto,
) {}
