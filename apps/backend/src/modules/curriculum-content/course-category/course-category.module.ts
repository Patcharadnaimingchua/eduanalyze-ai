import { Module } from '@nestjs/common';
import { CurriculumModule } from '../../organization/curriculum/curriculum.module';
import { ScopeModule } from '../../../common/scope/scope.module';
import { CourseCategoryController } from './course-category.controller';
import { CourseCategoryService } from './course-category.service';

@Module({
  imports: [CurriculumModule, ScopeModule],
  controllers: [CourseCategoryController],
  providers: [CourseCategoryService],
  exports: [CourseCategoryService],
})
export class CourseCategoryModule {}
