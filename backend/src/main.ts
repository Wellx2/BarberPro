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
    'https://klypbarber.com.br',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Em desenvolvimento, permitir localhost. Em produção, ser estrito.
      const isDevelopment = process.env.NODE_ENV !== 'production';
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        (isDevelopment && (origin.includes('localhost') || origin.includes('127.0.0.1'))) ||
        origin.endsWith('.vercel.app')
      ) {
        callback(null, true);
      } else {
        // Log de tentativa de acesso suspeito
        console.warn(`[SECURITY] Tentativa de acesso de origem não autorizada: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-tenant-id'],
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

  // Interceptores globais
  app.useGlobalInterceptors(
    new SanitizeResponseInterceptor(),
    new TenantInterceptor(),
  );

  // Swagger (Desabilitado em produção por segurança)
  const expressApp = app.getHttpAdapter().getInstance();
  
  if (process.env.NODE_ENV !== 'production') {
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

    // Rota raiz da API - redireciona para documentação em dev
    expressApp.get('/api', (req, res) => {
      res.redirect('/api/docs');
    });
  } else {
    // Em produção, a rota /api exibe apenas status
    expressApp.get('/api', (req, res) => {
      res.status(200).send({ status: 'ok', environment: 'production', message: 'KlypBarber API is running securely' });
    });
  }

  await app.init();
  return app;
}

// Instância reutilizada entre invocações serverless (evita cold start repetido)
let cachedApp: any;

// Handler exportado para o Vercel (serverless)
export default async function handler(req: any, res: any) {
  if (!cachedApp) {
    cachedApp = await bootstrap();
  }
  const expressInstance = cachedApp.getHttpAdapter().getInstance();
  return expressInstance(req, res);
}

// Permite rodar localmente com `npm run start:dev`
if (process.env.NODE_ENV !== 'production') {
  bootstrap().then((app) => {
    const port = process.env.PORT || 3000;
    app
      .getHttpAdapter()
      .getInstance()
      .listen(port, () => {
        console.log(
          `🚀 KlypBarber API rodando em http://localhost:${port}/api`,
        );
        console.log(`📚 Swagger: http://localhost:${port}/api/docs`);
      });
  });
}
