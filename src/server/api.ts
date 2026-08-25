import { Router, type Request, type Response } from 'express';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { query, mapProduct, PRODUCT_SELECT, type ProductRow } from './db';

const require_ = createRequire(import.meta.url);
const bcrypt = require_('bcryptjs');
const jwt = require_('jsonwebtoken');

export const apiRouter = Router();

function jwtSecret(): string {
  if (!process.env['JWT_SECRET']) throw new Error('JWT_SECRET environment variable is not set');
  return process.env['JWT_SECRET'];
}

function signToken(user: { id: number; email: string; userType: string }): string {
  return jwt.sign(
    { userId: user.id, email: user.email, userType: user.userType },
    jwtSecret(),
    { expiresIn: '7d' }
  );
}

function authUser(req: Request): { userId: number; email: string; userType: string } | null {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, jwtSecret()) as any;
  } catch {
    return null;
  }
}

/* ---------------------------- Auth ---------------------------- */

apiRouter.post('/api/auth/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
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

apiRouter.post('/api/auth/signin', async (req: Request, res: Response) => {
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

/* -------------------------- Catalog --------------------------- */

apiRouter.get('/api/products', async (_req: Request, res: Response) => {
  try {
    const rows = await query<ProductRow>(
      `${PRODUCT_SELECT}
       WHERE p.is_deleted = false AND p.status = 'ACTIVE'
       ORDER BY p.created_at DESC
       LIMIT 200`
    );
    res.json({ success: true, data: rows.map(mapProduct) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to load products' });
  }
});

apiRouter.get('/api/products/featured', async (_req: Request, res: Response) => {
  try {
    const rows = await query<ProductRow>(
      `${PRODUCT_SELECT}
       WHERE p.is_deleted = false AND p.status = 'ACTIVE' AND p.featured_on_homepage = true
       ORDER BY p.created_at DESC
       LIMIT 8`
    );
    res.json({ success: true, data: rows.map(mapProduct) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to load featured products' });
  }
});

apiRouter.get('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params['id']);
    if (!Number.isInteger(id)) {
      res.status(400).json({ success: false, error: 'Invalid product id' });
      return;
    }
    const rows = await query<ProductRow>(
      `${PRODUCT_SELECT} WHERE p.product_id = $1 AND p.is_deleted = false AND p.status = 'ACTIVE'`,
      [id]
    );
    if (!rows.length) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    const [images, specs, skus, reviews] = await Promise.all([
      query<{ image_url: string }>(
        `SELECT image_url FROM product_images WHERE product_id = $1 ORDER BY is_primary DESC, product_image_id ASC`,
        [id]
      ),
      query<{ id: number; name: string; attrName: string | null; attrValue: string | null; attrType: string }>(
        `SELECT s.product_spec_id AS id, s.name,
                a.name AS "attrName", a.value AS "attrValue", COALESCE(a.type,'text') AS "attrType"
         FROM product_specs s
         LEFT JOIN product_spec_attrs a ON a.spec_id = s.product_spec_id
         WHERE s.product_id = $1
         ORDER BY s.order_no, s.product_spec_id, a.product_spec_attr_id`,
        [id]
      ),
      query<any>(
        `SELECT product_sku_id AS id, sku_code AS "skuCode",
                variant_keys AS "variantKeys", variant_details AS "variantDetails",
                price::float8 AS price, stock, images, description
         FROM product_skus WHERE product_id = $1 AND is_active
         ORDER BY product_sku_id`,
        [id]
      ),
      query<any>(
        `SELECT r.review_id AS id, r.user_id AS "userId",
                COALESCE(NULLIF(u.first_name, '') || ' ' || NULLIF(u.last_name, ''), u.email) AS "userName",
                r.rating, r.comment, r.created_at AS "createdAt"
         FROM reviews r
         LEFT JOIN users u ON u.id = r.user_id
         WHERE r.product_id = $1 AND r.is_active
         ORDER BY r.created_at DESC`,
        [id]
      ),
    ]);

    const specGroups: { id: number; name: string; attributes: { name: string; value: string; type: string }[] }[] = [];
    for (const s of specs) {
      let g = specGroups.find((x) => x.id === s.id);
      if (!g) {
        g = { id: s.id, name: s.name, attributes: [] };
        specGroups.push(g);
      }
      if (s.attrName) g.attributes.push({ name: s.attrName, value: s.attrValue ?? '', type: s.attrType });
    }

    const parseImages = (raw: unknown): string[] => {
      if (Array.isArray(raw)) return raw as string[];
      if (typeof raw === 'string' && raw.trim().startsWith('[')) {
        try { return JSON.parse(raw); } catch { /* ignore */ }
      }
      return [];
    };

    const skusOut = skus.map((s) => ({ ...s, images: parseImages(s.images) }));

    const gallery = [...new Set([rows[0].prodImg, ...images.map((i) => i.image_url)])];

    res.json({
      success: true,
      data: {
        ...mapProduct(rows[0]),
        images: gallery,
        specs: specGroups,
        skus: skusOut,
        reviews: reviews.map((r) => ({ ...r, createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : undefined })),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to load product' });
  }
});

apiRouter.get('/api/categories', async (_req: Request, res: Response) => {
  try {
    const rows = await query<any>(
      `SELECT category_id AS id, name, description, is_active AS "isActive", created_at AS "createdAt"
       FROM categories WHERE is_active ORDER BY name`
    );
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to load categories' });
  }
});

apiRouter.get('/api/ads', async (req: Request, res: Response) => {
  try {
    const position = String(req.query['position'] || 'home');
    const rows = await query<any>(
      `SELECT banner_id AS id, title, image_url AS "imageUrl", link_url AS link,
              position, is_active AS "isActive"
       FROM ad_banners        WHERE is_active AND ($1 = '' OR position = $1)
       ORDER BY banner_id DESC`,
      [position]
    );
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to load ads' });
  }
});

/* ------------------------- User settings ----------------------- */

apiRouter.get('/api/settings', async (req: Request, res: Response) => {
  try {
    const user = authUser(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const rows = await query<any>(
      `SELECT value FROM app_settings WHERE key = $1`,
      [`user_settings_${user.userId}`]
    );
    res.json({ success: true, data: rows.length ? JSON.parse(rows[0].value) : null });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to load settings' });
  }
});

apiRouter.put('/api/settings', async (req: Request, res: Response) => {
  try {
    const user = authUser(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const value = JSON.stringify(req.body || {});
    await query(
      `INSERT INTO app_settings (key, value, type, description)
       VALUES ($1, $2, 'json', 'Customer storefront settings')
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [`user_settings_${user.userId}`, value]
    );
    res.json({ success: true, data: req.body });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to save settings' });
  }
});

/* ------------------------ Customer account ---------------------- */

function requireUser(req: Request, res: Response): { userId: number; email: string; userType: string } | null {
  const user = authUser(req);
  if (!user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return null;
  }
  return user;
}

const TAX_RATE = 0.08;

apiRouter.post('/api/orders', async (req: Request, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;
  try {
    const b = req.body || {};
    const items: Array<{ productId?: number; skuId?: number; quantity?: number }> = Array.isArray(b.items) ? b.items : [];
    const cleanItems = items
      .map((i) => ({ productId: Number(i.productId), skuId: i.skuId ? Number(i.skuId) : null, quantity: Math.max(1, Math.floor(Number(i.quantity) || 0)) }))
      .filter((i) => Number.isInteger(i.productId) && i.quantity > 0);

    if (!cleanItems.length) {
      res.status(400).json({ success: false, error: 'Your bag is empty' });
      return;
    }
    for (const f of ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'] as const) {
      if (!b[f] || !String(b[f]).trim()) {
        res.status(400).json({ success: false, error: `Missing field: ${f}` });
        return;
      }
    }

    // Price + stock are validated server-side; client prices are never trusted.
    let subtotal = 0;
    const priced: Array<{ productId: number; skuId: number | null; name: string; specs: string | null; price: number; quantity: number }> = [];
    for (const it of cleanItems) {
      if (it.skuId) {
        const r = await query<any>(
          `SELECT s.product_sku_id, s.sku_code, s.price::float8 AS price, s.stock,
                  p.product_id, p.prod_name
           FROM product_skus s JOIN products p ON p.product_id = s.product_id
           WHERE s.product_sku_id = $1 AND s.product_id = $2 AND s.is_active AND p.is_deleted = false`,
          [it.skuId, it.productId]
        );
        if (!r.length) {
          res.status(400).json({ success: false, error: 'A selected option is no longer available' });
          return;
        }
        const row = r[0];
        if (row.stock < it.quantity) {
          res.status(409).json({ success: false, error: `Only ${row.stock} left of ${row.sku_code}` });
          return;
        }
        priced.push({ productId: row.product_id, skuId: row.product_sku_id, name: row.prod_name, specs: row.sku_code, price: row.price, quantity: it.quantity });
      } else {
        const r = await query<any>(
          `SELECT product_id, prod_name, prod_price::float8 AS price FROM products
           WHERE product_id = $1 AND is_deleted = false AND status = 'ACTIVE'`,
          [it.productId]
        );
        if (!r.length) {
          res.status(400).json({ success: false, error: 'A product in your bag is no longer available' });
          return;
        }
        priced.push({ productId: r[0].product_id, skuId: null, name: r[0].prod_name, specs: null, price: r[0].price, quantity: it.quantity });
      }
    }
    subtotal = priced.reduce((s, i) => s + i.price * i.quantity, 0);
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    const shippingFee = 0;
    const discount = 0;
    const total = Math.round((subtotal - discount + tax + shippingFee) * 100) / 100;
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

    const inserted = await query<any>(
      `INSERT INTO orders (user_id, total, status, address, apartment, city, email, first_name, last_name,
                           order_number, payment_method, phone, shipping_fee, state, zip_code,
                           subtotal, tax, discount)
       VALUES ($1,$2,'PENDING',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING id, order_number`,
      [user.userId, total, String(b.address), String(b.apartment || ''), String(b.city), String(b.email),
       String(b.firstName), String(b.lastName), orderNumber, String(b.paymentMethod || 'cash'),
       String(b.phone), shippingFee, String(b.state), String(b.zipCode), subtotal, tax, discount]
    );
    const orderId = inserted[0].id;

    for (const i of priced) {
      await query(
        `INSERT INTO order_items (order_id, product_id, sku_id, product_name, specs, price, quantity, subtotal, original_price)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [orderId, i.productId, i.skuId, i.name, i.specs, i.price, i.quantity, i.price * i.quantity, i.price]
      );
      if (i.skuId) {
        await query(`UPDATE product_skus SET stock = stock - $1 WHERE product_sku_id = $2`, [i.quantity, i.skuId]);
      }
    }
    await query(
      `INSERT INTO audit_trails (user_id, user_email, action, entity_type, entity_id, metadata, ip_address, user_agent)
       VALUES ($1,$2,'order_placed','order',$3,$4,$5,$6)`,
      [user.userId, user.email, orderId, JSON.stringify({ orderNumber, total }), req.ip || '-', String(req.headers['user-agent'] || '-')]
    );

    res.status(201).json({ success: true, data: { orderId, orderNumber, subtotal, tax, shippingFee, discount, total } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to place order' });
  }
});

apiRouter.get('/api/orders', async (req: Request, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;
  try {
    const rows = await query<any>(
      `SELECT o.id, o.order_number AS "orderNumber", o.total::float8 AS total,
              o.status, o.created_at AS "createdAt",
              COALESCE(oi.item_count, 0)::int AS "itemCount"
       FROM orders o
       LEFT JOIN LATERAL (
         SELECT SUM(quantity) AS item_count FROM order_items WHERE order_id = o.id
       ) oi ON TRUE
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [user.userId]
    );
    res.json({
      success: true,
      data: rows.map((o) => ({ ...o, status: String(o.status || 'pending').toLowerCase() })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to load orders' });
  }
});

apiRouter.get('/api/orders/:id', async (req: Request, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;
  try {
    const id = Number(req.params['id']);
    const rows = await query<any>(
      `SELECT o.id, o.order_number AS "orderNumber", o.subtotal::float8 AS subtotal,
              o.tax::float8 AS tax, o.discount::float8 AS discount,
              o.shipping_fee::float8 AS "shippingFee", o.total::float8 AS total,
              o.status, o.payment_method AS "paymentMethod", o.created_at AS "createdAt",
              NULLIF(TRIM(CONCAT_WS(', ', o.address, o.apartment, o.city, o.state, o.zip_code)), '') AS address
       FROM orders o
       WHERE o.id = $1 AND o.user_id = $2`,
      [id, user.userId]
    );
    if (!rows.length) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }
    const items = await query<any>(
      `SELECT oi.product_name AS "productName", oi.specs, oi.price::float8 AS price,
              oi.quantity, oi.subtotal::float8 AS subtotal,
              COALESCE(pi.prod_img, '') AS image
       FROM order_items oi
       LEFT JOIN products pi ON pi.product_id = oi.product_id
       WHERE oi.order_id = $1
       ORDER BY oi.id`,
      [id]
    );
    res.json({
      success: true,
      data: { ...rows[0], status: String(rows[0].status || 'pending').toLowerCase(), items },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to load order' });
  }
});

apiRouter.get('/api/addresses', async (req: Request, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;
  try {
    const rows = await query<any>(
      `SELECT address_id AS id, first_name AS "firstName", last_name AS "lastName",
              address, apartment, city, state, zip_code AS "zipCode", phone,
              is_default AS "isDefault"
       FROM addresses WHERE user_id = $1
       ORDER BY is_default DESC, address_id ASC`,
      [user.userId]
    );
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to load addresses' });
  }
});

apiRouter.get('/api/wishlist', async (req: Request, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;
  try {
    const rows = await query<any>(
      `SELECT p.product_id AS "productId", p.prod_name AS "prodName", p.prod_img AS "prodImg",
              p.prod_price::float8 AS "prodPrice", w.created_at AS "createdAt"
       FROM wishlist_items w
       JOIN products p ON p.product_id = w.product_id AND p.is_deleted = false AND p.status = 'ACTIVE'
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [user.userId]
    );
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to load wishlist' });
  }
});

/* ----------------------------- Admin ---------------------------- */

apiRouter.get('/api/admin/stats', async (_req: Request, res: Response) => {
  try {
    const [products, users, categories, skus] = await Promise.all([
      query<{ c: number }>(`SELECT COUNT(*)::int AS c FROM products WHERE is_deleted = false`),
      query<{ c: number }>(`SELECT COUNT(*)::int AS c FROM users WHERE is_active`),
      query<{ c: number }>(`SELECT COUNT(*)::int AS c FROM categories WHERE is_active`),
      query<{ stock: string | null; value: string | null }>(
        `SELECT SUM(stock)::text AS stock, SUM(stock * price)::text AS value FROM product_skus WHERE is_active`
      ),
    ]);
    let totalOrders = 0;
    let totalRevenue = 0;
    try {
      const o = await query<{ c: number; sum: string | null }>(
        `SELECT COUNT(*)::int AS c, COALESCE(SUM(total), 0)::text AS sum FROM orders`
      );
      totalOrders = Number(o[0]?.c) || 0;
      totalRevenue = Number(o[0]?.sum) || 0;
    } catch {
      // Orders module not set up yet
    }
    res.json({
      success: true,
      data: {
        totalProducts: Number(products[0]?.c) || 0,
        totalUsers: Number(users[0]?.c) || 0,
        totalCategories: Number(categories[0]?.c) || 0,
        totalSkus: Number(skus[0]?.stock) || 0,
        inventoryValue: Number(skus[0]?.value) || 0,
        totalOrders,
        totalRevenue,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to load stats' });
  }
});

apiRouter.get('/api/admin/orders', async (_req: Request, res: Response) => {  try {
    const rows = await query<any>(`SELECT * FROM orders ORDER BY created_at DESC LIMIT 100`);
    res.json({
      success: true,
      data: rows.map((o) => ({
        id: o.id,
        orderNumber: o.order_number,
        userId: o.user_id,
        customerName: [o.first_name, o.last_name].filter(Boolean).join(' ') || o.email,
        email: o.email,
        total: Number(o.total) || 0,
        subtotal: Number(o.subtotal) || 0,
        tax: Number(o.tax) || 0,
        discount: Number(o.discount) || 0,
        shippingFee: Number(o.shipping_fee) || 0,
        status: String(o.status || 'pending').toLowerCase(),
        paymentMethod: o.payment_method,
        address: [o.address, o.apartment, o.city, o.state, o.zip_code].filter(Boolean).join(', '),
        createdAt: o.created_at,
      })),
    });
  } catch {
    // Orders module not set up yet — return an empty list instead of failing
    res.json({ success: true, data: [] });
  }
});

apiRouter.get('/api/admin/users', async (_req: Request, res: Response) => {
  try {
    const rows = await query<any>(
      `SELECT id, email, user_type AS "userType", first_name AS "firstName", last_name AS "lastName",
              phone, is_active AS "isActive", created_at AS "createdAt"
       FROM users ORDER BY created_at DESC LIMIT 200`
    );
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to load users' });
  }
});

apiRouter.get('/api/admin/coupons', async (_req: Request, res: Response) => {
  try {
    const rows = await query<any>(
      `SELECT coupon_id AS id, code, description, discount_type AS "discountType",
              discount_value::float8 AS "discountValue", min_subtotal::float8 AS "minSubtotal",
              valid_from AS "validFrom", valid_until AS "validUntil",
              is_active AS "isActive", max_uses AS "maxUses", used_count AS "usedCount"
       FROM coupons ORDER BY coupon_id DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to load coupons' });
  }
});

apiRouter.get('/api/admin/discounts', async (_req: Request, res: Response) => {
  try {
    const rows = await query<any>(
      `SELECT d.discount_id AS id, d.scope, d.discount_type AS "discountType",
              d.discount_value::float8 AS "discountValue",
              COALESCE(p.prod_name, c.name, sc.name) AS "targetName",
              d.valid_from AS "validFrom", d.valid_until AS "validUntil", d.is_active AS "isActive"
       FROM discounts d
       LEFT JOIN products p ON d.scope = 'product' AND p.product_id = d.product_id
       LEFT JOIN categories c ON d.scope = 'category' AND c.category_id = d.category_id
       LEFT JOIN subcategories sc ON d.scope = 'subcategory' AND sc.sub_category_id = d.sub_category_id
       ORDER BY d.discount_id DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to load discounts' });
  }
});

apiRouter.get('/api/admin/ads', async (_req: Request, res: Response) => {
  try {
    const rows = await query<any>(
      `SELECT banner_id AS id, title, image_url AS "imageUrl", link_url AS link,
              position, is_active AS "isActive"
       FROM ad_banners ORDER BY banner_id DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to load banners' });
  }
});

apiRouter.get('/api/admin/subcategories', async (_req: Request, res: Response) => {
  try {
    const rows = await query<any>(
      `SELECT s.sub_category_id AS id, s.name, s.description, s.category_id AS "categoryId",
              c.name AS "categoryName", s.is_active AS "isActive"
       FROM subcategories s LEFT JOIN categories c ON c.category_id = s.category_id
       ORDER BY s.sub_category_id DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to load subcategories' });
  }
});

apiRouter.post('/api/admin/categories', async (req: Request, res: Response) => {
  const user = authUser(req);
  if (!user || user.userType !== 'admin') {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return;
  }
  try {
    const name = String(req.body?.name || '').trim();
    if (!name) {
      res.status(400).json({ success: false, error: 'Name is required' });
      return;
    }
    const rows = await query<any>(
      `INSERT INTO categories (name, description, is_active, updated_at)
       VALUES ($1, $2, true, NOW())
       RETURNING category_id AS id, name`,
      [name, String(req.body?.description || '').trim() || null]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to create category' });
  }
});

apiRouter.post('/api/admin/subcategories', async (req: Request, res: Response) => {
  const user = authUser(req);
  if (!user || user.userType !== 'admin') {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return;
  }
  try {
    const name = String(req.body?.name || '').trim();
    const categoryId = Number(req.body?.categoryId);
    if (!name || !Number.isInteger(categoryId)) {
      res.status(400).json({ success: false, error: 'Name and category are required' });
      return;
    }
    const rows = await query<any>(
      `INSERT INTO subcategories (name, description, category_id, is_active, updated_at)
       VALUES ($1, $2, $3, true, NOW())
       RETURNING sub_category_id AS id, name`,
      [name, String(req.body?.description || '').trim() || null, categoryId]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to create subcategory' });
  }
});

apiRouter.get('/api/admin/audit', async (_req: Request, res: Response) => {
  try {
    const rows = await query<any>(
      `SELECT audit_id AS id, user_email AS "userEmail", action, entity_type AS "entityType",
              entity_id AS "entityId", ip_address AS "ipAddress", created_at AS "createdAt"
       FROM audit_trails ORDER BY created_at DESC LIMIT 100`
    );
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to load audit log' });
  }
});

apiRouter.get('/api/admin/reports', async (_req: Request, res: Response) => {
  try {
    const bestSellers = await query<any>(
      `SELECT oi.product_name AS "productName", SUM(oi.quantity)::int AS "unitsSold",
              SUM(oi.subtotal)::float8 AS revenue
       FROM order_items oi GROUP BY oi.product_name
       ORDER BY "unitsSold" DESC LIMIT 5`
    );
    const byStatus = await query<any>(
      `SELECT LOWER(status) AS status, COUNT(*)::int AS count, COALESCE(SUM(total),0)::float8 AS total
       FROM orders GROUP BY LOWER(status)`
    );
    const lowStock = await query<any>(
      `SELECT p.product_id AS "productId", p.prod_name AS "prodName", SUM(s.stock)::int AS stock
       FROM product_skus s JOIN products p ON p.product_id = s.product_id
       WHERE s.is_active
       GROUP BY p.product_id, p.prod_name
       HAVING SUM(s.stock) < 20 ORDER BY stock ASC LIMIT 5`
    );
    res.json({ success: true, data: { bestSellers, byStatus, lowStock } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to load reports' });
  }
});

apiRouter.post('/api/admin/products', async (req: Request, res: Response) => {
  const user = authUser(req);
  if (!user || user.userType !== 'admin') {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return;
  }
  try {
    const b = req.body || {};
    const name = String(b.name || '').trim();
    const price = Number(b.price);
    const baseSku = String(b.baseSku || '').trim().toUpperCase();
    const categoryId = Number(b.categoryId);
    const subCategoryId = Number(b.subCategoryId);
    if (!name || !Number.isFinite(price) || price <= 0 || !baseSku || !Number.isInteger(categoryId) || !Number.isInteger(subCategoryId)) {
      res.status(400).json({ success: false, error: 'Name, price, base SKU, category and subcategory are required' });
      return;
    }
    const cat = await query(`SELECT category_id FROM categories WHERE category_id = $1`, [categoryId]);
    if (!cat.length) {
      res.status(400).json({ success: false, error: 'Category not found' });
      return;
    }
    const sub = await query(`SELECT sub_category_id FROM subcategories WHERE sub_category_id = $1 AND category_id = $2`, [subCategoryId, categoryId]);
    if (!sub.length) {
      res.status(400).json({ success: false, error: 'Subcategory not found in the selected category' });
      return;
    }
    const rows = await query<any>(
      `INSERT INTO products (base_sku, prod_name, prod_subtitle, prod_price, category_id, sub_category_id,
                             prod_img, prod_description, status, stock_status, charge_tax,
                             tags_category, tags_meta, tags_ga4, featured_on_homepage, show_in_new_arrivals,
                             is_deleted, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,false,NOW(),NOW())
       RETURNING product_id AS id`,
      [baseSku, name, String(b.subtitle || '').trim(), price, categoryId, subCategoryId,
       String(b.imageUrl || '').trim(), String(b.description || '').trim(),
       b.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
       b.stockStatus !== false, b.chargeTax === true,
       String(b.tagsCategory || '').trim(), String(b.tagsMeta || '').trim(), String(b.tagsGa4 || '').trim(),
       b.featuredOnHomepage === true, b.showInNewArrivals === true]
    );
    const productId = rows[0].id;
    if (Array.isArray(b.skus)) await syncSkus(productId, baseSku, b.skus);
    if (Array.isArray(b.images)) await syncImages(productId, b.images);
    if (Array.isArray(b.specs)) await syncSpecs(productId, b.specs);
    res.status(201).json({ success: true, data: { id: productId } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to create product' });
  }
});

async function syncImages(productId: number, rawImages: unknown): Promise<void> {
  const images: string[] = (Array.isArray(rawImages) ? rawImages : []).map((x: any) => String(x)).filter(Boolean);
  await query(`DELETE FROM product_images WHERE product_id = $1`, [productId]);
  for (let i = 0; i < images.length; i++) {
    await query(
      `INSERT INTO product_images (product_id, image_url, is_primary) VALUES ($1,$2,$3)`,
      [productId, images[i], i === 0]
    );
  }
}

async function syncSpecs(productId: number, rawSpecs: unknown): Promise<void> {
  const specs: any[] = Array.isArray(rawSpecs) ? rawSpecs : [];
  const clean = specs
    .map((s) => ({
      name: String(s?.name || '').trim(),
      description: String(s?.description || '').trim(),
      type: s?.type === 'color' ? 'color' : 'text',
      attributes: (Array.isArray(s?.attributes) ? s.attributes : [])
        .map((a: any) => ({ name: String(a?.name || '').trim(), value: String(a?.value ?? '').trim() }))
        .filter((a: any) => a.name),
    }))
    .filter((s) => s.name);

  await query(`DELETE FROM product_spec_attrs WHERE spec_id IN (SELECT product_spec_id FROM product_specs WHERE product_id = $1)`, [productId]);
  await query(`DELETE FROM product_specs WHERE product_id = $1`, [productId]);
  for (let i = 0; i < clean.length; i++) {
    const s = clean[i];
    const ins = await query<any>(
      `INSERT INTO product_specs (product_id, name, description, order_no) VALUES ($1,$2,$3,$4) RETURNING product_spec_id AS id`,
      [productId, s.name, s.description, i]
    );
    for (const a of s.attributes) {
      await query(
        `INSERT INTO product_spec_attrs (spec_id, name, value, type) VALUES ($1,$2,$3,$4)`,
        [ins[0].id, a.name, a.value || (s.type === 'color' ? '#0d0c0c' : ''), s.type]
      );
    }
  }
}

type IncomingSku = { id?: number; skuCode?: string; variantKeys?: string; variantDetails?: string; description?: string; price?: number; stock?: number; images?: string[] };

async function syncSkus(productId: number, baseSku: string, rawSkus: unknown): Promise<void> {
  const skus: IncomingSku[] = Array.isArray(rawSkus) ? rawSkus : [];
  const clean = skus
    .map((s) => ({
      id: s?.id ? Number(s.id) : null,
      skuCode: String(s?.skuCode || '').trim(),
      variantKeys: String(s?.variantKeys || '').trim(),
      variantDetails: String(s?.variantDetails || '').trim(),
      description: String(s?.description || '').trim(),
      price: Number(s?.price),
      stock: Math.max(0, Math.floor(Number(s?.stock) || 0)),
      images: (Array.isArray(s?.images) ? s.images : []).map((x: any) => String(x)).filter(Boolean),
    }))
    .filter((s) => s.variantKeys && s.variantDetails && Number.isFinite(s.price) && s.price > 0);

  const keepIds = new Set<number>();
  let n = 0;
  for (const s of clean) {
    n++;
    const imagesJson = s.images.length ? JSON.stringify(s.images) : null;
    // sku_code is globally unique — resolve a free code
    let code = s.skuCode;
    for (;;) {
      if (!code) {
        const stem = `${baseSku}-${s.variantKeys.toUpperCase().replace(/[^A-Z0-9]/g, '') || 'V'}`;
        code = `${stem}-${String(n).padStart(3, '0')}`;
      }
      const clash = await query(`SELECT 1 FROM product_skus WHERE sku_code = $1 AND product_sku_id <> $2`, [code, s.id || 0]);
      if (!clash.length) break;
      code = `${code.split('-R')[0]}-R${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    }
    if (s.id) {
      await query(
        `UPDATE product_skus SET sku_code=$1, variant_keys=$2, variant_details=$3, description=$4, price=$5, stock=$6, images=$7, is_active=true
         WHERE product_sku_id=$8 AND product_id=$9`,
        [code, s.variantKeys, s.variantDetails, s.description, s.price, s.stock, imagesJson, s.id, productId]
      );
      keepIds.add(s.id);
    } else {
      const ins = await query<any>(
        `INSERT INTO product_skus (product_id, sku_code, variant_keys, variant_details, description, price, stock, images, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true)
         RETURNING product_sku_id AS id`,
        [productId, code, s.variantKeys, s.variantDetails, s.description, s.price, s.stock, imagesJson]
      );
      keepIds.add(ins[0].id);
    }
  }

  // Deactivate removed SKUs (never hard-delete: order_items references sku ids)
  const existing = await query<any>(`SELECT product_sku_id FROM product_skus WHERE product_id = $1`, [productId]);
  for (const row of existing) {
    if (!keepIds.has(row.product_sku_id)) {
      await query(`UPDATE product_skus SET is_active = false WHERE product_sku_id = $1`, [row.product_sku_id]);
    }
  }
}

apiRouter.post('/api/admin/upload', async (req: Request, res: Response) => {
  const user = authUser(req);
  if (!user || user.userType !== 'admin') {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return;
  }
  try {
    const dataUrl = String(req.body?.data || '');
    const m = dataUrl.match(/^data:(image\/(png|jpe?g|webp|gif|avif));base64,([A-Za-z0-9+/=]+)$/);
    if (!m) {
      res.status(400).json({ success: false, error: 'Only PNG, JPG, WEBP, GIF or AVIF images are allowed' });
      return;
    }
    const sizeBytes = Math.floor((m[3].length * 3) / 4);
    if (sizeBytes > 8 * 1024 * 1024) {
      res.status(413).json({ success: false, error: 'Image must be under 8 MB' });
      return;
    }

    const cloudName = process.env['CLOUDINARY_CLOUD_NAME'];
    const apiKey = process.env['CLOUDINARY_API_KEY'];
    const apiSecret = process.env['CLOUDINARY_API_SECRET'];
    if (!cloudName || !apiKey || !apiSecret) {
      res.status(500).json({ success: false, error: 'Cloudinary is not configured on the server' });
      return;
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'products';
    const signature = crypto
      .createHash('sha1')
      .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
      .digest('hex');

    const form = new FormData();
    form.append('file', dataUrl);
    form.append('api_key', apiKey);
    form.append('timestamp', String(timestamp));
    form.append('folder', folder);
    form.append('signature', signature);

    const upstream = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: form,
    });
    const result: any = await upstream.json();
    if (!upstream.ok || !result?.secure_url) {
      res.status(502).json({ success: false, error: result?.error?.message || 'Upload to Cloudinary failed' });
      return;
    }
    res.status(201).json({ success: true, data: { url: result.secure_url } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Upload failed' });
  }
});

apiRouter.get('/api/admin/products/:id', async (req: Request, res: Response) => {
  const user = authUser(req);
  if (!user || user.userType !== 'admin') {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return;
  }
  try {
    const rows = await query<any>(
      `SELECT product_id AS id, base_sku AS "baseSku", prod_name AS name,
              COALESCE(prod_subtitle, '') AS subtitle,
              prod_price::float8 AS price,
              category_id AS "categoryId", sub_category_id AS "subCategoryId",
              prod_img AS "imageUrl", prod_description AS description, status,
              COALESCE(stock_status, true) AS "stockStatus",
              COALESCE(charge_tax, false) AS "chargeTax",
              COALESCE(tags_category, '') AS "tagsCategory",
              COALESCE(tags_meta, '') AS "tagsMeta",
              COALESCE(tags_ga4, '') AS "tagsGa4",
              COALESCE(featured_on_homepage, false) AS "featuredOnHomepage",
              COALESCE(show_in_new_arrivals, false) AS "showInNewArrivals"
       FROM products WHERE product_id = $1 AND is_deleted = false`,
      [Number(req.params['id'])]
    );
    if (!rows.length) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }
    const pid = Number(req.params['id']);
    const product = rows[0];

    const imgs = await query<any>(
      `SELECT image_url FROM product_images WHERE product_id = $1 ORDER BY is_primary DESC, product_image_id`,
      [pid]
    );
    product.images = imgs.map((i: any) => i.image_url);

    const specs = await query<any>(
      `SELECT product_spec_id AS id, name, COALESCE(description,'') AS description, order_no
       FROM product_specs WHERE product_id = $1 ORDER BY order_no, product_spec_id`,
      [pid]
    );
    for (const s of specs) {
      const attrs = await query<any>(
        `SELECT name, value, COALESCE(type,'text') AS type
         FROM product_spec_attrs WHERE spec_id = $1 ORDER BY product_spec_attr_id`,
        [s.id]
      );
      s.attributes = attrs;
    }
    product.specs = specs;

    const skus = await query<any>(
      `SELECT product_sku_id AS id, sku_code AS "skuCode", variant_keys AS "variantKeys",
              variant_details AS "variantDetails", description, price::float8 AS price, stock, images
       FROM product_skus WHERE product_id = $1 AND is_active ORDER BY product_sku_id`,
      [pid]
    );
    product.skus = skus.map((s: any) => {
      let images: string[] = [];
      try { images = s.images ? JSON.parse(s.images) : []; } catch { images = []; }
      return { ...s, images };
    });

    res.json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to load product' });
  }
});

apiRouter.put('/api/admin/products/:id', async (req: Request, res: Response) => {
  const user = authUser(req);
  if (!user || user.userType !== 'admin') {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return;
  }
  try {
    const id = Number(req.params['id']);
    const b = req.body || {};
    const name = String(b.name || '').trim();
    const price = Number(b.price);
    const baseSku = String(b.baseSku || '').trim().toUpperCase();
    const categoryId = Number(b.categoryId);
    const subCategoryId = Number(b.subCategoryId);
    if (!name || !Number.isFinite(price) || price <= 0 || !baseSku || !Number.isInteger(categoryId) || !Number.isInteger(subCategoryId)) {
      res.status(400).json({ success: false, error: 'Name, price, base SKU, category and subcategory are required' });
      return;
    }
    const rows = await query<any>(
      `UPDATE products
       SET prod_name = $1, prod_subtitle = $2, prod_price = $3, base_sku = $4, category_id = $5, sub_category_id = $6,
           prod_img = $7, prod_description = $8, status = $9, stock_status = $10, charge_tax = $11,
           tags_category = $12, tags_meta = $13, tags_ga4 = $14,
           featured_on_homepage = $15, show_in_new_arrivals = $16, updated_at = NOW()
       WHERE product_id = $17 AND is_deleted = false
       RETURNING product_id AS id`,
      [name, String(b.subtitle || '').trim(), price, baseSku, categoryId, subCategoryId,
       String(b.imageUrl || '').trim(), String(b.description || '').trim(),
       b.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
       b.stockStatus !== false, b.chargeTax === true,
       String(b.tagsCategory || '').trim(), String(b.tagsMeta || '').trim(), String(b.tagsGa4 || '').trim(),
       b.featuredOnHomepage === true, b.showInNewArrivals === true, id]
    );
    if (!rows.length) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }
    if (Array.isArray(b.skus)) await syncSkus(id, baseSku, b.skus);
    if (Array.isArray(b.images)) await syncImages(id, b.images);
    if (Array.isArray(b.specs)) await syncSpecs(id, b.specs);
    res.json({ success: true, data: rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to update product' });
  }
});

apiRouter.delete('/api/admin/products/:id', async (req: Request, res: Response) => {
  const user = authUser(req);
  if (!user || user.userType !== 'admin') {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return;
  }
  try {
    const id = Number(req.params['id']);
    const rows = await query<any>(
      `UPDATE products SET is_deleted = true, updated_at = NOW()
       WHERE product_id = $1 AND is_deleted = false RETURNING product_id AS id`,
      [id]
    );
    if (!rows.length) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }
    await query(
      `INSERT INTO audit_trails (user_id, user_email, action, entity_type, entity_id, ip_address, user_agent)
       VALUES ($1,$2,'product_deleted','product',$3,$4,$5)`,
      [user.userId, user.email, id, req.ip || '-', String(req.headers['user-agent'] || '-')]
    );
    res.json({ success: true, data: { id } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to delete product' });
  }
});

/* ================= Product wizard: specifications CRUD ================= */

async function insertSpecAttrs(specId: number, type: string, rawAttrs: unknown): Promise<void> {
  const attrs: any[] = Array.isArray(rawAttrs) ? rawAttrs : [];
  for (const a of attrs) {
    const name = String(a?.name || '').trim();
    if (!name) continue;
    const value = String(a?.value ?? '').trim() || (type === 'color' ? '#0d0c0c' : '');
    await query(`INSERT INTO product_spec_attrs (spec_id, name, value, type) VALUES ($1,$2,$3,$4)`, [specId, name, value, type]);
  }
}

apiRouter.post('/api/admin/products/:id/specs', async (req: Request, res: Response) => {
  const user = authUser(req);
  if (!user || user.userType !== 'admin') {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return;
  }
  try {
    const pid = Number(req.params['id']);
    const name = String(req.body?.name || '').trim();
    if (!name) {
      res.status(400).json({ success: false, error: 'Specification name is required' });
      return;
    }
    const prod = await query(`SELECT 1 FROM products WHERE product_id = $1 AND is_deleted = false`, [pid]);
    if (!prod.length) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }
    const type = req.body?.type === 'color' ? 'color' : 'text';
    const maxRow = await query<{ m: number | null }>(`SELECT MAX(order_no) AS m FROM product_specs WHERE product_id = $1`, [pid]);
    const orderNo = (maxRow[0]?.m ?? -1) + 1;
    const ins = await query<any>(
      `INSERT INTO product_specs (product_id, name, description, order_no) VALUES ($1,$2,$3,$4) RETURNING product_spec_id AS id`,
      [pid, name, String(req.body?.description || '').trim(), orderNo]
    );
    await insertSpecAttrs(ins[0].id, type, req.body?.attributes);
    res.status(201).json({ success: true, data: { id: ins[0].id } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to create specification' });
  }
});

apiRouter.put('/api/admin/products/:id/specs/:specId', async (req: Request, res: Response) => {
  const user = authUser(req);
  if (!user || user.userType !== 'admin') {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return;
  }
  try {
    const pid = Number(req.params['id']);
    const specId = Number(req.params['specId']);
    const name = String(req.body?.name || '').trim();
    if (!name) {
      res.status(400).json({ success: false, error: 'Specification name is required' });
      return;
    }
    const rows = await query<any>(
      `UPDATE product_specs SET name = $1, description = $2
       WHERE product_spec_id = $3 AND product_id = $4 RETURNING product_spec_id AS id`,
      [name, String(req.body?.description || '').trim(), specId, pid]
    );
    if (!rows.length) {
      res.status(404).json({ success: false, error: 'Specification not found' });
      return;
    }
    const type = req.body?.type === 'color' ? 'color' : 'text';
    await query(`DELETE FROM product_spec_attrs WHERE spec_id = $1`, [specId]);
    await insertSpecAttrs(specId, type, req.body?.attributes);
    res.json({ success: true, data: { id: specId } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to update specification' });
  }
});

apiRouter.delete('/api/admin/products/:id/specs/:specId', async (req: Request, res: Response) => {
  const user = authUser(req);
  if (!user || user.userType !== 'admin') {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return;
  }
  try {
    const pid = Number(req.params['id']);
    const specId = Number(req.params['specId']);
    await query(`DELETE FROM product_spec_attrs WHERE spec_id = $1`, [specId]);
    const rows = await query(`DELETE FROM product_specs WHERE product_spec_id = $1 AND product_id = $2 RETURNING product_spec_id`, [specId, pid]);
    if (!rows.length) {
      res.status(404).json({ success: false, error: 'Specification not found' });
      return;
    }
    res.json({ success: true, data: { id: specId } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to delete specification' });
  }
});

/* ================= Product wizard: SKU generation & editing ================= */

function generateCombinations(groups: any[][]): any[][] {
  if (groups.length === 0) return [];
  if (groups.length === 1) return groups[0].map((item) => [item]);
  const result: any[][] = [];
  const restCombinations = generateCombinations(groups.slice(1));
  for (const item of groups[0]) {
    for (const combination of restCombinations) {
      result.push([item, ...combination]);
    }
  }
  return result;
}

async function loadProductSkus(pid: number) {
  const skus = await query<any>(
    `SELECT product_sku_id AS id, sku_code AS "skuCode", variant_keys AS "variantKeys",
            variant_details AS "variantDetails", COALESCE(description,'') AS description,
            price::float8 AS price, stock, images
     FROM product_skus WHERE product_id = $1 AND is_active ORDER BY product_sku_id`,
    [pid]
  );
  return skus.map((s: any) => {
    let images: string[] = [];
    try { images = s.images ? JSON.parse(s.images) : []; } catch { images = []; }
    return { ...s, images };
  });
}

apiRouter.post('/api/admin/products/:id/skus/generate', async (req: Request, res: Response) => {
  const user = authUser(req);
  if (!user || user.userType !== 'admin') {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return;
  }
  try {
    const pid = Number(req.params['id']);
    const prods = await query<any>(`SELECT base_sku, prod_price FROM products WHERE product_id = $1 AND is_deleted = false`, [pid]);
    if (!prods.length) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }
    const specs = await query<any>(`SELECT product_spec_id AS id FROM product_specs WHERE product_id = $1 ORDER BY order_no, product_spec_id`, [pid]);
    if (!specs.length) {
      res.status(400).json({ success: false, error: 'No specifications found — add at least one specification first' });
      return;
    }
    const groups: any[][] = [];
    for (const s of specs) {
      const attrs = await query<any>(`SELECT name, value FROM product_spec_attrs WHERE spec_id = $1 ORDER BY product_spec_attr_id`, [s.id]);
      groups.push(attrs.filter((a: any) => a.name));
    }
    const combos = generateCombinations(groups.filter(g => g.length));

    const existing = await query<any>(`SELECT product_sku_id AS id, sku_code AS code FROM product_skus WHERE product_id = $1`, [pid]);
    const existingByCode = new Map<string, number>(existing.map((e: any) => [e.code, e.id]));
    const wantedCodes = new Set<string>();
    const toCreate: { code: string; variantKeys: string; variantDetails: string }[] = [];

    combos.forEach((combo, index) => {
      const variantKeys = combo.map((a: any) => a.name).join(', ');
      const variantDetails = combo.map((a: any) => a.value).join(', ');
      const variantCodes = combo.map((a: any) => String(a.name).substring(0, 3).toUpperCase());
      const code = `${prods[0].base_sku}-${variantCodes.join('-')}-${String(index + 1).padStart(3, '0')}`;
      wantedCodes.add(code);
      if (!existingByCode.has(code)) toCreate.push({ code, variantKeys, variantDetails });
    });

    // Remove SKUs that are no longer needed (deactivate instead when referenced by orders)
    for (const e of existing) {
      if (!wantedCodes.has(e.code)) {
        try {
          await query(`DELETE FROM product_skus WHERE product_sku_id = $1`, [e.id]);
        } catch {
          await query(`UPDATE product_skus SET is_active = false WHERE product_sku_id = $1`, [e.id]);
        }
      }
    }

    for (const c of toCreate) {
      let code = c.code;
      const clash = await query(`SELECT 1 FROM product_skus WHERE sku_code = $1`, [code]);
      if (clash.length) code = `${code}-R${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      await query(
        `INSERT INTO product_skus (product_id, sku_code, variant_keys, variant_details, description, price, stock, images, is_active)
         VALUES ($1,$2,$3,$4,'',$5,0,NULL,true)`,
        [pid, code, c.variantKeys, c.variantDetails, Number(prods[0].prod_price)]
      );
    }

    res.status(201).json({ success: true, data: await loadProductSkus(pid) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to generate SKUs' });
  }
});

apiRouter.put('/api/admin/products/:id/skus/:skuId', async (req: Request, res: Response) => {
  const user = authUser(req);
  if (!user || user.userType !== 'admin') {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return;
  }
  try {
    const pid = Number(req.params['id']);
    const skuId = Number(req.params['skuId']);
    const price = Number(req.body?.price);
    if (!Number.isFinite(price) || price <= 0) {
      res.status(400).json({ success: false, error: 'A price above 0 is required' });
      return;
    }
    const stock = Math.max(0, Math.floor(Number(req.body?.stock) || 0));
    const description = String(req.body?.description || '').trim();
    const images = (Array.isArray(req.body?.images) ? req.body.images : []).map((x: any) => String(x)).filter(Boolean);
    const imagesJson = images.length ? JSON.stringify(images) : null;
    const rows = await query(
      `UPDATE product_skus SET description = $1, price = $2, stock = $3, images = $4
       WHERE product_sku_id = $5 AND product_id = $6 AND is_active RETURNING product_sku_id`,
      [description, price, stock, imagesJson, skuId, pid]
    );
    if (!rows.length) {
      res.status(404).json({ success: false, error: 'SKU not found' });
      return;
    }
    res.json({ success: true, data: { id: skuId } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to update SKU' });
  }
});
