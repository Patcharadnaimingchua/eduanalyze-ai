import { Module } from '@nestjs/common';
import { AcademicYearModule } from '../academic-year/academic-year.module';
import { SemesterController } from './semester.controller';
import { SemesterService } from './semester.service';

@Module({
  imports: [AcademicYearModule],
  controllers: [SemesterController],
  providers: [SemesterService],
  exports: [SemesterService],
})
export class SemesterModule {}
