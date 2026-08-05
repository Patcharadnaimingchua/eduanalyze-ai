import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequestUser } from '../../auth/request-user.interface';
import { PloAchievementService } from './plo-achievement.service';

@ApiTags('curriculum-content')
@Controller('plo-achievement')
export class PloAchievementController {
  constructor(private readonly ploAchievementService: PloAchievementService) {}

  @Get('student/:studentProfileId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT', 'SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary:
      'PLO Achievement for a student — radar chart, strengths, areas for improvement (PROJECT_CONTEXT.md §23A/§24)',
  })
  @ApiResponse({ status: 200, description: 'Student PLO achievement report' })
  @ApiResponse({ status: 404, description: 'Student profile not found' })
  calculateForStudent(
    @Param('studentProfileId') studentProfileId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.ploAchievementService.calculateForStudent(
      studentProfileId,
      user,
    );
  }
}
