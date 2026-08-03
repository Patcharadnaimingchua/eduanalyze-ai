import { Module } from '@nestjs/common';
import { FacultyModule } from './faculty/faculty.module';
import { DepartmentModule } from './department/department.module';
import { ProgramModule } from './program/program.module';
import { CurriculumModule } from './curriculum/curriculum.module';

@Module({
  imports: [FacultyModule, DepartmentModule, ProgramModule, CurriculumModule],
})
export class OrganizationModule {}
