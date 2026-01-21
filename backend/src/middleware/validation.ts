import { Request, Response, NextFunction } from 'express';
import DOMPurify from 'isomorphic-dompurify'; // npm i isomorphic-dompurify

export const sanitizeBody = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = DOMPurify.sanitize(req.body[key]);
      }
    });
  }
  next();
};

app.use(sanitizeBody);