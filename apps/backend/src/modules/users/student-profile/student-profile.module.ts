import { Module } from '@nestjs/common';
import { UserRoleModule } from '../user-role/user-role.module';
import { ProgramModule } from '../../organization/program/program.module';
import { CurriculumModule } from '../../organization/curriculum/curriculum.module';
import { StudentProfileController } from './student-profile.controller';
import { StudentProfileService } from './student-profile.service';

@Module({
  imports: [UserRoleModule, ProgramModule, CurriculumModule],
  controllers: [StudentProfileController],
  providers: [StudentProfileService],
  exports: [StudentProfileService],
})
export class StudentProfileModule {}
