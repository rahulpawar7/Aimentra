import { Request, Response } from 'express';
import CMSContent from '../models/CMSContent';
import { AuditLog } from '../models';
import { DEFAULT_BLOCKS } from '../config/cms-defaults';

export { DEFAULT_BLOCKS };

/** Merge DB CMS block with defaults — empty strings/null use default values */
function mergeBlockWithDefaults(key: string, dbValue: unknown): unknown {
  const defaults = DEFAULT_BLOCKS[key];
  if (!defaults) return dbValue;
  if (!dbValue || typeof dbValue !== 'object') return { ...defaults };
  const merged = { ...defaults, ...(dbValue as Record<string, unknown>) };
  for (const [field, defaultVal] of Object.entries(defaults)) {
    const current = merged[field];
    if (current === '' || current === null || current === undefined) {
      merged[field] = defaultVal;
    }
  }
  return merged;
}

export const getPublicCMS = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    if (key) {
      const normalized = key.toLowerCase();
      let doc = await CMSContent.findOne({ key: normalized });
      if (!doc && DEFAULT_BLOCKS[normalized]) {
        try {
          doc = await CMSContent.create({ key: normalized, jsonValue: DEFAULT_BLOCKS[normalized] });
        } catch {
          doc = await CMSContent.findOne({ key: normalized });
        }
      }
      const jsonValue = mergeBlockWithDefaults(normalized, doc?.jsonValue ?? DEFAULT_BLOCKS[normalized]);
      if (!jsonValue) {
        return res.status(404).json({ success: false, error: { message: 'CMS block not found' } });
      }
      return res.json({ success: true, data: { key: normalized, jsonValue } });
    }

    const all = await CMSContent.find().select('key jsonValue updatedAt');
    const map: Record<string, unknown> = {};
    for (const doc of all) map[doc.key] = mergeBlockWithDefaults(doc.key, doc.jsonValue);

    // Ensure defaults exist for core keys
    for (const [k, v] of Object.entries(DEFAULT_BLOCKS)) {
      if (!map[k]) map[k] = v;
    }

    res.json({ success: true, data: map });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const upsertCMS = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { jsonValue } = req.body;
    if (!key || jsonValue === undefined) {
      return res.status(400).json({ success: false, error: { message: 'key and jsonValue required' } });
    }

    const doc = await CMSContent.findOneAndUpdate(
      { key: key.toLowerCase() },
      { jsonValue, updatedBy: req.user?.id },
      { upsert: true, new: true }
    );

    await AuditLog.create({
      actor: req.user?.id,
      actorRole: req.user?.role || 'admin',
      actorEmail: req.user?.email || '',
      action: 'cms.update',
      resourceType: 'CMSContent',
      resourceId: doc._id.toString(),
      newValue: { key: doc.key },
      ip: req.ip || '127.0.0.1',
      userAgent: String(req.headers['user-agent'] || 'unknown'),
    }).catch(() => undefined);

    res.json({ success: true, data: doc });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const listCMS = async (_req: Request, res: Response) => {
  try {
    const docs = await CMSContent.find().sort({ key: 1 });
    res.json({ success: true, data: docs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};
