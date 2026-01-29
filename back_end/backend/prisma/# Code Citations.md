# Code Citations

## License: desconhecido
https://github.com/PachiracleDev/onroad-backend/tree/738e45e066d35d2fbb63d926db3cd17b9f5b91ce/apps/auth/src/guards/roles.guard.ts

```
'@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate
```


## License: desconhecido
https://github.com/sjnprjl/parkinglot-management-system/tree/2230e9638d947c346316053c5158bc6d67be95f5/src/shared/guards/roles.guard.ts

```
;
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext):
```


## License: desconhecido
https://github.com/1111mp/im_server/tree/76c27942bca25b46b4e0ab0b3c7e023da0bef63a/src/common/permission/guards/roles.guard.ts

```
Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const
```


## License: MIT
https://github.com/wesleey/next-nest-auth/tree/89bfd460a98f9c6fb57adaeac02ed8dfbee6a767/back-end/src/infra/framework/common/guards/roles.guard.ts

```
core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride
```


## License: desconhecido
https://github.com/artur10021/restaurant-app-backend/tree/bf77308cf628ee599d7132dfd2cfd796766b1160/src/auth/roles-guard.ts

```
private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return
```

