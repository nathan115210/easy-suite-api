import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

export function validateUuidParam(param: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = z.string().uuid().safeParse(req.params[param]);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'INVALID_ID',
          message: `Invalid 
  ${param}`,
        },
      });
      return;
    }
    next();
  };
}
