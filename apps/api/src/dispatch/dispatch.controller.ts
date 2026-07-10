import { Body, Controller, Post, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DispatchService } from './dispatch.service';
import { PrismaService } from '../common/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('dispatch')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dispatch')
export class DispatchController {
  constructor(
    private readonly dispatch: DispatchService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('respond')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Driver responds to a trip offer' })
  async respond(
    @CurrentUser('id') userId: string,
    @Body() body: { tripId: string; accept: boolean },
  ) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new NotFoundException('Driver not found');
    return this.dispatch.respondToOffer(driver.id, body.tripId, body.accept);
  }
}
