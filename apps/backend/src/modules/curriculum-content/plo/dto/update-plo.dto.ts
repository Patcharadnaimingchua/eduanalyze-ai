import { PartialType } from '@nestjs/swagger';
import { CreatePloDto } from './create-plo.dto';

export class UpdatePloDto extends PartialType(CreatePloDto) {}
