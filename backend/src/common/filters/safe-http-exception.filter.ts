import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';

type PublicErrorBody = {
  statusCode: number;
  message: string;
  referenceCode: string;
  nextStep?: PublicNextStep;
};

type PublicNextStep = 'CONFIRM_IVA' | 'COMPLETE_INVOICE_CLASSIFICATION';

const publicNextSteps: Readonly<Record<string, PublicNextStep>> = {
  IVA_ENROLLMENT_REQUIRED: 'CONFIRM_IVA',
  IVA_ENROLLMENT_UNCONFIRMED: 'CONFIRM_IVA',
  IVA_FISCAL_CLASSIFICATION_REQUIRED: 'COMPLETE_INVOICE_CLASSIFICATION',
};

/**
 * Keeps operational details on the server while giving every failed request a
 * stable reference the customer can share with support.  In particular, never
 * serialise exception messages because third-party and persistence errors can
 * contain implementation details.
 */
@Catch()
export class SafeHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SafeHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    if (response.headersSent) {
      return;
    }

    const status = this.statusFor(exception);
    const referenceCode = `FD-${randomUUID().slice(0, 8).toUpperCase()}`;
    const nextStep = this.nextStepFor(exception);
    this.logFailure(exception, status, referenceCode, request);

    const body: PublicErrorBody = {
      statusCode: status,
      message: this.messageFor(status),
      referenceCode,
      ...(nextStep ? { nextStep } : {}),
    };

    response.status(status).json(body);
  }

  private statusFor(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private messageFor(status: number): string {
    const messages: Readonly<Record<number, string>> = {
      [HttpStatus.BAD_REQUEST]:
        'Não foi possível validar os dados enviados. Reveja a informação e tente novamente.',
      [HttpStatus.UNAUTHORIZED]:
        'A sua sessão terminou. Inicie sessão novamente.',
      [HttpStatus.FORBIDDEN]: 'Não tem permissão para concluir esta ação.',
      [HttpStatus.NOT_FOUND]: 'O item solicitado não está disponível.',
      [HttpStatus.CONFLICT]:
        'Esta ação já não pode ser concluída devido a uma alteração recente.',
      [HttpStatus.TOO_MANY_REQUESTS]:
        'Foram efetuadas várias tentativas. Aguarde alguns instantes e tente novamente.',
      [HttpStatus.SERVICE_UNAVAILABLE]:
        'Este serviço está temporariamente indisponível. Tente novamente mais tarde.',
    };

    return (
      messages[status] ??
      'Não foi possível concluir o pedido neste momento. Tente novamente. Se persistir, indique o código de referência ao apoio.'
    );
  }

  private nextStepFor(exception: unknown): PublicNextStep | undefined {
    if (!(exception instanceof HttpException)) {
      return undefined;
    }

    const response = exception.getResponse();
    if (!response || typeof response !== 'object' || Array.isArray(response)) {
      return undefined;
    }

    const code = (response as Record<string, unknown>).code;
    return typeof code === 'string' ? publicNextSteps[code] : undefined;
  }

  private logFailure(
    exception: unknown,
    status: number,
    referenceCode: string,
    request: Pick<Request, 'method' | 'originalUrl'>,
  ): void {
    const kind =
      exception instanceof Error ? exception.name : 'UnknownException';
    const endpoint = request.originalUrl?.split('?')[0] ?? 'unknown-route';
    // Do not log arbitrary exception messages or bodies: either may contain a
    // secret supplied by an upstream integration. The reference code links the
    // customer-facing failure to this minimal server-side audit line.
    this.logger.error(
      `${request.method} ${endpoint} responded ${status} [${referenceCode}] ${kind}`,
    );
  }
}
