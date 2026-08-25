import { join } from 'node:path';

let cached: any = null;

async function getHandler() {
  if (cached) return cached;
  const mod = await import(join(process.cwd(), 'dist', 'skuvo', 'server', 'server.mjs'));
  cached = mod.reqHandler;
  return cached;
}

export default async function handler(req: any, res: any) {
  const h = await getHandler();
  return h(req, res);
}

export const config = {
  runtime: 'nodejs',
  maxDuration: 30,
};
