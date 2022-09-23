import { generateQRCodeURL } from './../../common/helper/2-factor-authentication/qrcode';
import {
  generateOtpCode,
  verifyOtpToken,
  generateOtpUri,
  generateOtpSecret,
  verifyAuthenticatorCode,
} from './../../common/helper/2-factor-authentication/otplib';
import { MailService } from './../../notifications/mail/mail.service';
import { PrismaService } from './../../prisma/prisma.service';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { AuthService } from '../auth.service';
import { ConfigService } from '@nestjs/config';

enum TFAStatus {
  ON = 'On',
  OFF = 'Off',
}

@Injectable()
export class TfaService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
    private mailService: MailService,
    private config: ConfigService,
  ) {}

  private async _updateUserTFASecret(
    userId: number,
    secret: string,
  ): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          tfaSecret: secret,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  private async _changeUserTFAStatus(
    userId: number,
    status: TFAStatus,
  ): Promise<void> {
    try {
      if (status === TFAStatus.ON) {
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            tfaEnabled: true,
          },
        });
      }

      if (status === TFAStatus.OFF) {
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            tfaEnabled: false,
            tfaSecret: null,
          },
        });
      }
    } catch (error) {
      throw error;
    }
  }

  private _verifyOtpCode(
    code: string,
    secret: string,
    fromQR = false,
  ): boolean {
    if (!secret) return false;
    if (fromQR) return verifyAuthenticatorCode(code, secret);
    return verifyOtpToken(code, secret);
  }

  private async _createQRCode(userId: number): Promise<any> {
    try {
      const user: User = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      const appName = this.config.get('APP_NAME');
      const otpUrl = generateOtpUri(user.fullname, appName, user.tfaSecret);
      return generateQRCodeURL(otpUrl);
    } catch (error) {
      throw error;
    }
  }

  async enableTFAByQRCode(user: User): Promise<any> {
    try {
      if (user.tfaEnabled)
        throw new BadRequestException(
          'Your account has been enabled 2-factor authentication',
        );

      const secretForUser = generateOtpSecret();
      await this._updateUserTFASecret(user.id, secretForUser);

      return this._createQRCode(user.id);
    } catch (error) {
      throw error;
    }
  }

  async enableTFAByEmail(user: User) {
    try {
      if (!user.email)
        throw new ForbiddenException('Account is not set up email');
      if (user.tfaEnabled)
        throw new BadRequestException(
          'Your account has been enabled 2-factor authentication',
        );

      const secretForUser = generateOtpSecret();
      await this._updateUserTFASecret(user.id, secretForUser);
      const enableCode = generateOtpCode(secretForUser);
      this.mailService.enableTFA(user, enableCode);

      return {
        message: 'Enable code has been sent to your email',
      };
    } catch (error) {
      throw error;
    }
  }

  async turnOnTFA(user: User, otpCode: string, fromCode: string): Promise<any> {
    try {
      const isValid =
        fromCode === 'qr'
          ? this._verifyOtpCode(otpCode, user.tfaSecret, true)
          : this._verifyOtpCode(otpCode, user.tfaSecret);
      if (!isValid) {
        throw new ForbiddenException('OTP Code is not valid');
      }

      if (user.tfaEnabled) {
        throw new BadRequestException(
          'Your account has been enabled 2-factor authentication',
        );
      }

      await this._changeUserTFAStatus(user.id, TFAStatus.ON);

      const userTFAEnabled = await this.prisma.user.findUnique({
        where: { id: user.id },
      });

      const tokens = await this.authService.getNewUserToken(
        userTFAEnabled,
        true,
      );

      return {
        message: 'Your account has two-factor authentication enabled',
        ...tokens,
      };
    } catch (error) {
      throw error;
    }
  }

  async disableTFAByEmail(user: User) {
    try {
      if (!user.email)
        throw new ForbiddenException('Account is not set up email');
      if (!user.tfaEnabled)
        throw new BadRequestException(
          "Your account hasn't been enabled 2-factor authentication",
        );

      let secret: string = user.tfaSecret;
      if (!secret) {
        const secretForUser = generateOtpSecret();
        await this._updateUserTFASecret(user.id, secretForUser);
        secret = secretForUser;
      }
      const disableCode = generateOtpCode(secret);
      this.mailService.disableTFA(user, disableCode);

      return {
        message: 'Disable code has been sent to your email',
      };
    } catch (error) {
      throw error;
    }
  }

  async turnOffTFA(
    user: User,
    otpCode: string,
    fromCode: string,
  ): Promise<any> {
    try {
      const isValid =
        fromCode === 'qr'
          ? this._verifyOtpCode(otpCode, user.tfaSecret, true)
          : this._verifyOtpCode(otpCode, user.tfaSecret);
      if (!isValid) {
        throw new ForbiddenException('OTP Code is not valid');
      }

      if (!user.tfaEnabled) {
        throw new BadRequestException(
          "Your account hasn't been enabled 2-factor authentication",
        );
      }

      await this._changeUserTFAStatus(user.id, TFAStatus.OFF);

      const userTFADisabled = await this.prisma.user.findUnique({
        where: { id: user.id },
      });

      const tokens = await this.authService.getNewUserToken(userTFADisabled);

      return {
        message: 'Your account has two-factor authentication disabled',
        ...tokens,
      };
    } catch (error) {
      throw error;
    }
  }

  async sendCodeToEmail(user: User): Promise<any> {
    try {
      if (!user.email)
        throw new ForbiddenException('Account is not set up email');

      let secret: string = user.tfaSecret;
      if (!secret) {
        const secretForUser = generateOtpSecret();
        await this._updateUserTFASecret(user.id, secretForUser);
        secret = secretForUser;
      }
      const otpCode = generateOtpCode(secret);
      this.mailService.sendOtpCode(user, otpCode);

      return {
        message:
          'OTP code has been sent to your email, please verify in 2 minutes',
      };
    } catch (error) {
      throw error;
    }
  }

  async sendQRCode(user: User): Promise<any> {
    try {
      let secret: string = user.tfaSecret;
      if (!secret) {
        const secretForUser = generateOtpSecret();
        await this._updateUserTFASecret(user.id, secretForUser);
        secret = secretForUser;
      }

      return this._createQRCode(user.id);
    } catch (error) {
      throw error;
    }
  }

  async verify2FactorAuthentication(
    user: User,
    otpCode: string,
    fromCode: string,
  ): Promise<any> {
    try {
      const isValid =
        fromCode === 'qr'
          ? this._verifyOtpCode(otpCode, user.tfaSecret, true)
          : this._verifyOtpCode(otpCode, user.tfaSecret);
      if (!isValid) {
        throw new ForbiddenException('OTP Code is not valid');
      }

      const tokens = await this.authService.getNewUserToken(user, true);

      return {
        message: 'Verify 2-factor authentication successfully',
        ...tokens,
      };
    } catch (error) {
      throw error;
    }
  }
}
