import type { Request, Response } from 'express';
import { syncAll } from '../jobs/syncAll.js';

export const manualSync = async (req: Request, res: Response) => {
  const shopDomain = String(req.query.shop || req.body?.shop || '').trim();

  if (!shopDomain) {
    res.status(400).json({ error: 'Missing shop domain.' });
    return;
  }

  const result = await syncAll(shopDomain);
  res.status(202).json(result);
};
