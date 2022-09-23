import { FileProcessor } from './file.processor';
import { AwsS3Module } from '../common/external-services/aws-s3/aws-s3.module';
import { Module } from '@nestjs/common';
import { FilesService } from './files.service';

@Module({
  imports: [AwsS3Module],
  providers: [FilesService, FileProcessor],
  exports: [FilesService],
})
export class FilesModule {}
