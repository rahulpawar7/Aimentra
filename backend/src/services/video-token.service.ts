import crypto from 'crypto';

const VIDEO_TOKEN_SECRET = process.env.VIDEO_TOKEN_SECRET || process.env.JWT_ACCESS_SECRET || 'video_token_secret';
const TOKEN_TTL_SECONDS = parseInt(process.env.VIDEO_TOKEN_TTL_SECONDS || '45', 10);

export interface StreamTokenPayload {
  userId: string;
  lessonId: string;
  courseId: string;
  assetId?: string;
  sessionId: string;
  ip?: string;
  exp: number;
  jti: string;
  used?: boolean;
}

const usedTokens = new Map<string, number>();

setInterval(() => {
  const now = Math.floor(Date.now() / 1000);
  for (const [jti, exp] of usedTokens.entries()) {
    if (exp < now) usedTokens.delete(jti);
  }
}, 60_000).unref?.();

function sign(payload: Omit<StreamTokenPayload, 'exp' | 'jti'> & { exp?: number; jti?: string }): string {
  const full: StreamTokenPayload = {
    ...payload,
    exp: payload.exp || Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
    jti: payload.jti || crypto.randomBytes(16).toString('hex'),
  };
  const body = Buffer.from(JSON.stringify(full)).toString('base64url');
  const sig = crypto.createHmac('sha256', VIDEO_TOKEN_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verify(token: string): StreamTokenPayload | null {
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', VIDEO_TOKEN_SECRET).update(body).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as StreamTokenPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export class VideoTokenService {
  issue(params: {
    userId: string;
    lessonId: string;
    courseId: string;
    assetId?: string;
    sessionId: string;
    ip?: string;
    ttlSeconds?: number;
  }) {
    return sign({
      userId: params.userId,
      lessonId: params.lessonId,
      courseId: params.courseId,
      assetId: params.assetId,
      sessionId: params.sessionId,
      ip: params.ip,
      exp: Math.floor(Date.now() / 1000) + (params.ttlSeconds || TOKEN_TTL_SECONDS),
    });
  }

  validate(token: string, opts?: { consume?: boolean; ip?: string; sessionId?: string }) {
    const payload = verify(token);
    if (!payload) return { valid: false as const, reason: 'invalid_or_expired' };

    if (opts?.sessionId && payload.sessionId !== opts.sessionId) {
      return { valid: false as const, reason: 'session_mismatch' };
    }

    if (opts?.ip && payload.ip && payload.ip !== opts.ip) {
      return { valid: false as const, reason: 'ip_mismatch' };
    }

    if (opts?.consume) {
      if (usedTokens.has(payload.jti)) {
        return { valid: false as const, reason: 'token_already_used' };
      }
      usedTokens.set(payload.jti, payload.exp);
    }

    return { valid: true as const, payload };
  }

  getTtlSeconds() {
    return TOKEN_TTL_SECONDS;
  }
}

export default new VideoTokenService();
