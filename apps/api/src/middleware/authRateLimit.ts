import { rateLimit, ipKeyGenerator } from 'express-rate-limit';

/**
 * Throttles authentication endpoints (login, register, password reset, worker
 * PIN login) to stop credential brute-force. The 4-digit worker PIN has only
 * 10,000 combinations, so an unthrottled login is trivially guessable.
 *
 * Keyed by IP + the submitted identifier (email/phone) so one attacker can't
 * lock out a whole NAT, but also can't hammer a single account.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // 10 attempts per identifier per window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => {
    const id = req.body?.email || req.body?.phone || '';
    return `${ipKeyGenerator(req.ip)}:${String(id).toLowerCase()}`;
  },
  message: {
    message: 'Too many attempts. Please wait 15 minutes and try again.',
  },
});

/**
 * Throttles UNAUTHENTICATED public writes (directory inquiries, marketplace
 * activity tracking, public tender posts) to curb spam/abuse without needing a
 * paid captcha service. Keyed by IP.
 */
export const publicWriteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 30, // 30 public submissions per IP per hour
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => ipKeyGenerator(req.ip),
  message: {
    message: 'Too many submissions from this network. Please try again later.',
  },
});
