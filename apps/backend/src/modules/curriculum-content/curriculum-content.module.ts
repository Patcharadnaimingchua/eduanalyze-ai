import { Module } from '@nestjs/common';
import { CourseCategoryModule } from './course-category/course-category.module';
import { CourseModule } from './course/course.module';
import { CurriculumRequirementModule } from './curriculum-requirement/curriculum-requirement.module';
import { PrerequisiteModule } from './prerequisite/prerequisite.module';

@Module({
  imports: [
    CourseCategoryModule,
    CourseModule,
    CurriculumRequirementModule,
    PrerequisiteModule,
  ],
})
export class CurriculumContentModule {}
