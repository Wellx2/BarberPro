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
    });

    // Resposta padrão
    let message = exception.message || 'Erro interno do servidor';

    // Se for erro de validação (NestJS ValidationPipe), a mensagem pode estar em response.message
    if (exception.response && typeof exception.response === 'object') {
      const responseBody = exception.response as any;
      if (responseBody.message) {
        message = Array.isArray(responseBody.message)
          ? responseBody.message[0]
          : responseBody.message;
      }
    }

    // Tratamento de erros específicos do Prisma
    if (exception.code === 'P2002') {
      const target = exception.meta?.target || 'campo';
      message = `Já existe um registro com este ${target}`;
      response.status(409).json({
        statusCode: 409,
        message,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
      return;
    }

    // Resposta genérica APENAS para 500 em produção
    if (process.env.NODE_ENV === 'production' && status >= 500) {
      message = 'Erro interno do servidor';
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
