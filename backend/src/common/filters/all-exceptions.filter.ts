import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception.getStatus?.() || 500;

    // Log error (SEM PII)
    this.logger.error({
      path: request.url,
      method: request.method,
      statusCode: status,
      message: exception.message,
      // NÃO logar: user, body com dados sensíveis
    });

    // Resposta genérica em produção
    const message =
      process.env.NODE_ENV === 'production' ? 'Erro interno do servidor' : exception.message;

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
