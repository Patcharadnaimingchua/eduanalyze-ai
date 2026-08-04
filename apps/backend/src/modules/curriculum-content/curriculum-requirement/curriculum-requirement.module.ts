import { Module } from '@nestjs/common';
import { CurriculumModule } from '../../organization/curriculum/curriculum.module';
import { CourseCategoryModule } from '../course-category/course-category.module';
import { CurriculumRequirementController } from './curriculum-requirement.controller';
import { CurriculumRequirementService } from './curriculum-requirement.service';

@Module({
  imports: [CurriculumModule, CourseCategoryModule],
  controllers: [CurriculumRequirementController],
  providers: [CurriculumRequirementService],
  exports: [CurriculumRequirementService],
})
export class CurriculumRequirementModule {}
