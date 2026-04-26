import { createHmac } from 'crypto';
import type { Merchant } from '@/types';

const API_BASE = 'https://api.pub1.passkit.io';
const PASS_BASE = 'https://pub1.pskt.io';

function makeJWT(): string {
  const key = process.env.PASSKIT_KEY ?? process.env.PASSKIT_API_KEY ?? '';
  const secret = process.env.PASSKIT_SECRET ?? '';

  // If no secret, fall back to treating key as a raw Bearer token
  if (!secret) {
    return key;
  }

  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ uid: key, iat: now, exp: now + 3600 })).toString('base64url');

  // PassKit secrets are base64-encoded binary
  const secretBytes = Buffer.from(secret, 'base64');
  const sig = createHmac('sha256', secretBytes)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${sig}`;
}

function headers() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${makeJWT()}`,
  };
}

export async function createLoyaltyPass(
  membershipId: string,
  merchant: Merchant,
  customerName?: string,
  customerPhone?: string
): Promise<{ passId: string; passUrl: string }> {
  const body: Record<string, unknown> = {
    programId: process.env.PASSKIT_PROGRAM_ID,
    tierId: process.env.PASSKIT_TIER_ID ?? 'base',
    externalId: membershipId,
    points: 0,
    secondaryPoints: merchant.stampTarget,
  };

  if (customerName || customerPhone) {
    const parts = (customerName ?? '').trim().split(' ');
    body.person = {
      displayName: customerName || undefined,
      forename: parts[0] || undefined,
      surname: parts.slice(1).join(' ') || undefined,
      mobileNumber: customerPhone || undefined,
    };
  }

  const res = await fetch(`${API_BASE}/members/member`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PassKit createPass ${res.status}: ${err}`);
  }

  const data = await res.json();
  const passId: string = data.id ?? data.passId ?? membershipId;
  const passUrl = `${PASS_BASE}/${passId}`;

  return { passId, passUrl };
}

export async function updateLoyaltyPass(
  externalId: string,
  stamps: number,
  stampTarget: number,
  rewardName: string
): Promise<void> {
  const body: Record<string, unknown> = {
    programId: process.env.PASSKIT_PROGRAM_ID,
    externalId,
    points: stamps,
    secondaryPoints: stampTarget,
  };

  if (stamps === 0) {
    body.metaData = { lastReward: rewardName };
  }

  const res = await fetch(`${API_BASE}/members/member`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PassKit updatePass ${res.status}: ${err}`);
  }
}
