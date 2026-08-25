let _rateLimit: any;

async function getRateLimit(): Promise<any> {
  if (!_rateLimit) {
    const mod = await import('express-rate-limit');
    _rateLimit = mod.default ?? mod;
  }
  return _rateLimit;
}

export async function createAuthLimiter() {
  const rl = await getRateLimit();
  return rl({
    windowMs: 60 * 1000,
    max: 5,
    message: { success: false, error: 'Too many attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

export async function createApiLimiter() {
  const rl = await getRateLimit();
  return rl({
    windowMs: 60 * 1000,
    max: 60,
    message: { success: false, error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  });
}
