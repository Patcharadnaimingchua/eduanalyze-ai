import { Module } from '@nestjs/common';
import { CurriculumModule } from '../../organization/curriculum/curriculum.module';
import { CourseCategoryModule } from '../course-category/course-category.module';
import { ScopeModule } from '../../../common/scope/scope.module';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';

@Module({
  imports: [CurriculumModule, CourseCategoryModule, ScopeModule],
  controllers: [CourseController],
  providers: [CourseService],
  exports: [CourseService],
})
export class CourseModule {}
