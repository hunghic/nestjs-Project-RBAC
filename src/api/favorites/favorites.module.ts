import { Module } from '@nestjs/common';
import { FirebaseAdminModule } from 'src/common/external-services/firebase-admin/firebase-admin.module';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';

@Module({
  imports: [FirebaseAdminModule],
  controllers: [FavoritesController],
  providers: [FavoritesService],
  exports: [FavoritesService],
})
export class FavoritesModule {}
