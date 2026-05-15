import rateLimit from 'express-rate-limit';

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
