import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { FacultyModule } from '../../organization/faculty/faculty.module';
import { DepartmentModule } from '../../organization/department/department.module';
import { ProgramModule } from '../../organization/program/program.module';
import { ScopeModule } from '../../../common/scope/scope.module';
import { UserScopeController } from './user-scope.controller';
import { UserScopeService } from './user-scope.service';

@Module({
  imports: [UserModule, FacultyModule, DepartmentModule, ProgramModule, ScopeModule],
  controllers: [UserScopeController],
  providers: [UserScopeService],
  exports: [UserScopeService],
})
export class UserScopeModule {}
