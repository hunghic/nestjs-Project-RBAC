import { setupS3Configs } from './common/config/aws-s3/index';
import { setupApiDocument } from './common/config/swagger';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CustomIoAdapter } from './websocket/adapters';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Use validator in dto file
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );
  // Setup swagger to create OpenAPI documentations
  setupApiDocument(app);
  // Setup Aws S3 configs
  // setupS3Configs();
  app.enableCors();
  app.useWebSocketAdapter(new CustomIoAdapter(app));
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
