import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    disableErrorMessages: false,
  }));

  // Catch validation errors globally
  app.useGlobalFilters({
    catch(exception, host) {
      const ctx = host.switchToHttp();
      const req = ctx.getRequest();
      const res = ctx.getResponse();

      if (exception?.getStatus?.() === 400) {
        const response = exception.getResponse?.();
        Logger.warn(`[VALIDATION] ${req.method} ${req.url} → ${JSON.stringify(response)}`);
      }

      throw exception; // Let Nest handle the response
    },
  });

  app.enableCors({
    origin: '*'
  });

  const config = new DocumentBuilder()
    .setTitle('Journal API')
    .setDescription('API for journal application')
    .setVersion('1.0')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3001);
}
bootstrap();