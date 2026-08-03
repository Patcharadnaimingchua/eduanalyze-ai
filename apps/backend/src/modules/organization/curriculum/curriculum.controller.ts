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
import { CurriculumService } from './curriculum.service';
import { CreateCurriculumDto } from './dto/create-curriculum.dto';
import { UpdateCurriculumDto } from './dto/update-curriculum.dto';

@ApiTags('organization')
@Controller('curricula')
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List active curricula' })
  @ApiResponse({ status: 200, description: 'List of active curricula' })
  findAll() {
    return this.curriculumService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get a curriculum by id' })
  @ApiResponse({ status: 200, description: 'Curriculum found' })
  @ApiResponse({ status: 404, description: 'Curriculum not found' })
  findOne(@Param('id') id: string) {
    return this.curriculumService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a curriculum' })
  @ApiResponse({ status: 201, description: 'Curriculum created' })
  @ApiResponse({ status: 404, description: 'Program not found or inactive' })
  @ApiResponse({
    status: 409,
    description: 'Curriculum version already in use within this program',
  })
  create(@Body() dto: CreateCurriculumDto) {
    return this.curriculumService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a curriculum' })
  @ApiResponse({ status: 200, description: 'Curriculum updated' })
  @ApiResponse({ status: 404, description: 'Curriculum not found' })
  @ApiResponse({
    status: 409,
    description: 'Curriculum version already in use within this program',
  })
  update(@Param('id') id: string, @Body() dto: UpdateCurriculumDto) {
    return this.curriculumService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Soft-delete a curriculum' })
  @ApiResponse({ status: 200, description: 'Curriculum deactivated' })
  @ApiResponse({ status: 404, description: 'Curriculum not found' })
  remove(@Param('id') id: string) {
    return this.curriculumService.remove(id);
  }
}
