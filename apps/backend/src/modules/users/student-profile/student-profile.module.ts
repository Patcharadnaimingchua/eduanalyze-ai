import { Module } from '@nestjs/common';
import { UserRoleModule } from '../user-role/user-role.module';
import { ProgramModule } from '../../organization/program/program.module';
import { CurriculumModule } from '../../organization/curriculum/curriculum.module';
import { StudentProfileService } from './student-profile.service';

@Module({
  imports: [UserRoleModule, ProgramModule, CurriculumModule],
  providers: [StudentProfileService],
  exports: [StudentProfileService],
})
export class StudentProfileModule {}
