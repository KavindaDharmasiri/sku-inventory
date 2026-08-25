import { Router, type Request, type Response } from 'express';
import { query } from '../db';
import { bcrypt, signToken } from '../middleware/auth';
import { authLimiter } from '../middleware/rate-limit';

export const authRouter = Router();

authRouter.post('/api/auth/signup', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }
    if (typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
      return;
    }
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.length) {
      res.status(409).json({ success: false, error: 'An account with this email already exists' });
      return;
    }
    const hash = await bcrypt.hash(password, 10);
    const rows = await query<any>(
      `INSERT INTO users (email, password, user_type, first_name, last_name, phone)
       VALUES ($1, $2, 'customer', $3, $4, $5)
       RETURNING id, email, user_type AS "userType", first_name AS "firstName", last_name AS "lastName"`,
      [String(email).toLowerCase(), hash, firstName || null, lastName || null, phone || null]
    );
    const user = rows[0];
    res.status(201).json({ success: true, token: signToken(user), user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Sign up failed' });
  }
});

authRouter.post('/api/auth/signin', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }
    const rows = await query<any>(
      `SELECT id, email, password, user_type AS "userType", is_active AS "isActive",
              first_name AS "firstName", last_name AS "lastName"
       FROM users WHERE email = $1`,
      [String(email).toLowerCase()]
    );
    const dbUser = rows[0];
    if (!dbUser || !(await bcrypt.compare(password, dbUser.password))) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }
    if (!dbUser.isActive) {
      res.status(403).json({ success: false, error: 'Account is inactive' });
      return;
    }
    const user = {
      id: dbUser.id,
      email: dbUser.email,
      userType: dbUser.userType,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
    };
    res.json({ success: true, token: signToken(user), user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Sign in failed' });
  }
});
