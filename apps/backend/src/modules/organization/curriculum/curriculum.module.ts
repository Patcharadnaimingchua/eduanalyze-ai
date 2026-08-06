import { Module } from '@nestjs/common';
import { ProgramModule } from '../program/program.module';
import { ScopeModule } from '../../../common/scope/scope.module';
import { CurriculumController } from './curriculum.controller';
import { CurriculumService } from './curriculum.service';

@Module({
  imports: [ProgramModule, ScopeModule],
  controllers: [CurriculumController],
  providers: [CurriculumService],
  exports: [CurriculumService],
})
export class CurriculumModule {}
