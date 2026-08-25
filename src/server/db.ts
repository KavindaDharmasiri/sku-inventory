import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Load npm packages at runtime (outside the bundler) so they work identically
// in `ng serve` (Vite), the production server (esbuild), and Vercel serverless.
// Using process.cwd() ensures node_modules is found regardless of where the
// bundled output file lives (e.g. dist/skuvo/server/server.mjs).
const require_ = createRequire(join(process.cwd(), 'package.json'));

// Minimal .env loader (no dependency on dotenv at runtime).
function loadEnv(): void {
  const candidates = [
    join(process.cwd(), '.env'),
    join(import.meta.dirname, '../../.env'),
  ];
  for (const path of candidates) {
    try {
      const raw = readFileSync(path, 'utf8');
      for (const line of raw.split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
        if (!m) continue;
        let value = m[2];
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (!(m[1] in process.env)) process.env[m[1]] = value;
      }
      break;
    } catch {
      // try next candidate
    }
  }
}
loadEnv();

type PgPool = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: any[] }>;
};

let pool: PgPool | null = null;

export function getPool(): PgPool {
  if (pool) return pool;
  if (!process.env['DATABASE_URL']) {
    throw new Error('DATABASE_URL environment variable is not set (.env file missing?)');
  }
  const { Pool: PgPoolCtor } = require_('pg');
  pool = new PgPoolCtor({
    connectionString: process.env['DATABASE_URL'],
    ssl: { rejectUnauthorized: false },
    max: 5,
    connectionTimeoutMillis: 15000,
  });
  return pool as PgPool;
}

export function query<T = any>(text: string, params: unknown[] = []): Promise<T[]> {
  return getPool().query(text, params).then((r) => r.rows as T[]);
}

export interface ProductRow {
  id: number;
  prodName: string;
  prodSubtitle?: string | null;
  description?: string | null;
  prodImg: string;
  prodPrice: number;
  categoryId: number;
  subCategoryId?: number | null;
  sku?: string | null;
  createdAt?: string;
  stock: number;
  discountValue?: number | null;
  discountType?: string | null;
}

export const PRODUCT_SELECT = `
  SELECT
    p.product_id                          AS "id",
    p.prod_name                           AS "prodName",
    p.prod_subtitle                       AS "prodSubtitle",
    p.prod_description                    AS "description",
    p.prod_img                            AS "prodImg",
    p.prod_price::float8                  AS "prodPrice",
    p.category_id                         AS "categoryId",
    p.sub_category_id                     AS "subCategoryId",
    p.base_sku                            AS "sku",
    p.created_at                          AS "createdAt",
    COALESCE(st.total_stock, 0)           AS "stock",
    d.discount_value::float8              AS "discountValue",
    d.discount_type                       AS "discountType"
  FROM products p
  LEFT JOIN (
    SELECT product_id, SUM(stock) AS total_stock
    FROM product_skus     WHERE is_active
    GROUP BY product_id
  ) st ON st.product_id = p.product_id
  LEFT JOIN LATERAL (
    SELECT discount_value, discount_type
    FROM discounts
    WHERE is_active
      AND (valid_from IS NULL OR valid_from <= NOW())
      AND (valid_until IS NULL OR valid_until >= NOW())
      AND (
        (scope = 'product'      AND product_id      = p.product_id)
     OR (scope = 'category'     AND category_id     = p.category_id)
     OR (scope = 'subcategory'  AND sub_category_id = p.sub_category_id)
      )
    ORDER BY discount_value DESC
    LIMIT 1
  ) d ON TRUE
`;

export function mapProduct(row: ProductRow) {
  const price = Number(row.prodPrice) || 0;
  let salePrice: number | null = null;
  if (row.discountValue != null && row.discountType) {
    salePrice =
      row.discountType === 'percentage'
        ? Math.round(price * (1 - row.discountValue / 100) * 100) / 100
        : Math.round((price - row.discountValue) * 100) / 100;
    if (salePrice <= 0 || salePrice >= price) salePrice = null;
  }
  return {
    id: row.id,
    prodName: row.prodName,
    prodSubtitle: row.prodSubtitle ?? '',
    description: row.description ?? '',
    prodImg: row.prodImg,
    prodPrice: price,
    categoryId: row.categoryId,
    subCategoryId: row.subCategoryId ?? null,
    sku: row.sku ?? '',
    createdAt: row.createdAt,
    stock: Number(row.stock) || 0,
    isOnSale: salePrice != null,
    salePrice: salePrice ?? undefined,
    originalPrice: salePrice != null ? price : undefined,
    discountPercent:
      salePrice != null && price > 0
        ? Math.round((1 - salePrice / price) * 100)
        : undefined,
  };
}
