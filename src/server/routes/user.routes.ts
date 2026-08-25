import { Router, type Request, type Response } from 'express';
import { query } from '../db';
import { requireUser } from '../middleware/auth';

export const userRouter = Router();

const TAX_RATE = 0.08;

userRouter.get('/api/settings', async (req: Request, res: Response) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
    const rows = await query<any>(
      `SELECT value FROM app_settings WHERE key = $1`,
      [`user_settings_${user.userId}`]
    );
    res.json({ success: true, data: rows.length ? JSON.parse(rows[0].value) : null });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to load settings' });
  }
});

userRouter.put('/api/settings', async (req: Request, res: Response) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;
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

userRouter.post('/api/orders', async (req: Request, res: Response) => {
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

userRouter.get('/api/orders', async (req: Request, res: Response) => {
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

userRouter.get('/api/orders/:id', async (req: Request, res: Response) => {
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

userRouter.get('/api/addresses', async (req: Request, res: Response) => {
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

userRouter.get('/api/wishlist', async (req: Request, res: Response) => {
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

// ===== Wishlist Add/Remove =====

userRouter.post('/api/wishlist/:productId', async (req: Request, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;
  try {
    const productId = Number(req.params['productId']);
    if (!Number.isInteger(productId)) {
      res.status(400).json({ success: false, error: 'Invalid product id' });
      return;
    }
    const prod = await query(`SELECT 1 FROM products WHERE product_id = $1 AND is_deleted = false AND status = 'ACTIVE'`, [productId]);
    if (!prod.length) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }
    await query(
      `INSERT INTO wishlist_items (user_id, product_id, created_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING`,
      [user.userId, productId]
    );
    res.status(201).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to add to wishlist' });
  }
});

userRouter.delete('/api/wishlist/:productId', async (req: Request, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;
  try {
    const productId = Number(req.params['productId']);
    await query(`DELETE FROM wishlist_items WHERE user_id = $1 AND product_id = $2`, [user.userId, productId]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to remove from wishlist' });
  }
});

// ===== Address CRUD =====

userRouter.post('/api/addresses', async (req: Request, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;
  try {
    const b = req.body || {};
    const address = String(b.address || '').trim();
    const city = String(b.city || '').trim();
    const state = String(b.state || '').trim();
    const zipCode = String(b.zipCode || '').trim();
    if (!address || !city || !state || !zipCode) {
      res.status(400).json({ success: false, error: 'Address, city, state and zip code are required' });
      return;
    }
    if (b.isDefault) {
      await query(`UPDATE addresses SET is_default = false WHERE user_id = $1`, [user.userId]);
    }
    const rows = await query<any>(
      `INSERT INTO addresses (user_id, first_name, last_name, address, apartment, city, state, zip_code, phone, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING address_id AS id, first_name AS "firstName", last_name AS "lastName",
                 address, apartment, city, state, zip_code AS "zipCode", phone, is_default AS "isDefault"`,
      [user.userId, String(b.firstName || '').trim() || null, String(b.lastName || '').trim() || null,
       address, String(b.apartment || '').trim() || null, city, state, zipCode,
       String(b.phone || '').trim() || null, b.isDefault === true]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to create address' });
  }
});

userRouter.put('/api/addresses/:id', async (req: Request, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;
  try {
    const id = Number(req.params['id']);
    const b = req.body || {};
    const address = String(b.address || '').trim();
    const city = String(b.city || '').trim();
    const state = String(b.state || '').trim();
    const zipCode = String(b.zipCode || '').trim();
    if (!address || !city || !state || !zipCode) {
      res.status(400).json({ success: false, error: 'Address, city, state and zip code are required' });
      return;
    }
    if (b.isDefault) {
      await query(`UPDATE addresses SET is_default = false WHERE user_id = $1`, [user.userId]);
    }
    const rows = await query<any>(
      `UPDATE addresses SET first_name = $1, last_name = $2, address = $3, apartment = $4,
              city = $5, state = $6, zip_code = $7, phone = $8, is_default = $9
       WHERE address_id = $10 AND user_id = $11
       RETURNING address_id AS id, first_name AS "firstName", last_name AS "lastName",
                 address, apartment, city, state, zip_code AS "zipCode", phone, is_default AS "isDefault"`,
      [String(b.firstName || '').trim() || null, String(b.lastName || '').trim() || null,
       address, String(b.apartment || '').trim() || null, city, state, zipCode,
       String(b.phone || '').trim() || null, b.isDefault === true, id, user.userId]
    );
    if (!rows.length) {
      res.status(404).json({ success: false, error: 'Address not found' });
      return;
    }
    res.json({ success: true, data: rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to update address' });
  }
});

userRouter.delete('/api/addresses/:id', async (req: Request, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;
  try {
    const id = Number(req.params['id']);
    const rows = await query(`DELETE FROM addresses WHERE address_id = $1 AND user_id = $2 RETURNING address_id`, [id, user.userId]);
    if (!rows.length) {
      res.status(404).json({ success: false, error: 'Address not found' });
      return;
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to delete address' });
  }
});
