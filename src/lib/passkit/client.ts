import { createHmac } from 'crypto';
import type { Merchant } from '@/types';

const API_BASE = 'https://api.pub1.passkit.io';
const PASS_BASE = 'https://pub1.pskt.io';

function makeJWT(): string {
  const key = process.env.PASSKIT_KEY ?? process.env.PASSKIT_API_KEY ?? '';
  const secret = process.env.PASSKIT_SECRET ?? '';
  if (!secret) return key;

  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ uid: key, iat: now, exp: now + 3600 })).toString('base64url');
  const secretBytes = Buffer.from(secret, 'base64');
  const sig = createHmac('sha256', secretBytes).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

function headers() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${makeJWT()}`,
  };
}

// Returns the PassKit image ID for a given stamp count.
// Set PASSKIT_STAMP_IMAGES env var as a JSON array:
//   ["imageId_0", "imageId_1", "imageId_2", ... "imageId_N"]
// index 0 = 0 stamps, index 1 = 1 stamp, etc.
function getStampImageId(stamps: number): string | null {
  const raw = process.env.PASSKIT_STAMP_IMAGES;
  if (!raw) return null;
  try {
    const ids: string[] = JSON.parse(raw);
    return ids[stamps] ?? null;
  } catch {
    return null;
  }
}

export async function createLoyaltyPass(
  membershipId: string,
  merchant: Merchant,
  customerName?: string,
  customerPhone?: string
): Promise<{ passId: string; passUrl: string }> {
  const remaining = merchant.stampTarget; // starts at 0 stamps → all remaining

  const body: Record<string, unknown> = {
    programId: process.env.PASSKIT_PROGRAM_ID,
    tierId: process.env.PASSKIT_TIER_ID ?? 'base',
    externalId: membershipId,
    // points = current stamp count
    points: 0,
    // person.displayName = remaining stamps to reward (as int string)
    person: {
      displayName: String(remaining),
      ...(customerName ? (() => {
        const parts = customerName.trim().split(' ');
        return {
          forename: parts[0] || undefined,
          surname: parts.slice(1).join(' ') || undefined,
        };
      })() : {}),
      ...(customerPhone ? { mobileNumber: customerPhone } : {}),
    },
    // metaData: customer name + stamp progress text
    metaData: {
      customerName: customerName || 'Member',
      stampProgress: `0 / ${merchant.stampTarget}`,
      reward: merchant.rewardName,
      store: merchant.name,
    },
  };

  // Attach stamp progress image if configured
  const imageId = getStampImageId(0);
  if (imageId) {
    body.passOverrides = {
      imageIds: { strip: imageId, hero: imageId },
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
  return { passId, passUrl: `${PASS_BASE}/${passId}` };
}

export async function updateLoyaltyPass(
  externalId: string,
  stamps: number,
  stampTarget: number,
  rewardName: string,
  customerName?: string
): Promise<void> {
  const remaining = stampTarget - stamps;
  const rewardUnlocked = stamps === 0 && remaining === stampTarget;

  const body: Record<string, unknown> = {
    programId: process.env.PASSKIT_PROGRAM_ID,
    externalId,
    // members.member.points = current stamp count
    points: stamps,
    // person.displayName = remaining stamps to reward (int), or 0 when reward unlocked
    person: {
      displayName: rewardUnlocked ? '0' : String(remaining),
      ...(customerName ? (() => {
        const parts = customerName.trim().split(' ');
        return {
          forename: parts[0] || undefined,
          surname: parts.slice(1).join(' ') || undefined,
        };
      })() : {}),
    },
    metaData: {
      ...(customerName ? { customerName } : {}),
      stampProgress: `${stamps} / ${stampTarget}`,
      reward: rewardName,
      status: rewardUnlocked
        ? `Reward unlocked: ${rewardName}!`
        : `${remaining} more visit${remaining === 1 ? '' : 's'} for ${rewardName}`,
    },
  };

  // Update stamp progress image
  const imageId = getStampImageId(stamps);
  if (imageId) {
    body.passOverrides = {
      imageIds: { strip: imageId, hero: imageId },
    };
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

// Upload a single image (base64 PNG/JPG) to PassKit and return its image ID.
// Use this to populate PASSKIT_STAMP_IMAGES env var.
export async function uploadPassKitImage(base64Data: string, name: string): Promise<string> {
  const res = await fetch(`${API_BASE}/images`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ imageData: base64Data, name }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`PassKit image upload failed: ${await res.text()}`);
  const data = await res.json();
  return data.id ?? data.imageId;
}
