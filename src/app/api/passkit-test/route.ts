export const runtime = 'nodejs';

import { createHmac } from 'crypto';
import { NextResponse } from 'next/server';

function makeJWT(key: string, secret: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ uid: key, iat: now, exp: now + 3600 })).toString('base64url');
  const secretBytes = Buffer.from(secret, 'base64');
  const sig = createHmac('sha256', secretBytes).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

export async function GET() {
  const key = process.env.PASSKIT_KEY ?? '';
  const secret = process.env.PASSKIT_SECRET ?? '';
  const oldToken = process.env.PASSKIT_API_KEY ?? '';
  const programId = process.env.PASSKIT_PROGRAM_ID ?? '';

  const results: Record<string, unknown> = {
    keySet: !!key,
    secretSet: !!secret,
    oldTokenSet: !!oldToken,
    programId,
  };

  const base = 'https://api.pub1.passkit.io';
  const jwt = key && secret ? makeJWT(key, secret) : oldToken;
  const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` };

  results['jwt_preview'] = jwt.slice(0, 60) + '...';

  // Test enrol with new JWT
  try {
    const r = await fetch(`${base}/members/member`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        programId,
        tierId: 'base',
        externalId: `test_${Date.now()}`,
        points: 0,
        person: { displayName: 'Test User' },
      }),
      signal: AbortSignal.timeout(10000),
    });
    const text = await r.text();
    results['enrol'] = { status: r.status, body: text };
  } catch (err) {
    results['enrol'] = { error: String(err) };
  }

  return NextResponse.json(results, { status: 200 });
}
