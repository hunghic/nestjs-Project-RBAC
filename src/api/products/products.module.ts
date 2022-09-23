import { FILE_QUEUE } from './../../common/constants';
import { FavoritesModule } from './../favorites/favorites.module';
import { ShoppingCartsModule } from './../shopping-carts/shopping-carts.module';
import { Module } from '@nestjs/common';
import { FilesModule } from '../../files/files.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    FilesModule,
    ShoppingCartsModule,
    FavoritesModule,
    BullModule.registerQueueAsync({
      name: FILE_QUEUE,
      useFactory: async (config: ConfigService) => ({
        redis: {
          host: config.get('REDIS_HOST'),
          port: config.get('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
