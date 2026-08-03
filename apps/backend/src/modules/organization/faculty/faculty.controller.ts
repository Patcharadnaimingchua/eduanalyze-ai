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
import { FacultyService } from './faculty.service';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';

@ApiTags('organization')
@Controller('faculties')
export class FacultyController {
  constructor(private readonly facultyService: FacultyService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List active faculties' })
  @ApiResponse({ status: 200, description: 'List of active faculties' })
  findAll() {
    return this.facultyService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get a faculty by id' })
  @ApiResponse({ status: 200, description: 'Faculty found' })
  @ApiResponse({ status: 404, description: 'Faculty not found' })
  findOne(@Param('id') id: string) {
    return this.facultyService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a faculty' })
  @ApiResponse({ status: 201, description: 'Faculty created' })
  @ApiResponse({ status: 409, description: 'Faculty code already in use' })
  create(@Body() dto: CreateFacultyDto) {
    return this.facultyService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a faculty' })
  @ApiResponse({ status: 200, description: 'Faculty updated' })
  @ApiResponse({ status: 404, description: 'Faculty not found' })
  @ApiResponse({ status: 409, description: 'Faculty code already in use' })
  update(@Param('id') id: string, @Body() dto: UpdateFacultyDto) {
    return this.facultyService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Soft-delete a faculty' })
  @ApiResponse({ status: 200, description: 'Faculty deactivated' })
  @ApiResponse({ status: 404, description: 'Faculty not found' })
  @ApiResponse({
    status: 409,
    description: 'Faculty still has active departments',
  })
  remove(@Param('id') id: string) {
    return this.facultyService.remove(id);
  }
}
