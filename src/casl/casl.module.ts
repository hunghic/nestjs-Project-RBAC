import { CaslAbilityFactory } from './casl-ability.factory';
import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  providers: [CaslAbilityFactory],
  exports: [CaslAbilityFactory],
})
export class CaslModule {}
