import type { Request, Response } from 'express';
import { syncAll } from '../jobs/syncAll.js';
import { HttpError, requireManagementAuth } from './_authz.js';
import { getValidatedShopDomain } from './_validation.js';

export const manualSync = async (req: Request, res: Response) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  try {
    await requireManagementAuth(req);
    const shopDomain = getValidatedShopDomain(req);
    const result = await syncAll(shopDomain);
    res.status(202).json(result);
  } catch (error) {
    if (error instanceof HttpError) {
      res.status(error.status).json({ error: error.code });
      return;
    }

    res.status(502).json({ error: 'upstream_error' });
  }
};
