import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  
  if (request.user && request.shopId && !request.user.shopId) {
    return { ...request.user, shopId: request.shopId };
  }
  
  return request.user;
});
