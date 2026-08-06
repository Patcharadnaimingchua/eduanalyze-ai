import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequestUser } from '../../auth/request-user.interface';
import { StudentProfileService } from './student-profile.service';

@ApiTags('users')
@Controller('student-profile')
export class StudentProfileController {
  constructor(private readonly studentProfileService: StudentProfileService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get the current student’s own profile' })
  @ApiResponse({ status: 200, description: 'Own student profile' })
  @ApiResponse({ status: 404, description: 'No student profile found for this user' })
  getMe(@CurrentUser() user: RequestUser) {
    return this.studentProfileService.findByUserId(user.userId);
  }
}
