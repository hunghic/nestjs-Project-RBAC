import { Action } from './../common/types';
import {
  Ability,
  AbilityBuilder,
  AbilityClass,
  ForcedSubject,
  InferSubjects,
} from '@casl/ability';
import { User } from '@prisma/client';
import { Injectable } from '@nestjs/common';

// support CASL infer subject
// UserModel đại diện cho type User để được hỗ trợ trong CASL
type UserModel = User & ForcedSubject<'User'>;

export type AppSubjects = InferSubjects<UserModel> | 'all';
type AppAbility = Ability<[Action, AppSubjects]>;
const AppAbility = Ability as AbilityClass<AppAbility>;

@Injectable()
export class CaslAbilityFactory {
  defineAbilityForUser(user: User) {
    const { can, cannot, build } = new AbilityBuilder(AppAbility);

    const userPropertiesChangeable: string[] = [
      'email',
      'fullname',
      'password',
      'username',
    ];

    if (user.role === 'Admin') {
      can(Action.Manage, 'all');
    } else if (user.role === 'User') {
      can(Action.Read, 'User', { id: user.id });
      can(Action.Update, 'User', userPropertiesChangeable, { id: user.id });
    } else {
    }

    return build();
  }
}
