import { MailService } from './../notifications/mail/mail.service';
import {
  extractData,
  extractHeader,
  genResultImportProductsFromExcel,
} from './../common/helper/excel';
import { PrismaService } from './../prisma/prisma.service';
import { FILE_QUEUE } from './../common/constants';
import {
  Processor,
  Process,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';
import { Job } from 'bull';
import * as XLSX from 'xlsx';
import { Prisma, Role } from '@prisma/client';

type DataImport = {
  importOrder: number;
  code: string;
  name: string;
  status: string;
  importQuantity: number;
  importPrice: number;
};

@Processor(FILE_QUEUE)
export class FileProcessor {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  @OnQueueActive()
  onActive(job: Job) {
    console.log(`Processing job ${job.id} of type ${job.name}.`);
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

  @Process('form-imports')
  async importProductsFromForm(job: Job<{ worksheet: XLSX.WorkSheet }>) {
    try {
      console.log(`Start import products via excel form`);
      const worksheet = job.data.worksheet;
      const headers = extractHeader(worksheet, 5);
      const headersSample = [
        '#',
        'Mã sản phẩm (cần chính xác)',
        'Tên sản phẩm (tùy chọn)',
        'Trạng thái (tùy chọn)',
        'Số lượng nhập',
        'Giá nhập (vnđ)',
      ];
      const admin = await this.prisma.user.findFirst({
        where: { role: Role.Admin },
      });
      if (
        !(
          headers.length === headersSample.length &&
          headers.every((value, index) => value === headersSample[index])
        )
      ) {
        // Gửi mail nhập sai format
        this.mailService.sendIncorrectFormatForm(admin);
        return {
          message: `End import products via excel form, jobId: ${job.id}`,
        };
      }
      const data: DataImport[] = extractData(worksheet, 5).map((row) => ({
        importOrder: row[headers[0]],
        code: row[headers[1]],
        name: row[headers[2]],
        status: row[headers[3]],
        importQuantity: row[headers[4]],
        importPrice: row[headers[5]],
      }));

      const resultImports: {
        importOrder: number;
        code: string;
        name: string;
        importQuantity: number;
        importPrice: number;
        success: boolean;
        importErrorMessage?: string;
      }[] = [];

      for (const dataImport of data) {
        const result = await this.resultFormImport(dataImport);
        delete dataImport.status;
        resultImports.push({
          ...dataImport,
          ...result,
        });
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }

      const importedAt = new Date(job.timestamp);
      const completedAt = new Date();

      const resultBuffer = genResultImportProductsFromExcel(
        importedAt,
        completedAt,
        resultImports,
      );

      // Gửi mail nhập đúng format
      this.mailService.sendResultImportProducts(admin, resultBuffer);

      return {
        message: `End import products via excel form, jobId: ${job.id}`,
      };
    } catch (error) {
      console.error(error.message);
    }
  }

  async resultFormImport(
    dataImport: DataImport,
  ): Promise<{ success: boolean; importErrorMessage?: string }> {
    try {
      if (
        !dataImport.code ||
        !dataImport.importQuantity ||
        !dataImport.importPrice
      ) {
        return {
          success: false,
          importErrorMessage:
            'Mã sản phẩm, số lượng nhập, giá nhập không được để trống',
        };
      }
      const product = await this.prisma.product.findUniqueOrThrow({
        where: { code: dataImport.code },
      });
      await this.prisma.product.update({
        where: {
          id: product.id,
        },
        data: {
          productImports: {
            create: {
              importQuantity: dataImport.importQuantity,
              importPrice: dataImport.importPrice,
              description: 'Import by form',
            },
          },
          quantityInStock: {
            increment: dataImport.importQuantity,
          },
        },
      });
      return {
        success: true,
      };
    } catch (error) {
      if (error instanceof Prisma.NotFoundError) {
        return {
          success: false,
          importErrorMessage:
            'Không tìm thấy sản phẩm tương ứng với mã sản phẩm',
        };
      }
      return {
        success: false,
        importErrorMessage: error.message,
      };
    }
  }
}
