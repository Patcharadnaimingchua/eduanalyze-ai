import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequestUser } from '../../auth/request-user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserActiveStatusDto } from './dto/update-user-active-status.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { UserManagementService } from './user-management.service';

@ApiTags('users')
@Controller('users')
export class UserManagementController {
  constructor(private readonly userManagementService: UserManagementService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary:
      'Create an ADMIN/STAFF/INSTRUCTOR account (SUPER_ADMIN: any of these; ADMIN: STAFF only, scope required, must be within their own scope). Returns a system-generated temporary password once — relay it to the new user out-of-band; they should change it via PATCH /auth/change-password.',
  })
  @ApiResponse({ status: 201, description: 'User created, temporary password returned' })
  @ApiResponse({ status: 400, description: 'role:STUDENT rejected, or scope missing for ADMIN' })
  @ApiResponse({ status: 403, description: 'Role or scope outside what the requester may grant' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  create(@Body() dto: CreateUserDto, @CurrentUser() user: RequestUser) {
    return this.userManagementService.createStaffOrAdmin(dto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary:
      'List non-STUDENT users — SUPER_ADMIN sees all, ADMIN sees only users within their own scope',
  })
  @ApiResponse({ status: 200, description: 'List of users' })
  findAll(@CurrentUser() user: RequestUser) {
    return this.userManagementService.listUsers(user);
  }

  @Get('instructors')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary:
      'List INSTRUCTOR-role users within the requester scope (STAFF-reachable, unlike GET /users) — for picking an instructor to assign to a course. Returns id/fullName/email only.',
  })
  @ApiResponse({ status: 200, description: 'List of instructors' })
  findInstructors() {
    return this.userManagementService.listInstructors();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found or outside your scope' })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.userManagementService.findOne(id, user);
  }

  @Patch(':id/active-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Suspend or reactivate a user' })
  @ApiResponse({ status: 200, description: 'Active status updated' })
  @ApiResponse({ status: 404, description: 'User not found or outside your scope' })
  updateActiveStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserActiveStatusDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.userManagementService.updateActiveStatus(id, dto.isActive, user);
  }

  @Post(':id/resend-invitation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: "Resend a user's invitation token (regenerates it, replacing any expired one)",
  })
  @ApiResponse({ status: 201, description: 'Invitation resent' })
  @ApiResponse({ status: 404, description: 'User not found or outside your scope' })
  @ApiResponse({ status: 409, description: 'Invitation already accepted' })
  resendInvitation(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.userManagementService.resendInvitation(id, user);
  }

  @Post(':id/roles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Assign an additional role to a user (ADMIN: STAFF only)' })
  @ApiResponse({ status: 201, description: 'Role assigned' })
  @ApiResponse({ status: 404, description: 'User not found or outside your scope' })
  @ApiResponse({ status: 409, description: 'User already has this role' })
  assignRole(
    @Param('id') id: string,
    @Body() dto: AssignRoleDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.userManagementService.assignRole(id, dto.role, user);
  }

  @Delete(':id/roles/:role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Revoke a role from a user (ADMIN: STAFF only)' })
  @ApiResponse({ status: 200, description: 'Role revoked' })
  @ApiResponse({ status: 404, description: 'User not found, outside your scope, or does not have this role' })
  revokeRole(
    @Param('id') id: string,
    @Param('role', new ParseEnumPipe(Role)) role: Role,
    @CurrentUser() user: RequestUser,
  ) {
    return this.userManagementService.revokeRole(id, role, user);
  }
}
