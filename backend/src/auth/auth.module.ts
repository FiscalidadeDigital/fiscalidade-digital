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

import {
  ObligationsModule,
} from '../obligations/obligations.module';

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

        if (!secret) {
          throw new Error(
            'JWT_SECRET não está configurado. Defina JWT_SECRET no ficheiro .env.',
          );
        }

        return {
          secret,

          signOptions: {
            expiresIn: '7d',
          },
        };
      },
    }),

    // ===================================================
    // OBRIGAÇÕES FISCAIS
    // ===================================================

    ObligationsModule,
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