import { Request, Response, NextFunction } from 'express';
import { User } from '@prisma/client';
declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}
export declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const adminOnly: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=auth.d.ts.map