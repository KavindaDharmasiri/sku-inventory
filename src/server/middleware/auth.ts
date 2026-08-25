import { createRequire } from 'node:module';
import { type Request } from 'express';

const require_ = createRequire(import.meta.url);
export const bcrypt = require_('bcryptjs');
export const jwt = require_('jsonwebtoken');

export function jwtSecret(): string {
  if (!process.env['JWT_SECRET']) throw new Error('JWT_SECRET environment variable is not set');
  return process.env['JWT_SECRET'];
}

export function signToken(user: { id: number; email: string; userType: string }): string {
  return jwt.sign(
    { userId: user.id, email: user.email, userType: user.userType },
    jwtSecret(),
    { expiresIn: '7d' }
  );
}

export function authUser(req: Request): { userId: number; email: string; userType: string } | null {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, jwtSecret()) as any;
  } catch {
    return null;
  }
}

export function requireUser(req: Request, res: any): { userId: number; email: string; userType: string } | null {
  const user = authUser(req);
  if (!user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return null;
  }
  return user;
}

export function requireAdmin(req: Request, res: any): { userId: number; email: string; userType: string } | null {
  const user = authUser(req);
  if (!user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return null;
  }
  if (user.userType !== 'admin') {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return null;
  }
  return user;
}
