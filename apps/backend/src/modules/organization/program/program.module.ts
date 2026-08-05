import { Module } from '@nestjs/common';
import { DepartmentModule } from '../department/department.module';
import { ScopeModule } from '../../../common/scope/scope.module';
import { ProgramController } from './program.controller';
import { ProgramService } from './program.service';

@Module({
  imports: [DepartmentModule, ScopeModule],
  controllers: [ProgramController],
  providers: [ProgramService],
  exports: [ProgramService],
})
export class ProgramModule {}
