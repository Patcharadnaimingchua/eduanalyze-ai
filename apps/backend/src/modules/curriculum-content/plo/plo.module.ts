import { Module } from '@nestjs/common';
import { CurriculumModule } from '../../organization/curriculum/curriculum.module';
import { PloController } from './plo.controller';
import { PloService } from './plo.service';

@Module({
  imports: [CurriculumModule],
  controllers: [PloController],
  providers: [PloService],
  exports: [PloService],
})
export class PloModule {}
