import { Module } from '@nestjs/common';
import { FacultyModule } from '../faculty/faculty.module';
import { ScopeModule } from '../../../common/scope/scope.module';
import { DepartmentController } from './department.controller';
import { DepartmentService } from './department.service';

@Module({
  imports: [FacultyModule, ScopeModule],
  controllers: [DepartmentController],
  providers: [DepartmentService],
  exports: [DepartmentService],
})
export class DepartmentModule {}
