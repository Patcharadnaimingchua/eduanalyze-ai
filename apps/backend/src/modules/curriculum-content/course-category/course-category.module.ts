import { Module } from '@nestjs/common';
import { CurriculumModule } from '../../organization/curriculum/curriculum.module';
import { CourseCategoryController } from './course-category.controller';
import { CourseCategoryService } from './course-category.service';

@Module({
  imports: [CurriculumModule],
  controllers: [CourseCategoryController],
  providers: [CourseCategoryService],
  exports: [CourseCategoryService],
})
export class CourseCategoryModule {}
