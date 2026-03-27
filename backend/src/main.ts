import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { SanitizeResponseInterceptor } from './common/interceptors/sanitize-response.interceptor';
import { TenantInterceptor } from './common/tenant/tenant.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Aumentar limite de payload para aceitar imagens em base64
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // Segurança
  app.use(helmet());

  // CORS
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
  const allowedOrigins = [
    frontendUrl,
    'http://localhost:3002',
    'https://www.klypbarber.com.br',
    'https://klypbarber.com.br'
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.klypbarber.com.br')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Authorization'],
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

  // Interceptores globais (Response Sanitize & Tenant Isolation Context)
  app.useGlobalInterceptors(
    new SanitizeResponseInterceptor(),
    new TenantInterceptor()
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('KlypBarber API')
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

  // Rota raiz da API - redireciona para documentação
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/api', (req, res) => {
    res.redirect('/api/docs');
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  // console.log(`🚀 KlypBarber API running on http://localhost:${port}/api`);
  // console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
