import { AdminFlashSalesController } from './admin-flash-sales.controller';
import { Module } from '@nestjs/common';
import { FlashSalesController } from './flash-sales.controller';
import { FlashSalesService } from './flash-sales.service';

@Module({
  controllers: [FlashSalesController, AdminFlashSalesController],
  providers: [FlashSalesService],
})
export class FlashSalesModule {}
