import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { PrismaModule } from './prisma/prisma.module';

import { AuthModule } from './auth/auth.module';
import { ObligationsModule } from './obligations/obligations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TaxCalculatorModule } from './tax-calculator/tax-calculator.module';

import { DashboardModule } from './dashboard/dashboard.module';
import { RevenueModule } from './revenue/revenue.module';

import { CompanyModule } from './company/company.module';
import { ClientModule } from './client/client.module';

import { InvoiceModule } from './invoice/invoice.module';
import { TenantModule } from './tenant/tenant.module';
import { ProductModule } from './product/product.module';
import { NotificationModule } from './notification/notification.module';

import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ScheduleModule.forRoot(),

    PrismaModule,

    AuthModule,
    ObligationsModule,
    NotificationsModule,
    TaxCalculatorModule,
    DashboardModule,
    RevenueModule,
    CompanyModule,
    ClientModule,
    InvoiceModule,
    TenantModule,
    ProductModule,
    NotificationModule,

    AiModule,
  ],
})
export class AppModule {}