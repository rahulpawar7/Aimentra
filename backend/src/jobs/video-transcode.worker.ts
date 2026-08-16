/**
 * Video transcode worker (ffmpeg HLS + AES-128)
 *
 * Build order (Phase 5):
 * 1. Admin uploads raw mp4 → VideoAsset status=uploading
 * 2. This worker transcodes to 360/480/720/1080 HLS with AES-128
 * 3. Segments stored privately under storage/hls/{assetId}/
 * 4. Manifest + key paths saved on VideoAsset; status=ready
 *
 * Requires ffmpeg on PATH. Free/open-source — no cloud DRM vendor needed.
 * Swap later for Cloudflare Stream / Bunny by replacing this worker only.
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import VideoAsset from '../models/VideoAsset';

const STORAGE = path.join(process.cwd(), 'storage', 'hls');
const KEYS = path.join(process.cwd(), 'storage', 'keys');

function ensureDirs() {
  fs.mkdirSync(STORAGE, { recursive: true });
  fs.mkdirSync(KEYS, { recursive: true });
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args, { stdio: 'inherit' });
    proc.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`))));
  });
}

export async function transcodeVideoAsset(assetId: string, inputPath: string) {
  ensureDirs();
  const asset = await VideoAsset.findById(assetId);
  if (!asset) throw new Error('VideoAsset not found');

  asset.status = 'processing';
  await asset.save();

  try {
    const outDir = path.join(STORAGE, assetId);
    fs.mkdirSync(outDir, { recursive: true });

    const keyId = crypto.randomBytes(8).toString('hex');
    const keyBytes = crypto.randomBytes(16);
    const keyPath = path.join(KEYS, `${keyId}.key`);
    fs.writeFileSync(keyPath, keyBytes);

    const keyInfoPath = path.join(outDir, 'keyinfo.txt');
    // URI is rewritten at serve-time by stream controller; placeholder for ffmpeg
    fs.writeFileSync(keyInfoPath, `key.key\n${keyPath}\n${crypto.randomBytes(16).toString('hex')}\n`);

    // Single 720p AES-128 HLS rendition for MVP (extend to multi-bitrate ladder as needed)
    const manifestPath = path.join(outDir, 'index.m3u8');
    await runFfmpeg([
      '-y',
      '-i',
      inputPath,
      '-c:v',
      'libx264',
      '-c:a',
      'aac',
      '-hls_time',
      '6',
      '-hls_list_size',
      '0',
      '-hls_key_info_file',
      keyInfoPath,
      '-hls_playlist_type',
      'vod',
      '-f',
      'hls',
      manifestPath,
    ]);

    asset.status = 'ready';
    asset.hlsManifestPath = manifestPath;
    asset.encryptionKeyId = keyId;
    asset.renditions = [{ quality: '720p', bandwidth: 2500000, path: manifestPath }];
    asset.processedAt = new Date();
    await asset.save();
    return asset;
  } catch (err: any) {
    asset.status = 'failed';
    asset.errorMessage = err.message;
    await asset.save();
    throw err;
  }
}
