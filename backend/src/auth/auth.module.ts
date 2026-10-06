import {
  Module,
} from '@nestjs/common';

import {
  PassportModule,
} from '@nestjs/passport';

import {
  JwtModule,
} from '@nestjs/jwt';

import {
  ConfigModule,
  ConfigService,
} from '@nestjs/config';

import {
  AuthController,
} from './auth.controller';

import {
  AuthService,
} from './auth.service';

import {
  PrismaModule,
} from '../prisma/prisma.module';

import { MailModule } from '../mail/mail.module';
import { FiscalEnrollmentModule } from '../fiscal-enrollment/fiscal-enrollment.module';

import {
  JwtStrategy,
} from './strategies/jwt.strategy';

@Module({
  imports: [
    // ===================================================
    // CONFIGURAÇÃO
    // ===================================================

    ConfigModule,

    // ===================================================
    // DATABASE
    // ===================================================

    PrismaModule,

    // ===================================================
    // PASSPORT
    // ===================================================

    PassportModule.register({
      defaultStrategy: 'jwt',
    }),

    // ===================================================
    // JWT
    // ===================================================

    JwtModule.registerAsync({
      imports: [
        ConfigModule,
      ],

      inject: [
        ConfigService,
      ],

      useFactory: (
        configService: ConfigService,
      ) => {
        const secret =
          configService.get<string>(
            'JWT_SECRET',
          );

        if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
          throw new Error(
            'JWT_SECRET não está configurado correctamente (mínimo de 32 bytes).',
          );
        }

        return {
          secret,

          signOptions: {
            expiresIn: '1h',
          },
        };
      },
    }),

    // ===================================================
    // OBRIGAÇÕES FISCAIS
    // ===================================================

    MailModule,
    FiscalEnrollmentModule,
  ],

  // =====================================================
  // CONTROLLERS
  // =====================================================

  controllers: [
    AuthController,
  ],

  // =====================================================
  // PROVIDERS
  // =====================================================

  providers: [
    AuthService,
    JwtStrategy,
  ],

  // =====================================================
  // EXPORTS
  // =====================================================

  exports: [
    AuthService,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}
