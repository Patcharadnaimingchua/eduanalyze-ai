import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
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
import { CreateUserScopeDto } from './dto/create-user-scope.dto';
import { UserScopeService } from './user-scope.service';

@ApiTags('users')
@Controller('users/:userId/scopes')
export class UserScopeController {
  constructor(private readonly userScopeService: UserScopeService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: "List a user's scopes" })
  @ApiResponse({ status: 200, description: "List of the user's scopes" })
  @ApiResponse({ status: 404, description: 'User not found' })
  findAll(
    @Param('userId') userId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.userScopeService.listForUser(userId, user);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Grant a scope to a user' })
  @ApiResponse({ status: 201, description: 'Scope granted' })
  @ApiResponse({ status: 403, description: 'Grant is outside your own scope' })
  @ApiResponse({ status: 404, description: 'User or scope target not found' })
  create(
    @Param('userId') userId: string,
    @Body() dto: CreateUserScopeDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.userScopeService.grantScope(
      userId,
      dto.level,
      dto.targetId,
      user,
    );
  }

  @Delete(':scopeId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Revoke a scope from a user' })
  @ApiResponse({ status: 200, description: 'Scope revoked' })
  @ApiResponse({ status: 403, description: 'Revoke is outside your own scope' })
  @ApiResponse({ status: 404, description: 'Scope not found' })
  remove(
    @Param('scopeId') scopeId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.userScopeService.revoke(scopeId, user);
  }
}
