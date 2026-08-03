import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { FacultyModule } from '../../organization/faculty/faculty.module';
import { DepartmentModule } from '../../organization/department/department.module';
import { ProgramModule } from '../../organization/program/program.module';
import { UserScopeService } from './user-scope.service';

@Module({
  imports: [UserModule, FacultyModule, DepartmentModule, ProgramModule],
  providers: [UserScopeService],
  exports: [UserScopeService],
})
export class UserScopeModule {}
