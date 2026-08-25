import { Router, type Request, type Response } from 'express';
import { query, mapProduct, PRODUCT_SELECT, type ProductRow } from '../db';

export const catalogRouter = Router();

catalogRouter.get('/api/products', async (_req: Request, res: Response) => {
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
