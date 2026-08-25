import { Router, type Request, type Response } from 'express';
import crypto from 'node:crypto';
import { query } from '../db';
import { requireAdmin } from '../middleware/auth';

export const adminRouter = Router();

/* ----------------------------- Admin ---------------------------- */

adminRouter.get('/api/admin/stats', async (_req: Request, res: Response) => {
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

adminRouter.get('/api/admin/orders/:id', async (req: Request, res: Response) => {
  const user = requireAdmin(req, res);
  if (!user) return;
  try {
    const id = Number(req.params['id']);
    if (!Number.isInteger(id)) {
      res.status(400).json({ success: false, error: 'Invalid order id' });
      return;
    }
    const rows = await query<any>(`SELECT * FROM orders WHERE id = $1`, [id]);
    if (!rows.length) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }
    const o = rows[0];
    let items: any[] = [];
    try {
      items = await query<any>(
        `SELECT oi.order_item_id AS id, oi.product_id AS "productId", p.prod_name AS "productName",
                p.prod_img AS "productImage", oi.quantity, oi.price
         FROM order_items oi
         LEFT JOIN products p ON p.product_id = oi.product_id
         WHERE oi.order_id = $1`,
        [id]
      );
    } catch {
      // order_items table may not exist
    }
    res.json({
      success: true,
      data: {
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
        status: (o.status || 'pending').toLowerCase(),
        paymentMethod: o.payment_method,
        address: o.shipping_address,
        items,
        createdAt: o.created_at,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to load order' });
  }
});

adminRouter.get('/api/admin/orders', async (_req: Request, res: Response) => {  try {
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

adminRouter.get('/api/admin/users', async (_req: Request, res: Response) => {
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

adminRouter.get('/api/admin/coupons', async (_req: Request, res: Response) => {
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

adminRouter.get('/api/admin/discounts', async (_req: Request, res: Response) => {
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

adminRouter.get('/api/admin/ads', async (_req: Request, res: Response) => {
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

adminRouter.get('/api/admin/subcategories', async (_req: Request, res: Response) => {
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

adminRouter.post('/api/admin/categories', async (req: Request, res: Response) => {
  const user = requireAdmin(req, res);
  if (!user) return;
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

adminRouter.post('/api/admin/subcategories', async (req: Request, res: Response) => {
  const user = requireAdmin(req, res);
  if (!user) return;
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

adminRouter.get('/api/admin/audit', async (_req: Request, res: Response) => {
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

adminRouter.get('/api/admin/reports', async (_req: Request, res: Response) => {
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

adminRouter.post('/api/admin/products', async (req: Request, res: Response) => {
  const user = requireAdmin(req, res);
  if (!user) return;
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

  const existing = await query<any>(`SELECT product_sku_id FROM product_skus WHERE product_id = $1`, [productId]);
  for (const row of existing) {
    if (!keepIds.has(row.product_sku_id)) {
      await query(`UPDATE product_skus SET is_active = false WHERE product_sku_id = $1`, [row.product_sku_id]);
    }
  }
}

adminRouter.post('/api/admin/upload', async (req: Request, res: Response) => {
  const user = requireAdmin(req, res);
  if (!user) return;
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

adminRouter.get('/api/admin/products/:id', async (req: Request, res: Response) => {
  const user = requireAdmin(req, res);
  if (!user) return;
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

adminRouter.put('/api/admin/products/:id', async (req: Request, res: Response) => {
  const user = requireAdmin(req, res);
  if (!user) return;
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

adminRouter.delete('/api/admin/products/:id', async (req: Request, res: Response) => {
  const user = requireAdmin(req, res);
  if (!user) return;
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

adminRouter.post('/api/admin/products/:id/specs', async (req: Request, res: Response) => {
  const user = requireAdmin(req, res);
  if (!user) return;
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

adminRouter.put('/api/admin/products/:id/specs/:specId', async (req: Request, res: Response) => {
  const user = requireAdmin(req, res);
  if (!user) return;
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

adminRouter.delete('/api/admin/products/:id/specs/:specId', async (req: Request, res: Response) => {
  const user = requireAdmin(req, res);
  if (!user) return;
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

adminRouter.post('/api/admin/products/:id/skus/generate', async (req: Request, res: Response) => {
  const user = requireAdmin(req, res);
  if (!user) return;
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

adminRouter.put('/api/admin/products/:id/skus/:skuId', async (req: Request, res: Response) => {
  const user = requireAdmin(req, res);
  if (!user) return;
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

// ===== Admin: Order Status Update =====

adminRouter.put('/api/admin/orders/:id/status', async (req: Request, res: Response) => {
  const user = requireAdmin(req, res);
  if (!user) return;
  try {
    const id = Number(req.params['id']);
    const status = String(req.body?.status || '').toUpperCase();
    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }
    const rows = await query<any>(
      `UPDATE orders SET status = $1 WHERE id = $2 RETURNING id, order_number AS "orderNumber", status`,
      [status, id]
    );
    if (!rows.length) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }
    await query(
      `INSERT INTO audit_trails (user_id, user_email, action, entity_type, entity_id, metadata, ip_address, user_agent)
       VALUES ($1,$2,'order_status_changed','order',$3,$4,$5,$6)`,
      [user.userId, user.email, id, JSON.stringify({ status }), req.ip || '-', String(req.headers['user-agent'] || '-')]
    );
    res.json({ success: true, data: rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to update order status' });
  }
});

// ===== Admin: Coupon CRUD =====

adminRouter.post('/api/admin/coupons', async (req: Request, res: Response) => {
  const user = requireAdmin(req, res);
  if (!user) return;
  try {
    const b = req.body || {};
    const code = String(b.code || '').trim().toUpperCase();
    const discountType = String(b.discountType || 'percentage');
    const discountValue = Number(b.discountValue);
    if (!code || !['percentage', 'fixed'].includes(discountType) || !Number.isFinite(discountValue) || discountValue <= 0) {
      res.status(400).json({ success: false, error: 'Code, discountType (percentage/fixed) and a positive discountValue are required' });
      return;
    }
    const existing = await query(`SELECT 1 FROM coupons WHERE code = $1`, [code]);
    if (existing.length) {
      res.status(409).json({ success: false, error: 'A coupon with this code already exists' });
      return;
    }
    const rows = await query<any>(
      `INSERT INTO coupons (code, description, discount_type, discount_value, min_subtotal, valid_from, valid_until, is_active, max_uses)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING coupon_id AS id, code, description, discount_type AS "discountType",
                 discount_value::float8 AS "discountValue", min_subtotal::float8 AS "minSubtotal",
                 valid_from AS "validFrom", valid_until AS "validUntil", is_active AS "isActive", max_uses AS "maxUses"`,
      [code, String(b.description || '').trim() || null, discountType, discountValue,
       Number(b.minSubtotal) || 0, b.validFrom || null, b.validUntil || null,
       b.isActive !== false, Number(b.maxUses) || null]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to create coupon' });
  }
});

adminRouter.put('/api/admin/coupons/:id', async (req: Request, res: Response) => {
  const user = requireAdmin(req, res);
  if (!user) return;
  try {
    const id = Number(req.params['id']);
    const b = req.body || {};
    const code = String(b.code || '').trim().toUpperCase();
    const discountType = String(b.discountType || 'percentage');
    const discountValue = Number(b.discountValue);
    if (!code || !['percentage', 'fixed'].includes(discountType) || !Number.isFinite(discountValue) || discountValue <= 0) {
      res.status(400).json({ success: false, error: 'Code, discountType and a positive discountValue are required' });
      return;
    }
    const rows = await query<any>(
      `UPDATE coupons SET code = $1, description = $2, discount_type = $3, discount_value = $4,
              min_subtotal = $5, valid_from = $6, valid_until = $7, is_active = $8, max_uses = $9
       WHERE coupon_id = $10
       RETURNING coupon_id AS id, code, description, discount_type AS "discountType",
                 discount_value::float8 AS "discountValue", min_subtotal::float8 AS "minSubtotal",
                 valid_from AS "validFrom", valid_until AS "validUntil", is_active AS "isActive", max_uses AS "maxUses"`,
      [code, String(b.description || '').trim() || null, discountType, discountValue,
       Number(b.minSubtotal) || 0, b.validFrom || null, b.validUntil || null,
       b.isActive !== false, Number(b.maxUses) || null, id]
    );
    if (!rows.length) {
      res.status(404).json({ success: false, error: 'Coupon not found' });
      return;
    }
    res.json({ success: true, data: rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to update coupon' });
  }
});

adminRouter.delete('/api/admin/coupons/:id', async (req: Request, res: Response) => {
  const user = requireAdmin(req, res);
  if (!user) return;
  try {
    const id = Number(req.params['id']);
    const rows = await query(`DELETE FROM coupons WHERE coupon_id = $1 RETURNING coupon_id`, [id]);
    if (!rows.length) {
      res.status(404).json({ success: false, error: 'Coupon not found' });
      return;
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to delete coupon' });
  }
});

// ===== Admin: Discount CRUD =====

adminRouter.post('/api/admin/discounts', async (req: Request, res: Response) => {
  const user = requireAdmin(req, res);
  if (!user) return;
  try {
    const b = req.body || {};
    const scope = String(b.scope || 'product');
    const discountType = String(b.discountType || 'percentage');
    const discountValue = Number(b.discountValue);
    if (!['product', 'category', 'subcategory'].includes(scope) || !['percentage', 'fixed'].includes(discountType) || !Number.isFinite(discountValue) || discountValue <= 0) {
      res.status(400).json({ success: false, error: 'Valid scope, discountType and positive discountValue are required' });
      return;
    }
    const rows = await query<any>(
      `INSERT INTO discounts (scope, discount_type, discount_value, product_id, category_id, sub_category_id, valid_from, valid_until, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING discount_id AS id, scope, discount_type AS "discountType", discount_value::float8 AS "discountValue",
                 valid_from AS "validFrom", valid_until AS "validUntil", is_active AS "isActive"`,
      [scope, discountType, discountValue, b.productId || null, b.categoryId || null, b.subCategoryId || null,
       b.validFrom || null, b.validUntil || null, b.isActive !== false]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to create discount' });
  }
});

adminRouter.put('/api/admin/discounts/:id', async (req: Request, res: Response) => {
  const user = requireAdmin(req, res);
  if (!user) return;
  try {
    const id = Number(req.params['id']);
    const b = req.body || {};
    const scope = String(b.scope || 'product');
    const discountType = String(b.discountType || 'percentage');
    const discountValue = Number(b.discountValue);
    if (!['product', 'category', 'subcategory'].includes(scope) || !['percentage', 'fixed'].includes(discountType) || !Number.isFinite(discountValue) || discountValue <= 0) {
      res.status(400).json({ success: false, error: 'Valid scope, discountType and positive discountValue are required' });
      return;
    }
    const rows = await query<any>(
      `UPDATE discounts SET scope = $1, discount_type = $2, discount_value = $3,
              product_id = $4, category_id = $5, sub_category_id = $6,
              valid_from = $7, valid_until = $8, is_active = $9
       WHERE discount_id = $10
       RETURNING discount_id AS id, scope, discount_type AS "discountType", discount_value::float8 AS "discountValue",
                 valid_from AS "validFrom", valid_until AS "validUntil", is_active AS "isActive"`,
      [scope, discountType, discountValue, b.productId || null, b.categoryId || null, b.subCategoryId || null,
       b.validFrom || null, b.validUntil || null, b.isActive !== false, id]
    );
    if (!rows.length) {
      res.status(404).json({ success: false, error: 'Discount not found' });
      return;
    }
    res.json({ success: true, data: rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to update discount' });
  }
});

adminRouter.delete('/api/admin/discounts/:id', async (req: Request, res: Response) => {
  const user = requireAdmin(req, res);
  if (!user) return;
  try {
    const id = Number(req.params['id']);
    const rows = await query(`DELETE FROM discounts WHERE discount_id = $1 RETURNING discount_id`, [id]);
    if (!rows.length) {
      res.status(404).json({ success: false, error: 'Discount not found' });
      return;
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to delete discount' });
  }
});

// ===== Admin: Category/Subcategory Delete =====

adminRouter.delete('/api/admin/categories/:id', async (req: Request, res: Response) => {
  const user = requireAdmin(req, res);
  if (!user) return;
  try {
    const id = Number(req.params['id']);
    const rows = await query(`DELETE FROM categories WHERE category_id = $1 RETURNING category_id`, [id]);
    if (!rows.length) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to delete category' });
  }
});

adminRouter.delete('/api/admin/subcategories/:id', async (req: Request, res: Response) => {
  const user = requireAdmin(req, res);
  if (!user) return;
  try {
    const id = Number(req.params['id']);
    const rows = await query(`DELETE FROM subcategories WHERE sub_category_id = $1 RETURNING sub_category_id`, [id]);
    if (!rows.length) {
      res.status(404).json({ success: false, error: 'Subcategory not found' });
      return;
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to delete subcategory' });
  }
});
