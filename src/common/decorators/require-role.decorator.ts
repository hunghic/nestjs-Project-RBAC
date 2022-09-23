import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const RequireRole = (role: Role) => SetMetadata('requireRole', role);
