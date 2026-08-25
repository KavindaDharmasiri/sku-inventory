import { Router, type Request, type Response } from 'express';
import { query, mapProduct, PRODUCT_SELECT, type ProductRow } from '../db';
import { requireUser } from '../middleware/auth';

export const catalogRouter = Router();

catalogRouter.get('/api/products', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Math.floor(Number(req.query['page']) || 1));
    const limit = Math.min(100, Math.max(1, Math.floor(Number(req.query['limit']) || 20)));
    const offset = (page - 1) * limit;
    const search = String(req.query['q'] || '').trim();
    const categoryId = Number(req.query['categoryId']) || null;
    const sortBy = String(req.query['sort'] || 'newest');

    let where = 'WHERE p.is_deleted = false AND p.status = \'ACTIVE\'';
    const params: any[] = [];
    let paramIdx = 1;

    if (search) {
      where += ` AND (p.prod_name ILIKE $${paramIdx} OR p.prod_subtitle ILIKE $${paramIdx} OR p.prod_description ILIKE $${paramIdx})`;
      params.push(`%${search}%`);
      paramIdx++;
    }
    if (categoryId) {
      where += ` AND p.category_id = $${paramIdx}`;
      params.push(categoryId);
      paramIdx++;
    }

    let orderBy = 'ORDER BY p.created_at DESC';
    if (sortBy === 'priceLow') orderBy = 'ORDER BY p.prod_price ASC';
    else if (sortBy === 'priceHigh') orderBy = 'ORDER BY p.prod_price DESC';

    const [countResult, rows] = await Promise.all([
      query<{ c: number }>(`SELECT COUNT(*)::int AS c FROM products p ${where}`, params),
      query<ProductRow>(
        `${PRODUCT_SELECT} ${where} ${orderBy} LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        [...params, limit, offset]
      ),
    ]);

    const total = countResult[0]?.c || 0;
    res.json({
      success: true,
      data: rows.map(mapProduct),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to load products' });
  }
});

catalogRouter.get('/api/products/featured', async (_req: Request, res: Response) => {
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

catalogRouter.get('/api/products/:id', async (req: Request, res: Response) => {
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

catalogRouter.get('/api/categories', async (_req: Request, res: Response) => {
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

catalogRouter.get('/api/ads', async (req: Request, res: Response) => {
  try {
    const position = String(req.query['position'] || 'home');
    const rows = await query<any>(
      `SELECT banner_id AS id, title, image_url AS "imageUrl", link_url AS link,
              position, is_active AS "isActive"
       FROM ad_banners WHERE is_active AND ($1 = '' OR position = $1)
       ORDER BY banner_id DESC`,
      [position]
    );
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to load ads' });
  }
});

catalogRouter.post('/api/products/:id/reviews', async (req: Request, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;
  try {
    const productId = Number(req.params['id']);
    if (!Number.isInteger(productId)) {
      res.status(400).json({ success: false, error: 'Invalid product id' });
      return;
    }
    const { rating, comment } = req.body || {};
    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      res.status(400).json({ success: false, error: 'Rating must be an integer between 1 and 5' });
      return;
    }
    const prod = await query(`SELECT 1 FROM products WHERE product_id = $1 AND is_deleted = false AND status = 'ACTIVE'`, [productId]);
    if (!prod.length) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }
    const rows = await query<any>(
      `INSERT INTO reviews (user_id, product_id, rating, comment, is_active, created_at)
       VALUES ($1, $2, $3, $4, true, NOW())
       RETURNING review_id AS id, rating, comment, created_at AS "createdAt"`,
      [user.userId, productId, ratingNum, String(comment || '').trim() || null]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to submit review' });
  }
});
