import { Body, Controller, Delete, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequestUser } from '../../auth/request-user.interface';
import { CreditLimitRequestService } from './credit-limit-request.service';
import { CreateCreditLimitRequestDto } from './dto/create-credit-limit-request.dto';

@ApiTags('academic-record')
@Controller('credit-limit-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
@ApiBearerAuth('access-token')
export class CreditLimitRequestController {
  constructor(private readonly creditLimitRequestService: CreditLimitRequestService) {}

  @Get('me')
  @ApiOperation({ summary: "Current student's active credit-limit request, or null if none" })
  @ApiResponse({ status: 200, description: 'Request, or null' })
  getMyRequest(@CurrentUser() user: RequestUser) {
    return this.creditLimitRequestService.getMyRequest(user);
  }

  @Post('me')
  @ApiOperation({
    summary:
      'Create/replace the current student\'s credit-limit request — self-declared, takes effect immediately, no approval step',
  })
  @ApiResponse({ status: 201, description: 'Request saved' })
  upsertMyRequest(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateCreditLimitRequestDto,
  ) {
    return this.creditLimitRequestService.upsertMyRequest(user, dto);
  }

  @Delete('me')
  @HttpCode(204)
  @ApiOperation({ summary: "Cancel the current student's credit-limit request" })
  @ApiResponse({ status: 204, description: 'Request removed (or already absent)' })
  deleteMyRequest(@CurrentUser() user: RequestUser) {
    return this.creditLimitRequestService.deleteMyRequest(user);
  }
}
