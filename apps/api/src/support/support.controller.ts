import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('support')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('support')
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Post('tickets')
  @ApiOperation({ summary: 'Create a support ticket' })
  create(@CurrentUser('id') userId: string, @Body() body: any) {
    return this.support.createTicket(userId, body);
  }

  @Get('tickets/me')
  @ApiOperation({ summary: 'My tickets' })
  myTickets(@CurrentUser('id') userId: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.support.listMyTickets(userId, Number(page), Number(limit));
  }

  @Get('tickets')
  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT', 'OPERATIONS')
  @ApiOperation({ summary: 'Admin: list all tickets' })
  allTickets(@Query('page') page = 1, @Query('limit') limit = 50, @Query('status') status?: string) {
    return this.support.listAllTickets(Number(page), Number(limit), status);
  }

  @Post('tickets/:id/messages')
  @ApiOperation({ summary: 'Add a message to a ticket' })
  addMessage(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() body: { body: string; isInternal?: boolean }) {
    return this.support.addMessage(userId, id, body.body, body.isInternal);
  }

  @Get('tickets/:id/messages')
  @ApiOperation({ summary: 'List messages in a ticket' })
  messages(@Param('id') id: string) {
    return this.support.getMessages(id);
  }

  @Patch('tickets/:id/assign')
  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Assign a ticket' })
  assign(@Param('id') id: string, @Body() body: { assigneeId: string }) {
    return this.support.assign(id, body.assigneeId);
  }

  @Patch('tickets/:id/resolve')
  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT')
  @ApiOperation({ summary: 'Resolve a ticket' })
  resolve(@Param('id') id: string, @Body() body: { resolution: string }) {
    return this.support.resolve(id, body.resolution);
  }
}
