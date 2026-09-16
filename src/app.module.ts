import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CompanyModule } from './company/company.module';
import { EmployeeModule } from './employee/employee.module';
import { ClientModule } from './client/client.module';
import { ProductModule } from './product/product.module';
import { SupplierModule } from './supplier/supplier.module';
import { InvoiceModule } from './invoice/invoice.module';
import { FiscalCalendarModule } from './fiscal-calendar/fiscal-calendar.module';
import { FiscalEngineModule } from './fiscal-engine/fiscal-engine.module';
import { TaxCalculatorModule } from './tax-calculator/tax-calculator.module';
import { ObligationsModule } from './obligations/obligations.module';
import { PayrollModule } from './payroll/payroll.module';
import { HistoryModule } from './history/history.module';
import { PaymentsModule } from './payments/payments.module';
import { DocumentModule } from './document/document.module';
import { LegislationModule } from './legislation/legislation.module';
import { NotificationModule } from './notification/notification.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ScheduleModule.forRoot(),

    PrismaModule,

    AuthModule,

    CompanyModule,

    EmployeeModule,

    ClientModule,

    ProductModule,

    SupplierModule,

    InvoiceModule,

    FiscalCalendarModule,

    FiscalEngineModule,

    TaxCalculatorModule,

    ObligationsModule,

    PayrollModule,

    HistoryModule,

    PaymentsModule,

    DocumentModule,

    LegislationModule,

    NotificationModule,

    MailModule,
  ],
})
export class AppModule {}