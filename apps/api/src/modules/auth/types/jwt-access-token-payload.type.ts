import { UserRole } from '../../../generated/prisma/client.js';

export type JwtAccessTokenPayload = {
  sub: string;
  mobile: string;
  role: UserRole;
  iat?: number;
  exp?: number;
};
