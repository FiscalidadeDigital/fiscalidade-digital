import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from './prisma/prisma.module';

import { AuthModule } from './auth/auth.module';
import { CompanyModule } from './company/company.module';

import { EmployeeModule } from './employee/employee.module';
import { ClientModule } from './client/client.module';
import { ProductModule } from './product/product.module';
import { SupplierModule } from './supplier/supplier.module';

import { InvoiceModule } from './invoice/invoice.module';
import { PurchaseInvoiceModule } from './purchase-invoice/purchase-invoice.module';
import { PurchaseInvoiceImportModule } from './purchase-invoice-import/purchase-invoice-import.module';

import { FiscalCalendarModule } from './fiscal-calendar/fiscal-calendar.module';
import { FiscalEngineModule } from './fiscal-engine/fiscal-engine.module';
import { FiscalEnrollmentModule } from './fiscal-enrollment/fiscal-enrollment.module';
import { FiscalApplicabilityModule } from './fiscal-applicability/fiscal-applicability.module';
import { FiscalObligationPersistenceModule } from './fiscal-obligation-persistence/fiscal-obligation-persistence.module';
import { ObligationGenerationModule } from './obligation-generation/obligation-generation.module';
import { FiscalSituationModule } from './fiscal-situation/fiscal-situation.module';
import { TaxCalculatorModule } from './tax-calculator/tax-calculator.module';
import { ObligationsModule } from './obligations/obligations.module';

import { PayrollModule } from './payroll/payroll.module';

import { HistoryModule } from './history/history.module';
import { PaymentsModule } from './payments/payments.module';
import { DocumentModule } from './document/document.module';

import { LegislationModule } from './legislation/legislation.module';
import { NotificationModule } from './notification/notification.module';
import { MailModule } from './mail/mail.module';

import { DashboardModule } from './dashboard/dashboard.module';
import { AdminModule } from './admin/admin.module';
import { AccountingSaftModule } from './accounting-saft/accounting-saft.module';
import { SubscriptionAccessModule } from './subscription-access/subscription-access.module';
import { UsersModule } from './users/users.module';
import { ElectronicInvoicingModule } from './electronic-invoicing/electronic-invoicing.module';
import { FiscalWatchModule } from './fiscal-watch/fiscal-watch.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    // ==========================================================
    // CONFIGURAÇÃO
    // ==========================================================

    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ScheduleModule.forRoot(),

    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 120 },
    ]),

    // ==========================================================
    // BASE
    // ==========================================================

    PrismaModule,

    // ==========================================================
    // AUTENTICAÇÃO / EMPRESA
    // ==========================================================

    AuthModule,
    CompanyModule,
    UsersModule,

    // ==========================================================
    // DADOS OPERACIONAIS
    // ==========================================================

    EmployeeModule,
    ClientModule,
    ProductModule,
    SupplierModule,

    // ==========================================================
    // FACTURAÇÃO
    // ==========================================================

    InvoiceModule,
    ElectronicInvoicingModule,
    FiscalWatchModule,
    AiModule,
    PurchaseInvoiceModule,
    PurchaseInvoiceImportModule,

    // ==========================================================
    // MOTOR FISCAL
    // ==========================================================

    FiscalCalendarModule,
    FiscalEngineModule,
    FiscalEnrollmentModule,
    FiscalApplicabilityModule,
    FiscalObligationPersistenceModule,
    ObligationGenerationModule,
    FiscalSituationModule,
    TaxCalculatorModule,
    ObligationsModule,

    // ==========================================================
    // SALÁRIOS
    // ==========================================================

    PayrollModule,

    // ==========================================================
    // OUTROS MÓDULOS
    // ==========================================================

    HistoryModule,
    PaymentsModule,
    DocumentModule,

    LegislationModule,
    NotificationModule,
    MailModule,

    DashboardModule,
    AdminModule,
    AccountingSaftModule,
    SubscriptionAccessModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
