import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('trips/:tripId/initiate')
  @ApiOperation({ summary: 'Initiate payment for a trip' })
  initiate(@Param('tripId') tripId: string, @Body() body: { method: string; provider: string }) {
    return this.payments.initiateTripPayment(tripId, body.method, body.provider);
  }

  // Webhooks are PUBLIC — no auth, signature verified by adapter
  @Post('webhooks/:provider')
  @ApiOperation({ summary: 'Payment provider webhook (no auth — signature verified)' })
  webhook(@Param('provider') provider: string, @Body() body: unknown) {
    return this.payments.handleWebhook(provider, body);
  }
}
