import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FleetsService } from './fleets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('fleets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fleets')
export class FleetsController {
  constructor(private readonly fleets: FleetsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'FLEET_MANAGER')
  @ApiOperation({ summary: 'Create a fleet (corporate / government / partner)' })
  create(@Body() body: any) {
    return this.fleets.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'List fleets' })
  list(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.fleets.list(Number(page), Number(limit));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get fleet detail with members and vehicles' })
  get(@Param('id') id: string) {
    return this.fleets.get(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'FLEET_MANAGER')
  @ApiOperation({ summary: 'Update fleet info' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.fleets.update(id, body);
  }

  @Post(':id/members')
  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'FLEET_MANAGER')
  @ApiOperation({ summary: 'Add a driver to the fleet' })
  addMember(@Param('id') id: string, @Body() body: { driverId: string; role?: string }) {
    return this.fleets.addMember(id, body.driverId, body.role);
  }

  @Delete(':id/members/:driverId')
  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'FLEET_MANAGER')
  @ApiOperation({ summary: 'Remove a driver from the fleet' })
  removeMember(@Param('id') id: string, @Param('driverId') driverId: string) {
    return this.fleets.removeMember(id, driverId);
  }
}
