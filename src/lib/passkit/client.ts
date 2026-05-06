import { createHmac } from 'crypto';
import type { Merchant } from '@/types';

const API_BASE = 'https://api.pub1.passkit.io';
const PASS_BASE = 'https://pub1.pskt.io';

export function getPassKitPassUrl(passId: string): string {
  return `${PASS_BASE}/${passId}`;
}

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

function stampImageIds(stamps: number, images?: Array<{ strip: string; hero: string } | null>): { strip: string; hero: string } | null {
  return images?.[stamps] ?? null;
}

function configuredValue(value: string | undefined, fallback: string | undefined): string | undefined {
  return value?.trim() || fallback?.trim() || undefined;
}

export async function createLoyaltyPass(
  membershipId: string,
  merchant: Merchant,
  customerName?: string,
  customerPhone?: string
): Promise<{ passId: string; passUrl: string }> {
  const programId = configuredValue(merchant.passkitProgramId, process.env.PASSKIT_PROGRAM_ID);
  const tierId = configuredValue(merchant.passkitTierId, process.env.PASSKIT_TIER_ID) ?? '222';

  if (!programId) throw new Error('No PassKit program ID configured for this merchant');

  const body: Record<string, unknown> = {
    programId,
    tierId,
    externalId: membershipId,
    points: 0,
    person: {
      forename: customerName || undefined,
      mobileNumber: customerPhone || undefined,
    },
    metaData: {
      customerName: customerName || '',
      stampProgress: `0/${merchant.stampTarget}`,
      remainingStamps: String(merchant.stampTarget),
      programInfo: merchant.merchantInfo || '',
    },
  };

  const imgIds = stampImageIds(0, merchant.passkitStampImages);
  if (imgIds) {
    body.passOverrides = { imageIds: { strip: imgIds.strip, hero: imgIds.hero } };
  }

  const res = await fetch(`${API_BASE}/members/member`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PassKit create member ${res.status}: ${err}`);
  }

  const data = await res.json();
  const passId: string = data.id ?? data.passId ?? membershipId;
  return { passId, passUrl: getPassKitPassUrl(passId) };
}

export async function updateLoyaltyPass(
  externalId: string,
  stamps: number,
  stampTarget: number,
  customerName?: string,
  passkitProgramId?: string,
  stampImages?: Array<{ strip: string; hero: string } | null>,
  merchantInfo?: string
): Promise<void> {
  const remaining = stampTarget - stamps;
  const programId = configuredValue(passkitProgramId, process.env.PASSKIT_PROGRAM_ID);

  const body: Record<string, unknown> = {
    programId,
    externalId,
    points: stamps,
    person: {
      forename: customerName || undefined,
    },
    metaData: {
      customerName: customerName || '',
      stampProgress: `${stamps}/${stampTarget}`,
      remainingStamps: String(remaining),
      programInfo: merchantInfo || '',
    },
  };

  if (!programId) throw new Error('No PassKit program ID configured for pass update');

  const imgIds = stampImageIds(stamps, stampImages);
  if (imgIds) {
    body.passOverrides = { imageIds: { strip: imgIds.strip, hero: imgIds.hero } };
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

export async function getPassKitProgramInfo(programId: string): Promise<{
  name?: string;
  brandColor?: string;
  logoUrl?: string;
} | null> {
  try {
    const res = await fetch(`${API_BASE}/loyalties/loyaltyProgram/${programId}`, {
      method: 'GET',
      headers: headers(),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    // Extract name; color + logo field paths need verification from PassKit response
    const name: string | undefined = data.name ?? data.localizedName?.defaultValue ?? undefined;
    const brandColor: string | undefined = data.colors?.backgroundColor ?? undefined;
    const logoUrl: string | undefined = undefined; // set once PassKit image CDN URL pattern is confirmed
    return { name, brandColor, logoUrl };
  } catch {
    return null;
  }
}

export async function uploadPassKitImage(base64: string, name: string): Promise<{ strip: string; hero: string }> {
  const res = await fetch(`${API_BASE}/images`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      name,
      imageData: {
        strip: base64,
        hero: base64,
      },
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`PassKit image upload failed ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const stripId: string = data.strip;
  const heroId: string = data.hero;
  if (!stripId || !heroId) throw new Error(`PassKit image upload missing IDs: ${JSON.stringify(data)}`);
  return { strip: stripId, hero: heroId };
}
