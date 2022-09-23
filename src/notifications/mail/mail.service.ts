import { MAIL_QUEUE } from './../../common/constants';
import {
  generateConfirmEmailToken,
  generateResetPasswordToken,
} from './../../common/helper/jwt/index';
import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  FlashSale,
  Product,
  SystemReport,
  User,
  UserReport,
} from '@prisma/client';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class MailService {
  private baseUrl: string;

  constructor(
    @InjectQueue(MAIL_QUEUE) private mailQueue: Queue,
    private mailerService: MailerService,
    private config: ConfigService,
  ) {
    this.baseUrl = config.get('BASE_URL');
  }

  async accountConfirmation(user: User, redirectUrl?: string): Promise<void> {
    const confirmEmailToken = generateConfirmEmailToken({
      userId: user.id,
      email: user.email,
    });

    let confirmUrl: string;

    if (redirectUrl) {
      confirmUrl = `${this.baseUrl}/auth/verify-account?token=${confirmEmailToken}&redirect=${redirectUrl}`;
    } else {
      confirmUrl = `${this.baseUrl}/auth/verify-account?token=${confirmEmailToken}`;
    }

    const mailOptions: ISendMailOptions = {
      to: user.email,
      subject: 'Welcome to NestJS Shop App! Confirm your Email',
      template: './confirm-account',
      context: {
        userName: user.fullname,
        confirmUrl,
      },
    };

    this.mailerService.sendMail(mailOptions);
    return;
  }

  async forgotPassword(user: User): Promise<void> {
    const resetPasswordToken = generateResetPasswordToken({
      userId: user.id,
      email: user.email,
    });

    const redirectUrl = `${this.baseUrl}/users/welcome`;

    const mailOptions: ISendMailOptions = {
      to: user.email,
      subject: 'Email confirm reset your account password in NestJS Shop App',
      template: './forgot-password',
      context: {
        userName: user.fullname,
        redirectUrl,
        token: resetPasswordToken,
      },
    };

    this.mailerService.sendMail(mailOptions);

    return;
  }

  async enableTFA(user: User, enableCode: string): Promise<void> {
    const mailOptions: ISendMailOptions = {
      to: user.email,
      subject: 'Email confirm enable 2-factor authentication NestJS Shop App',
      template: './enable-2fa',
      context: {
        userName: user.fullname,
        code: enableCode,
      },
    };

    this.mailerService.sendMail(mailOptions);

    return;
  }

  async disableTFA(user: User, disableCode: string): Promise<void> {
    const mailOptions: ISendMailOptions = {
      to: user.email,
      subject: 'Email confirm disable 2-factor authentication NestJS Shop App',
      template: './disable-2fa',
      context: {
        userName: user.fullname,
        code: disableCode,
      },
    };

    this.mailerService.sendMail(mailOptions);

    return;
  }

  async sendOtpCode(user: User, otpCode: string): Promise<void> {
    const mailOptions: ISendMailOptions = {
      to: user.email,
      subject: 'OTP Code from NestJS Shop App',
      template: './otp-2fa',
      context: {
        userName: user.fullname,
        code: otpCode,
      },
    };

    this.mailerService.sendMail(mailOptions);

    return;
  }

  async sendResponseSystemReport(
    user: User,
    report: SystemReport,
  ): Promise<void> {
    const mailOptions: ISendMailOptions = {
      to: user.email,
      subject: 'Respond to your report to NestShop',
      template: './report-response',
      context: {
        userName: user.fullname,
        reportType: 'SystemReport',
        reportContent: report.content,
        resolveStatus: report.resolveStatus,
        reason: report.resolveContent,
      },
    };

    this.mailerService.sendMail(mailOptions);

    return;
  }

  async sendResponseUserReport(
    user: User,
    report: UserReport & { reportee: { fullname: string } },
  ): Promise<void> {
    const mailOptions: ISendMailOptions = {
      to: user.email,
      subject: 'Respond to your report to NestShop',
      template: './report-response',
      context: {
        userName: user.fullname,
        reportType: 'UserReport',
        reporteeName: report.reportee.fullname,
        reportContent: report.content,
        resolveStatus: report.resolveStatus,
        reason: report.resolveContent,
      },
    };

    this.mailerService.sendMail(mailOptions);

    return;
  }

  async sendNotiFlashSale(
    user: User,
    flashSale: FlashSale & {
      product: Product;
    },
  ): Promise<void> {
    const mailOptions: ISendMailOptions = {
      to: user.email,
      subject: 'Flashsale coming soon at NestShop',
      template: './noti-flash-sale',
      context: {
        userName: user.fullname,
        productName: flashSale.product.name,
        flashSaleTime: flashSale.startAt.toLocaleString(),
        listedPrice: flashSale.product.listedPrice,
        flashSalePrice: flashSale.flashSalePrice,
        flashSaleUrl: `${this.baseUrl}/products/${flashSale.product.id}/flash-sales`,
      },
    };

    this.mailerService.sendMail(mailOptions);

    return;
  }

  async sendNotiFlashSaleToUsers(
    userIds: number[],
    flashSaleId: number,
  ): Promise<void> {
    try {
      for (const userId of userIds) {
        await this.mailQueue.add('notification-flashsale', {
          userId,
          flashSaleId,
        });
      }
      return;
    } catch (error) {
      throw error;
    }
  }

  async sendResultImportProducts(
    admin: User,
    resultBuffer: Buffer,
  ): Promise<void> {
    const mailOptions: ISendMailOptions = {
      to: admin.email,
      subject: `Result Import Products ${new Date().toLocaleDateString()}`,
      template: './result-import-products',
      context: {
        userName: admin.fullname,
      },
      attachments: [
        {
          filename: 'result-product-imports.xlsx',
          content: resultBuffer,
        },
      ],
    };

    this.mailerService.sendMail(mailOptions);

    return;
  }

  async sendIncorrectFormatForm(admin: User): Promise<void> {
    const mailOptions: ISendMailOptions = {
      to: admin.email,
      subject: `Result Import Products ${new Date().toLocaleDateString()}`,
      template: './result-incorrect-import-products',
      context: {
        userName: admin.fullname,
        templateUrl: `${this.baseUrl}/products/import/form`,
      },
    };

    this.mailerService.sendMail(mailOptions);

    return;
  }
}
