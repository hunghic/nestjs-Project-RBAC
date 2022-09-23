import {
  GithubStrategy,
  GoogleStrategy,
  JwtStrategy,
  TFAStrategy,
} from './strategies';
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TfaService } from './tfa/tfa.service';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    TFAStrategy,
    GoogleStrategy,
    GithubStrategy,
    TfaService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
