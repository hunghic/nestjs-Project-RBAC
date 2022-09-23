import { AdminVouchersController } from './admin-vouchers.controller';
import { Module } from '@nestjs/common';
import { VouchersController } from './vouchers.controller';
import { VouchersService } from './vouchers.service';

@Module({
  controllers: [VouchersController, AdminVouchersController],
  providers: [VouchersService],
})
export class VouchersModule {}
