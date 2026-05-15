import rateLimit from 'express-rate-limit';

// Current limiter key is IP-based. If needed, extend failed-attempt tracking by email/username.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // strict limit for write endpoints (signup/signin)
  message: 'Too many requests from this IP, please try again later.',
});

export const authReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 120, // higher limit for read endpoints like profile fetches
  message: 'Too many requests from this IP, please try again later.',
});
