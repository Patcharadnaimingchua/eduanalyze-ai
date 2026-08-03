import { Module } from '@nestjs/common';
import { DepartmentModule } from '../department/department.module';
import { ProgramController } from './program.controller';
import { ProgramService } from './program.service';

@Module({
  imports: [DepartmentModule],
  controllers: [ProgramController],
  providers: [ProgramService],
  exports: [ProgramService],
})
export class ProgramModule {}
