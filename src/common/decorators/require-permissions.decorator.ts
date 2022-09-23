import { Action } from 'src/common/types';
import { SetMetadata } from '@nestjs/common';
import { AppSubjects } from 'src/casl/casl-ability.factory';

export type Permission = {
  action: Action;
  subject: AppSubjects;
  field?: string;
};

export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata('requirePermissions', permissions);
