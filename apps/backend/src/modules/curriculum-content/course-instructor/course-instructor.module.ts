import { Module } from '@nestjs/common';
import { UserModule } from '../../users/user/user.module';
import { UserRoleModule } from '../../users/user-role/user-role.module';
import { CourseModule } from '../course/course.module';
import { ScopeModule } from '../../../common/scope/scope.module';
import { CourseInstructorController } from './course-instructor.controller';
import { CourseInstructorService } from './course-instructor.service';

@Module({
  imports: [UserModule, UserRoleModule, CourseModule, ScopeModule],
  controllers: [CourseInstructorController],
  providers: [CourseInstructorService],
  exports: [CourseInstructorService],
})
export class CourseInstructorModule {}
