import { VnpayModule } from './../../common/external-services/vnpay/vnpay.module';
import { AdminOrdersController } from './admin-orders.controller';
import { Module } from '@nestjs/common';
import { AddressesModule } from '../addresses/addresses.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [AddressesModule, VnpayModule],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
