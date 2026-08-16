import { Request, Response } from 'express';
import { computePublicStats, resolveStatItems } from '../services/stats.service';
import CMSContent from '../models/CMSContent';

export const getPublicStats = async (_req: Request, res: Response) => {
  try {
    const stats = await computePublicStats();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

/** Returns CMS stat bar config with values resolved from live DB metrics */
export const getHomepageStats = async (_req: Request, res: Response) => {
  try {
    const [stats, cmsDoc] = await Promise.all([
      computePublicStats(),
      CMSContent.findOne({ key: 'stats' }),
    ]);

    const cmsItems = (cmsDoc?.jsonValue as any)?.items;
    const items = resolveStatItems(cmsItems, stats);

    res.json({ success: true, data: { stats, items } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};
