import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PrismaModule } from './prisma/prisma.module';
import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { CaslModule } from './casl/casl.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AwsS3Module } from './common/external-services/aws-s3/aws-s3.module';
import { FilesModule } from './files/files.module';
import { TagsModule } from './api/tags/tags.module';
import { CategoriesModule } from './api/categories/categories.module';
import { ProductsModule } from './api/products/products.module';
import { FirebaseAdminModule } from './common/external-services/firebase-admin/firebase-admin.module';
import { ShoppingCartsModule } from './api/shopping-carts/shopping-carts.module';
import { FavoritesModule } from './api/favorites/favorites.module';
import { AddressesModule } from './api/addresses/addresses.module';
import { OrdersModule } from './api/orders/orders.module';
import { VnpayModule } from './common/external-services/vnpay/vnpay.module';
import { WebsocketModule } from './websocket/websocket.module';
import { ChatsModule } from './api/chats/chats.module';
import { CommentsModule } from './api/comments/comments.module';
import { BlogsModule } from './api/blogs/blogs.module';
import { VouchersModule } from './api/vouchers/vouchers.module';
import { FlashSalesModule } from './api/flash-sales/flash-sales.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ReportsModule } from './api/reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    CaslModule,
    NotificationsModule,
    AwsS3Module,
    FilesModule,
    TagsModule,
    CategoriesModule,
    ProductsModule,
    FirebaseAdminModule,
    ShoppingCartsModule,
    FavoritesModule,
    AddressesModule,
    OrdersModule,
    VnpayModule,
    WebsocketModule,
    ChatsModule,
    CommentsModule,
    BlogsModule,
    VouchersModule,
    FlashSalesModule,
    ReportsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
