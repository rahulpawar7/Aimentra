import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import Lesson from '../models/Lesson';
import VideoAsset from '../models/VideoAsset';
import VideoTokenService from '../services/video-token.service';
import EntitlementService from '../services/entitlement.service';

/**
 * Issues a short-lived signed stream token after auth + entitlement check.
 * Manifest/segment URLs are never static playable file links.
 */
export const issueStreamToken = async (req: Request, res: Response) => {
  try {
    const lessonId = req.params.lessonId || req.params.id;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ success: false, error: { message: 'Lesson not found' } });
    }

    const isPreview = lesson.isPreview || lesson.isFree;
    if (!isPreview) {
      const allowed = await EntitlementService.hasAccessToCourse(userId, lesson.courseId.toString());
      if (!allowed && req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          error: { code: 'PLAN_REQUIRED', message: 'Plan entitlement required' },
        });
      }
    }

    const asset = lesson.videoPublicId
      ? await VideoAsset.findById(lesson.videoPublicId)
      : await VideoAsset.findOne({ lessonId: lesson._id, status: 'ready' });

    const sessionId = (req.headers['x-session-id'] as string) || `sess_${userId}`;
    const token = VideoTokenService.issue({
      userId,
      lessonId: lesson._id.toString(),
      courseId: lesson.courseId.toString(),
      assetId: asset?._id?.toString(),
      sessionId,
      ip: req.ip,
    });

    const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

    res.json({
      success: true,
      data: {
        token,
        expiresIn: VideoTokenService.getTtlSeconds(),
        manifestUrl: `${baseUrl}/api/v1/stream/manifest/${lesson._id}?token=${token}`,
        // Fallback for lessons still on Cloudinary progressive MP4 (pre-HLS migration)
        progressiveUrl: asset?.status !== 'ready' ? lesson.videoUrl : undefined,
        watermark: {
          text: `${req.user?.email || userId} · ${new Date().toISOString()}`,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const getManifest = async (req: Request, res: Response) => {
  try {
    const { lessonId } = req.params;
    const token = (req.query.token as string) || '';
    const result = VideoTokenService.validate(token, { ip: req.ip });
    if (!result.valid || result.payload?.lessonId !== lessonId) {
      return res.status(403).json({ success: false, error: { message: 'Invalid or expired stream token' } });
    }

    // Origin / referrer lock (deterrent)
    const origin = req.headers.origin || '';
    const referer = req.headers.referer || '';
    const allowed = process.env.FRONTEND_URL || 'http://localhost:3000';
    if (origin && !origin.startsWith(allowed) && process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, error: { message: 'Origin not allowed' } });
    }
    if (referer && !String(referer).startsWith(allowed) && process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, error: { message: 'Referer not allowed' } });
    }

    const asset = result.payload.assetId
      ? await VideoAsset.findById(result.payload.assetId)
      : await VideoAsset.findOne({ lessonId, status: 'ready' });

    const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

    // If HLS not ready yet, return a minimal placeholder manifest pointing at key endpoint
    // Real ffmpeg output would rewrite segment URLs to signed token endpoints.
    if (!asset?.hlsManifestPath || !fs.existsSync(asset.hlsManifestPath)) {
      const lesson = await Lesson.findById(lessonId);
      // Issue fresh segment-capable token for key endpoint
      const keyToken = VideoTokenService.issue({
        userId: result.payload.userId,
        lessonId,
        courseId: result.payload.courseId,
        assetId: asset?._id?.toString(),
        sessionId: result.payload.sessionId,
        ip: req.ip,
        ttlSeconds: 60,
      });

      // Progressive fallback note — client should use progressiveUrl from stream-token
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'no-store');
      return res.status(404).send('#EXTM3U\n# HLS not ready — use progressiveUrl from stream-token response\n');
    }

    let manifest = fs.readFileSync(asset.hlsManifestPath, 'utf8');
    const segToken = VideoTokenService.issue({
      userId: result.payload.userId,
      lessonId,
      courseId: result.payload.courseId,
      assetId: asset._id.toString(),
      sessionId: result.payload.sessionId,
      ip: req.ip,
      ttlSeconds: 60,
    });

    // Rewrite relative segment lines to signed proxy URLs
    manifest = manifest
      .split('\n')
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
          if (trimmed.startsWith('#EXT-X-KEY:')) {
            return `#EXT-X-KEY:METHOD=AES-128,URI="${baseUrl}/api/v1/stream/key/${lessonId}?token=${segToken}"`;
          }
          return line;
        }
        const name = path.basename(trimmed);
        return `${baseUrl}/api/v1/stream/segment/${lessonId}/${encodeURIComponent(name)}?token=${segToken}`;
      })
      .join('\n');

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Cache-Control', 'no-store');
    res.send(manifest);
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const getSegment = async (req: Request, res: Response) => {
  try {
    const { lessonId, segment } = req.params;
    const token = (req.query.token as string) || '';
    const result = VideoTokenService.validate(token, { consume: false, ip: req.ip });
    if (!result.valid || result.payload?.lessonId !== lessonId) {
      return res.status(403).json({ success: false, error: { message: 'Invalid segment token' } });
    }

    const asset = result.payload.assetId
      ? await VideoAsset.findById(result.payload.assetId)
      : await VideoAsset.findOne({ lessonId, status: 'ready' });

    if (!asset?.hlsManifestPath) {
      return res.status(404).json({ success: false, error: { message: 'Segment store not found' } });
    }

    const dir = path.dirname(asset.hlsManifestPath);
    const filePath = path.join(dir, path.basename(segment));
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: { message: 'Segment not found' } });
    }

    res.setHeader('Content-Type', 'video/MP2T');
    res.setHeader('Cache-Control', 'no-store');
    fs.createReadStream(filePath).pipe(res);
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const getEncryptionKey = async (req: Request, res: Response) => {
  try {
    const { lessonId } = req.params;
    const token = (req.query.token as string) || '';
    // Single-use key delivery
    const result = VideoTokenService.validate(token, { consume: true, ip: req.ip });
    if (!result.valid || result.payload?.lessonId !== lessonId) {
      return res.status(403).json({ success: false, error: { message: 'Invalid key token' } });
    }

    const asset = result.payload.assetId
      ? await VideoAsset.findById(result.payload.assetId)
      : await VideoAsset.findOne({ lessonId, status: 'ready' });

    if (!asset?.encryptionKeyId) {
      return res.status(404).json({ success: false, error: { message: 'Key not found' } });
    }

    const keyPath = path.join(process.cwd(), 'storage', 'keys', `${asset.encryptionKeyId}.key`);
    if (!fs.existsSync(keyPath)) {
      return res.status(404).json({ success: false, error: { message: 'Key file missing' } });
    }

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    fs.createReadStream(keyPath).pipe(res);
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};
