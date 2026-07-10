import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('delivery')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly delivery: DeliveryService) {}

  @Post('merchants')
  @ApiOperation({ summary: 'Register as a merchant (restaurant, pharmacy, etc.)' })
  register(@CurrentUser('id') userId: string, @Body() body: any) {
    return this.delivery.registerMerchant(userId, body);
  }

  @Get('merchants/nearby')
  @ApiOperation({ summary: 'Find nearby merchants' })
  nearby(@Query('lat') lat: number, @Query('lng') lng: number, @Query('radius') radius = 5000) {
    return this.delivery.listNearbyMerchants(Number(lat), Number(lng), Number(radius));
  }

  @Get('merchants/:id/menu')
  @ApiOperation({ summary: 'Get a merchant\'s menu' })
  menu(@Param('id') id: string) {
    return this.delivery.getMenu(id);
  }

  @Post('merchants/:id/categories')
  @ApiOperation({ summary: 'Add a menu category' })
  createCategory(@Param('id') id: string, @Body() body: { name: string; sortOrder?: number }) {
    return this.delivery.createCategory(id, body.name, body.sortOrder);
  }

  @Post('merchants/:id/items')
  @ApiOperation({ summary: 'Add a menu item' })
  createItem(@Param('id') id: string, @Body() body: any) {
    return this.delivery.createMenuItem(id, body);
  }

  @Post('orders')
  @ApiOperation({ summary: 'Place a delivery order' })
  placeOrder(@CurrentUser('id') userId: string, @Body() body: any) {
    return this.delivery.placeOrder(userId, body);
  }

  @Patch('orders/:id/confirm')
  @ApiOperation({ summary: 'Merchant confirms an order' })
  confirm(@Param('id') id: string, @Body() body: { merchantId: string }) {
    return this.delivery.confirmOrder(body.merchantId, id);
  }

  @Patch('orders/:id/ready')
  @ApiOperation({ summary: 'Merchant marks order ready for pickup' })
  ready(@Param('id') id: string, @Body() body: { merchantId: string }) {
    return this.delivery.markReady(body.merchantId, id);
  }

  @Patch('orders/:id/assign')
  @ApiOperation({ summary: 'Assign a driver to pick up the order' })
  assign(@Param('id') id: string, @Body() body: { driverId: string }) {
    return this.delivery.assignDriver(id, body.driverId);
  }

  @Patch('orders/:id/deliver')
  @ApiOperation({ summary: 'Driver delivers order (requires OTP)' })
  deliver(@Param('id') id: string, @Body() body: { otp: string }) {
    return this.delivery.deliverOrder(id, body.otp);
  }

  @Patch('orders/:id/cancel')
  @ApiOperation({ summary: 'Cancel an order' })
  cancel(@Param('id') id: string, @Body() body: { reason: string; by?: string }) {
    return this.delivery.cancelOrder(id, body.reason, (body.by as any) ?? 'customer');
  }
}
