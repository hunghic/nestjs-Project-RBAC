import { Module } from '@nestjs/common';
import { FirebaseDatabaseService } from './firebase-database.service';

@Module({
  providers: [FirebaseDatabaseService],
  exports: [FirebaseDatabaseService],
})
export class FirebaseAdminModule {}
