import { TfaAuthGuard } from './../common/guards/tfa-auth.guard';
import { TfaService } from './tfa/tfa.service';
import { RegisterDto, LoginDto, RefreshTokenDto, OtpCodeDto } from './dto';
import { AuthService } from './auth.service';
import { PublicRoute, UserInRequest } from '../common/decorators';
import { GithubAuthGuard, GoogleAuthGuard } from '../common/guards';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private tfaService: TfaService,
  ) {}

  @Post('register')
  @PublicRoute()
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
  @PublicRoute()
  @HttpCode(200)
  login(@Body() body: LoginDto) {
    const { identifier, password } = body;

    const emailRegex =
      /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,})$/;

    if (emailRegex.test(identifier)) {
      return this.authService.loginWithEmail({
        email: identifier,
        password,
      });
    } else {
      return this.authService.loginWithUserName({
        username: identifier,
        password,
      });
    }
  }

  @Get('login/google')
  @PublicRoute()
  @UseGuards(GoogleAuthGuard)
  async loginGoogle() {
    return;
  }

  @Get('login/google-callback')
  @PublicRoute()
  @UseGuards(GoogleAuthGuard)
  googleAuthRedirect(@Req() req) {
    const { googleId, googleName } = req.user;
    return this.authService.loginWithGoogle(googleId, googleName);
  }

  @Get('login/github')
  @PublicRoute()
  @UseGuards(GithubAuthGuard)
  async loginGithub() {
    return;
  }

  @Get('login/github-callback')
  @PublicRoute()
  @UseGuards(GithubAuthGuard)
  githubAuthRedirect(@Req() req) {
    const { githubId, githubName } = req.user;
    return this.authService.loginWithGithub(githubId, githubName);
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(200)
  logout(@UserInRequest('id') userId: number) {
    return this.authService.logout(userId);
  }

  @Post('refresh-token')
  @PublicRoute()
  @HttpCode(200)
  refreshToken(@Body() body: RefreshTokenDto) {
    return this.authService.refreshToken(body.refreshToken);
  }

  @Get('verify-account')
  @PublicRoute()
  async verifyAccount(
    @Query('token') token: string,
    @Query('redirect') redirectTo: string | undefined,
    @Res() res: Response,
  ) {
    const result = await this.authService.verifyAccount(token);

    if (redirectTo) {
      return res.redirect(redirectTo);
    }
    return res.json(result);
  }

  @ApiBearerAuth()
  @Get('2fa/enable/qr-code')
  async enableTFAByQRCode(@UserInRequest() user: User) {
    return this.tfaService.enableTFAByQRCode(user);
  }

  @ApiBearerAuth()
  @Get('2fa/enable/email')
  async enableTFAByEmail(@UserInRequest() user: User) {
    return this.tfaService.enableTFAByEmail(user);
  }

  @ApiBearerAuth()
  @Post('2fa/enable')
  @HttpCode(200)
  async confirmEnableTFA(
    @UserInRequest() user: User,
    @Body() body: OtpCodeDto,
  ) {
    console.log(body);
    return this.tfaService.turnOnTFA(user, body.code, body.from);
  }

  @ApiBearerAuth()
  @Get('2fa/disable/email')
  async disableTFAByEmail(@UserInRequest() user: User) {
    return this.tfaService.disableTFAByEmail(user);
  }

  @ApiBearerAuth()
  @Post('2fa/disable')
  @HttpCode(200)
  async confirmDisableTFA(
    @UserInRequest() user: User,
    @Body() body: OtpCodeDto,
  ) {
    console.log(body);
    return this.tfaService.turnOffTFA(user, body.code, body.from);
  }

  @ApiBearerAuth()
  @Get('2fa/verify/email')
  @PublicRoute()
  @UseGuards(TfaAuthGuard)
  async sendCodeToEmail(@UserInRequest() user: User) {
    return this.tfaService.sendCodeToEmail(user);
  }

  @ApiBearerAuth()
  @Get('2fa/verify/qr-code')
  @PublicRoute()
  @UseGuards(TfaAuthGuard)
  async sendQRCode(@UserInRequest() user: User) {
    return this.tfaService.sendQRCode(user);
  }

  @ApiBearerAuth()
  @Post('2fa/verify')
  @PublicRoute()
  @UseGuards(TfaAuthGuard)
  @HttpCode(200)
  async verifyOtpCode(@UserInRequest() user: User, @Body() body: OtpCodeDto) {
    return this.tfaService.verify2FactorAuthentication(
      user,
      body.code,
      body.from,
    );
  }
}
