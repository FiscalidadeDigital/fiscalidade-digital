import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FiscalRegime, TaxType, UserRole } from '@prisma/client';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { FiscalEnrollmentLifecycleService } from './fiscal-enrollment-lifecycle.service';

type AuthenticatedRequest = Request & { user: { tenantId: string } };

@Controller('fiscal-enrollments')
@UseGuards(JwtAuthGuard)
export class FiscalEnrollmentController {
  constructor(private readonly lifecycle: FiscalEnrollmentLifecycleService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.VIEWER)
  list(@Req() req: AuthenticatedRequest) {
    return this.lifecycle.list(req.user.tenantId);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  create(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      taxType: TaxType;
      regime: FiscalRegime;
      validFrom: string;
      validUntil?: string;
      legalReference?: string;
      officialSourceUrl?: string;
      sourceDiploma?: string;
      sourceArticle?: string;
    },
  ) {
    return this.lifecycle.create(req.user.tenantId, body);
  }

  @Post('change')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  change(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: { taxType: TaxType; regime: FiscalRegime; validFrom: string },
  ) {
    return this.lifecycle.change(req.user.tenantId, body);
  }

  @Patch(':id/end')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  end(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { validUntil: string },
  ) {
    return this.lifecycle.close(req.user.tenantId, id, body.validUntil);
  }
}
