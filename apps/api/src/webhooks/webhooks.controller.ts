import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('webhooks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('DEVELOPER', 'SUPER_ADMIN', 'PLATFORM_ADMIN')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  @Post('endpoints')
  @ApiOperation({ summary: 'Register a webhook endpoint (returns secret once)' })
  create(
    @CurrentUser('id') userId: string,
    @Body() body: { url: string; events: string[]; description?: string },
  ) {
    return this.webhooks.createEndpoint(userId, body);
  }

  @Get('endpoints')
  @ApiOperation({ summary: 'List my webhook endpoints' })
  list(@CurrentUser('id') userId: string) {
    return this.webhooks.listEndpoints(userId);
  }

  @Delete('endpoints/:id')
  @ApiOperation({ summary: 'Delete a webhook endpoint' })
  delete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.webhooks.deleteEndpoint(userId, id);
  }
}
