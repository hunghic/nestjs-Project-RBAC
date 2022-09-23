import { FirebaseAdminModule } from '../../common/external-services/firebase-admin/firebase-admin.module';
import { Module } from '@nestjs/common';
import { ShoppingCartsController } from './shopping-carts.controller';
import { ShoppingCartsService } from './shopping-carts.service';

@Module({
  imports: [FirebaseAdminModule],
  controllers: [ShoppingCartsController],
  providers: [ShoppingCartsService],
  exports: [ShoppingCartsService],
})
export class ShoppingCartsModule {}
