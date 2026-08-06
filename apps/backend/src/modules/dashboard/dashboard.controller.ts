import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ScopeTarget } from '../../common/decorators/scope-target.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ScopeGuard } from '../../common/guards/scope.guard';
import { RequestUser } from '../auth/request-user.interface';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('student/:studentProfileId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT', 'SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary:
      'Student Dashboard — GPA, credits, progress %, graduation readiness, PLO radar, recent courses, missing requirements (PROJECT_CONTEXT.md §29)',
  })
  @ApiResponse({ status: 200, description: 'Student dashboard report' })
  @ApiResponse({ status: 404, description: 'Student profile not found' })
  getStudentDashboard(
    @Param('studentProfileId') studentProfileId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.dashboardService.getStudentDashboard(studentProfileId, user);
  }

  @Get('instructor')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTRUCTOR')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary:
      "Instructor Dashboard — the current instructor's own courses with student count, CLO/PLO achievement, Course Assessment aggregate (PROJECT_CONTEXT.md §30)",
  })
  @ApiResponse({ status: 200, description: 'Instructor dashboard report' })
  getInstructorDashboard(@CurrentUser() user: RequestUser) {
    return this.dashboardService.getInstructorDashboard(user);
  }

  @Get('curriculum/:curriculumId')
  @UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ScopeTarget('curriculum', { from: 'param', key: 'curriculumId' })
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary:
      'Curriculum/Program Analytics Dashboard — student count, average GPA, graduation readiness, students at risk, PLO radar, cohort comparison, course analytics, lowest CLO/PLO (PROJECT_CONTEXT.md §31)',
  })
  @ApiResponse({ status: 200, description: 'Curriculum dashboard report' })
  @ApiResponse({ status: 403, description: 'No scope covering this curriculum' })
  @ApiResponse({ status: 404, description: 'Curriculum not found or inactive' })
  getCurriculumDashboard(@Param('curriculumId') curriculumId: string) {
    return this.dashboardService.getCurriculumDashboard(curriculumId);
  }
}
