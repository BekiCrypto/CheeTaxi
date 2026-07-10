import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SosService } from './sos.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('sos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sos')
export class SosController {
  constructor(private readonly sos: SosService) {}

  @Post()
  @ApiOperation({ summary: 'Trigger SOS alert' })
  trigger(@CurrentUser('id') userId: string, @Body() body: { tripId?: string; latitude: number; longitude: number; accuracyMeters?: number; reason?: string }) {
    return this.sos.trigger(userId, body);
  }

  @Get('active')
  @Roles('SUPER_ADMIN', 'SAFETY', 'OPERATIONS')
  @ApiOperation({ summary: 'List active SOS alerts' })
  active() {
    return this.sos.listActive();
  }

  @Patch(':id/acknowledge')
  @Roles('SUPER_ADMIN', 'SAFETY')
  @ApiOperation({ summary: 'Acknowledge an SOS alert' })
  acknowledge(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.sos.acknowledge(id, userId);
  }

  @Patch(':id/resolve')
  @Roles('SUPER_ADMIN', 'SAFETY')
  @ApiOperation({ summary: 'Resolve an SOS alert' })
  resolve(@Param('id') id: string, @Body() body: { resolution: string }) {
    return this.sos.resolve(id, body.resolution);
  }
}
