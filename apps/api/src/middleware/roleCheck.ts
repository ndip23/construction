import { Response, NextFunction } from 'express';

export const authorize = (roles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    // superadmin is the platform owner — it sits above every other role and
    // implicitly passes any authorize() gate (admin, owner, staff, …).
    if (req.user.role === 'superadmin') return next();

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Role ${req.user.role} is not authorized to access this route` 
      });
    }
    next();
  };
};