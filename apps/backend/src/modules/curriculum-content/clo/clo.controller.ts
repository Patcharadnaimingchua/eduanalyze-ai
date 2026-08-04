import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CloService } from './clo.service';
import { CreateCloDto } from './dto/create-clo.dto';
import { UpdateCloDto } from './dto/update-clo.dto';

@ApiTags('curriculum-content')
@Controller('clos')
export class CloController {
  constructor(private readonly cloService: CloService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List active CLOs' })
  @ApiResponse({ status: 200, description: 'List of active CLOs' })
  findAll() {
    return this.cloService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get a CLO by id' })
  @ApiResponse({ status: 200, description: 'CLO found' })
  @ApiResponse({ status: 404, description: 'CLO not found' })
  findOne(@Param('id') id: string) {
    return this.cloService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a CLO' })
  @ApiResponse({ status: 201, description: 'CLO created' })
  @ApiResponse({ status: 404, description: 'Course not found or inactive' })
  @ApiResponse({
    status: 409,
    description: 'CLO code already in use within this course',
  })
  create(@Body() dto: CreateCloDto) {
    return this.cloService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a CLO' })
  @ApiResponse({ status: 200, description: 'CLO updated' })
  @ApiResponse({ status: 404, description: 'CLO not found' })
  @ApiResponse({
    status: 409,
    description: 'CLO code already in use within this course',
  })
  update(@Param('id') id: string, @Body() dto: UpdateCloDto) {
    return this.cloService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Soft-delete a CLO' })
  @ApiResponse({ status: 200, description: 'CLO deactivated' })
  @ApiResponse({ status: 404, description: 'CLO not found' })
  @ApiResponse({
    status: 409,
    description: 'CLO still has active CLO-PLO mappings',
  })
  remove(@Param('id') id: string) {
    return this.cloService.remove(id);
  }
}
