import type { PlatformAdminRole } from '@prisma/client';

export type PlatformAdminPrincipal = {
  id: string;
  email: string;
  name: string;
  role: PlatformAdminRole;
  mustChangePassword: boolean;
};

export type PlatformAdminTokenPayload = {
  sub: string;
  kind: 'platform-admin';
  tokenVersion: number;
};
