import type { Request } from 'express';

let _bcrypt: any;
let _jwt: any;

async function bcrypt(): Promise<any> {
  if (!_bcrypt) _bcrypt = (await import('bcryptjs')).default;
  return _bcrypt;
}

async function jwt(): Promise<any> {
  if (!_jwt) _jwt = (await import('jsonwebtoken')).default;
  return _jwt;
}

export function jwtSecret(): string {
  if (!process.env['JWT_SECRET']) throw new Error('JWT_SECRET environment variable is not set');
  return process.env['JWT_SECRET'];
}

export async function signToken(user: { id: number; email: string; userType: string }): Promise<string> {
  const j = await jwt();
  return j.sign(
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
    const j = _jwt;
    if (!j) return null;
    return j.verify(token, jwtSecret()) as any;
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

export async function hashPassword(password: string): Promise<string> {
  const b = await bcrypt();
  return b.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  const b = await bcrypt();
  return b.compare(password, hash);
}
