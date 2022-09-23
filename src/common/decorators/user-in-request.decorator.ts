import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UserInRequest = createParamDecorator(
  (data: string | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    if (!data || !request.user[data]) return request.user;
    return request.user[data];
  },
);
