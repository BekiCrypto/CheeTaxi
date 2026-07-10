import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BlockchainService } from './blockchain.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('blockchain')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('blockchain')
export class BlockchainController {
  constructor(private readonly blockchain: BlockchainService) {}

  @Post('trips/:tripId/record')
  @ApiOperation({ summary: 'Record a trip hash on the blockchain (immutable audit)' })
  record(@Param('tripId') tripId: string, @Body() body: { tripRecord: Record<string, unknown> }) {
    return this.blockchain.recordTripHash(tripId, body.tripRecord);
  }

  @Post('trips/:tripId/verify')
  @ApiOperation({ summary: 'Verify a trip record against its on-chain hash' })
  verify(@Param('tripId') tripId: string, @Body() body: { tripRecord: Record<string, unknown>; expectedHash: string }) {
    return this.blockchain.verifyTrip(tripId, body.tripRecord, body.expectedHash);
  }

  @Get('trips/:tripId/status')
  @ApiOperation({ summary: 'Get blockchain verification status for a trip' })
  status(@Param('tripId') tripId: string) {
    return this.blockchain.getVerificationStatus(tripId);
  }
}
