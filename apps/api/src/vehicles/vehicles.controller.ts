import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehicles: VehiclesService) {}

  @Post()
  @ApiOperation({ summary: 'Register a vehicle' })
  register(@CurrentUser('id') userId: string, @Body() body: any) {
    return this.vehicles.register(userId, body);
  }

  @Get()
  @ApiOperation({ summary: 'List my vehicles' })
  list(@CurrentUser('id') userId: string) {
    return this.vehicles.listForDriver(userId);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Set as current vehicle' })
  activate(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.vehicles.setActive(userId, id);
  }

  @Patch(':id/verify')
  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'COMPLIANCE')
  @ApiOperation({ summary: 'Verify vehicle (admin)' })
  verify(@Param('id') id: string, @CurrentUser('id') verifier: string) {
    return this.vehicles.verify(id, verifier);
  }
}
