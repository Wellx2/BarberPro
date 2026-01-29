import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { SanitizeResponseInterceptor } from './common/interceptors/sanitize-response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Segurança
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Prefixo global
  app.setGlobalPrefix('api');

  // Validação global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Exception filter global
  app.useGlobalFilters(new AllExceptionsFilter());

  // Interceptor para remover campos sensíveis
  app.useGlobalInterceptors(new SanitizeResponseInterceptor());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('BarberPro API')
    .setDescription('Backend SaaS multi-tenant para gestão de barbearias')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticação e autorização')
    .addTag('barbershops', 'Gestão de barbearias')
    .addTag('barbers', 'Gestão de barbeiros')
    .addTag('services', 'Gestão de serviços')
    .addTag('products', 'Gestão de produtos')
    .addTag('clients', 'Gestão de clientes')
    .addTag('appointments', 'Gestão de agendamentos')
    .addTag('blocked-times', 'Bloqueio de horários')
    .addTag('plans', 'Planos de assinatura')
    .addTag('invoices', 'Faturas')
    .addTag('reviews', 'Avaliações')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 BarberPro API running on http://localhost:${port}/api`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
