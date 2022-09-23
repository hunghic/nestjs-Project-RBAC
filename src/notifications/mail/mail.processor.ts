import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from './mail.service';
import { MAIL_QUEUE } from './../../common/constants';
import {
  Processor,
  Process,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';
import { Job } from 'bull';

@Processor(MAIL_QUEUE)
export class MailProcessor {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  @OnQueueActive()
  onActive(job: Job) {
    console.log(
      `Processing job ${job.id} of type ${job.name}. Data: ${JSON.stringify(
        job.data,
      )}`,
    );
  }

  @OnQueueCompleted()
  onComplete(job: Job, result: any) {
    console.log(
      `Completed job ${job.id} of type ${job.name}. Result: ${JSON.stringify(
        result,
      )}`,
    );
  }

  @OnQueueFailed()
  onError(job: Job<any>, error: any) {
    console.error(
      `Failed job ${job.id} of type ${job.name}: ${error.message}`,
      error.stack,
    );
  }

  @Process('notification-flashsale')
  async sendNotificationEmail(
    job: Job<{ userId: number; flashSaleId: number }>,
  ) {
    try {
      console.log(
        `Sending notification flashsale #${job.data.flashSaleId} email to user #${job.data.userId}`,
      );
      const user = await this.prisma.user.findUniqueOrThrow({
        where: { id: job.data.userId },
      });
      if (!user.email) {
        return {
          message: `User #${user.id} has not email`,
        };
      }
      const flashSale = await this.prisma.flashSale.findUniqueOrThrow({
        where: { id: job.data.flashSaleId },
        include: { product: true },
      });
      await this.mailService.sendNotiFlashSale(user, flashSale);
      // await new Promise((resolve) => setTimeout(resolve, 5000));

      return {
        message: `Send notification flashsale to user #${user.id}, email ${user.email} successfully`,
      };
    } catch (error) {
      console.error(error.message);
    }
  }
}
