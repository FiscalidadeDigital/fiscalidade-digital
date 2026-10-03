import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ElectronicInvoicingService } from './electronic-invoicing.service';
import { RequestElectronicSeriesDto } from './dto/request-series.dto';

@Controller('electronic-invoicing')
@UseGuards(JwtAuthGuard)
export class ElectronicInvoicingController {
  constructor(private readonly service: ElectronicInvoicingService) {}

  @Get('readiness') readiness() { return this.service.readiness(); }
  @Get() list(@CurrentUser() user: any) { return this.service.list(user.tenantId); }
  @Get('series') series(@CurrentUser() user: any) { return this.service.listSeries(user.tenantId); }
  @Get('invoice/:invoiceId/preflight') preflight(@CurrentUser() user: any, @Param('invoiceId') invoiceId: string) { return this.service.preflight(user.tenantId, invoiceId); }

  @Post('invoice/:invoiceId/submit')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  submit(@CurrentUser() user: any, @Param('invoiceId') invoiceId: string) { return this.service.submit(user.tenantId, invoiceId); }

  @Post('invoice/:invoiceId/status')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  status(@CurrentUser() user: any, @Param('invoiceId') invoiceId: string) { return this.service.queryStatus(user.tenantId, invoiceId); }

  @Post('invoice/:invoiceId/query')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT)
  queryInvoice(@CurrentUser() user: any, @Param('invoiceId') invoiceId: string) { return this.service.queryInvoice(user.tenantId, invoiceId); }

  @Post('series')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  requestSeries(@CurrentUser() user: any, @Body() body: RequestElectronicSeriesDto) { return this.service.requestSeries(user.tenantId, body); }
}
