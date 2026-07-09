import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DispatchService } from './dispatch.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('dispatch')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dispatch')
export class DispatchController {
  constructor(private readonly dispatch: DispatchService) {}

  @Post('respond')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Driver responds to a trip offer' })
  respond(
    @CurrentUser('id') userId: string,
    @Body() body: { tripId: string; accept: boolean },
  ) {
    // Resolve driverId from userId
    return (async () => {
      const driver = await this.dispatch['prisma'].driver.findUnique({ where: { userId } });
      if (!driver) throw new Error('Driver not found');
      return this.dispatch.respondToOffer(driver.id, body.tripId, body.accept);
    })();
  }
}
