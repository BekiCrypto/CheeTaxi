import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { FcmService } from './providers/fcm.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly fcm: FcmService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List my notifications' })
  list(@CurrentUser('id') userId: string, @Query('page') page = 1, @Query('limit') limit = 20, @Query('unread') unread?: string) {
    return this.notifications.listForUser(userId, Number(page), Number(limit), unread === 'true');
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  markRead(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.notifications.markRead(userId, id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@CurrentUser('id') userId: string) {
    return this.notifications.markAllRead(userId);
  }

  @Post('device/register')
  @ApiOperation({ summary: 'Register a device token for push notifications (FCM)' })
  registerDevice(
    @CurrentUser('id') userId: string,
    @Body() body: { token: string; platform: string; model?: string; osVersion?: string; appVersion?: string },
  ) {
    return this.fcm.registerDevice(userId, body.token, body.platform, {
      model: body.model,
      osVersion: body.osVersion,
      appVersion: body.appVersion,
    });
  }

  @Post('device/unregister')
  @ApiOperation({ summary: 'Unregister a device token (e.g. on logout)' })
  unregisterDevice(@CurrentUser('id') userId: string, @Body() body: { token: string }) {
    return this.fcm.unregisterDevice(userId, body.token);
  }
}
