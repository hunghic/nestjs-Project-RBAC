import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { RequireRole } from '../../common/decorators';
import { RoleGuard } from '../../common/guards';
import { AdminCancelOrderDto } from './dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders', 'Admin')
@ApiBearerAuth()
@Controller('admin/orders')
@UseGuards(RoleGuard)
@RequireRole(Role.Admin)
export class AdminOrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  getAllOrders() {
    return this.ordersService.getAllOrders();
  }

  @Get(':id')
  getOrderById(@Param('id', ParseIntPipe) orderId: number) {
    return this.ordersService.getOrder(orderId);
  }

  @Patch(':id/cancel')
  cancelOrder(
    @Param('id', ParseIntPipe) orderId: number,
    @Body() body: AdminCancelOrderDto,
  ) {
    return this.ordersService.adminCancelOrder(orderId, body.description);
  }

  @Patch(':id/confirm')
  confirmOrder(@Param('id', ParseIntPipe) orderId: number) {
    return this.ordersService.confirmOrder(orderId);
  }

  @Patch(':id/shipping')
  shippingOrder(@Param('id', ParseIntPipe) orderId: number) {
    return this.ordersService.shippingOrder(orderId);
  }

  @Patch(':id/complete')
  completeOrder(@Param('id', ParseIntPipe) orderId: number) {
    return this.ordersService.completeOrder(orderId);
  }

  @Patch(':id/unclaim')
  unclaimOrder(@Param('id', ParseIntPipe) orderId: number) {
    return this.ordersService.unclaimOrder(orderId);
  }
}
