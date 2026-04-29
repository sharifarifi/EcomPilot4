import type { Request } from 'express';
import { HttpError } from './_authz.js';
import { isValidShopDomain, normalizeShopDomain } from '../shopify/shopifyAuth.js';

export const getValidatedShopDomain = (req: Request) => {
  const rawShop = String(req.query.shop || req.body?.shop || '').trim();
  if (!rawShop) {
    throw new HttpError(400, 'invalid_input', 'Missing shop domain.');
  }

  const shopDomain = normalizeShopDomain(rawShop);
  if (!isValidShopDomain(shopDomain)) {
    throw new HttpError(400, 'invalid_input', 'Invalid shop domain.');
  }

  return shopDomain;
};

