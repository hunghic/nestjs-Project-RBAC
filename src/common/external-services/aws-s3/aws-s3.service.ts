import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';

@Injectable()
export class AwsS3Service {
  private s3: S3;

  constructor(private config: ConfigService) {
    this.s3 = new S3({
      accessKeyId: config.get('AWS_ACCESS_KEY'),
      secretAccessKey: config.get('AWS_SECRET_KEY'),
      endpoint: config.get('AWS_MINIO_DOMAIN'),
      s3ForcePathStyle: true, // needed with minio?
      signatureVersion: 'v4',
    });
  }

  async uploadFile(
    fileName: string,
    fileBuffer: Buffer,
    minetype: string,
    folder?: string,
  ) {
    const uploadResult = await this.s3
      .upload({
        Bucket: this.config.get('AWS_BUCKET_NAME'),
        Key: folder
          ? `${folder}/${Date.now()}-${fileName}`
          : `${Date.now()}-${fileName}`,
        Body: fileBuffer,
        ContentType: minetype,
      })
      .promise();

    return uploadResult;
  }

  async deleteFile(fileKey: string): Promise<void> {
    await this.s3
      .deleteObject({
        Bucket: this.config.get('AWS_BUCKET_NAME'),
        Key: fileKey,
      })
      .promise();
  }

  async deleteMultipleFiles(fileKeys: string[]): Promise<void> {
    const objects = fileKeys.map((key) => ({
      Key: key,
    }));

    await this.s3
      .deleteObjects({
        Bucket: this.config.get('AWS_BUCKET_NAME'),
        Delete: {
          Objects: objects,
        },
      })
      .promise();
  }
}
