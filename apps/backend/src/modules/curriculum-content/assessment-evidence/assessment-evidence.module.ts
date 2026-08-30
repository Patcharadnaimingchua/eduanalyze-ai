import { Module } from '@nestjs/common';
import { CourseModule } from '../course/course.module';
import { CloModule } from '../clo/clo.module';
import { SemesterModule } from '../../academic-record/semester/semester.module';
import { StudentCourseRecordModule } from '../../academic-record/student-course-record/student-course-record.module';
import { StudentProfileModule } from '../../users/student-profile/student-profile.module';
import { ScopeModule } from '../../../common/scope/scope.module';
import { AssessmentDefinitionController } from './assessment-definition.controller';
import { AssessmentDefinitionService } from './assessment-definition.service';
import { AssessmentCloMappingController } from './assessment-clo-mapping.controller';
import { AssessmentCloMappingService } from './assessment-clo-mapping.service';
import { StudentAssessmentScoreController } from './student-assessment-score.controller';
import { StudentAssessmentScoreService } from './student-assessment-score.service';
import { ActualAchievementController } from './actual-achievement.controller';
import { ActualAchievementService } from './actual-achievement.service';

// Evidence-based CLO/PLO infrastructure (Architecture Proposal Phase 1).
// Deliberately its own module, not folded into clo-achievement/
// plo-achievement — those two stay grade-based and untouched; this is a
// parallel, independent system (see schema.prisma's
// "Evidence-based CLO/PLO infrastructure" comment block).
@Module({
  imports: [
    CourseModule,
    CloModule,
    SemesterModule,
    StudentCourseRecordModule,
    StudentProfileModule,
    ScopeModule,
  ],
  controllers: [
    AssessmentDefinitionController,
    AssessmentCloMappingController,
    StudentAssessmentScoreController,
    ActualAchievementController,
  ],
  providers: [
    AssessmentDefinitionService,
    AssessmentCloMappingService,
    StudentAssessmentScoreService,
    ActualAchievementService,
  ],
  exports: [
    AssessmentDefinitionService,
    AssessmentCloMappingService,
    StudentAssessmentScoreService,
    ActualAchievementService,
  ],
})
export class AssessmentEvidenceModule {}
