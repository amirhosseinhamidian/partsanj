import { UserRole } from '../../../generated/prisma/client.js';

export type AuthenticatedUser = {
  id: string;
  mobile: string;
  role: UserRole;
  firstName: string | null;
  lastName: string | null;
};
