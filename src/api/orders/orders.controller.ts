import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { Request } from 'express';
import { PublicRoute, UserInRequest } from '../../common/decorators';
import { RoleGuard } from '../../common/guards';
import { CreateOrderDto, RatingPurchasedDto } from './dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
// @UseGuards(RoleGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  createOrder(@UserInRequest() user: User, @Body() body: CreateOrderDto) {
    return this.ordersService.createOrder(user.id, body);
  }

  @Get(':id/payment-online')
  async payOnlineOrder(
    @Req() req: Request,
    @UserInRequest() user: User,
    @Param('id', ParseIntPipe) orderId: number,
  ) {
    const url = await this.ordersService.payOnlineOrder(
      user.id,
      orderId,
      req.ip,
    );
    return url;
  }

  @Get('vnpay_return')
  @PublicRoute()
  notificateVnpayPayment(@Query() query: any) {
    return this.ordersService.notificationVnpayPayment(query);
  }

  @Get('vnpay_ipn')
  @PublicRoute()
  handleVnpayPayment(@Query() query: any) {
    return this.ordersService.handleVnpayPayment(query);
  }

  @Patch(':id/cancel')
  cancelOrder(
    @Req() req: Request,
    @UserInRequest() user: User,
    @Param('id', ParseIntPipe) orderId: number,
  ) {
    return this.ordersService.userCancelOrder(user.id, orderId);
  }

  @Post(':id/rating-product')
  ratingPurchasedProduct(
    @UserInRequest() user: User,
    @Param('id', ParseIntPipe) orderId: number,
    @Body() body: RatingPurchasedDto,
  ) {
    return this.ordersService.ratingPurchasedProduct(user.id, orderId, body);
  }
}
