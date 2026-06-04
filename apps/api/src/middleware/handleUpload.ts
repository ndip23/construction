import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

export const handleUpload = (uploadMiddleware: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    uploadMiddleware(req, res, (err: any) => {
      if (!err) return next();

      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message });
      }

      const message = err instanceof Error ? err.message : 'File upload failed';
      return res.status(400).json({ message });
    });
  };
};
