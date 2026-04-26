export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.PASSKIT_API_KEY;
  const programId = process.env.PASSKIT_PROGRAM_ID;

  const results: Record<string, unknown> = {
    apiKeySet: !!apiKey,
    programId,
  };

  const base = 'https://api.pub1.passkit.io';
  const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` };

  // Try enrol with tierId=base
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
    results['enrol with tierId=base'] = { status: r.status, body: text };
  } catch (err) {
    results['enrol with tierId=base'] = { error: String(err) };
  }

  return NextResponse.json(results, { status: 200 });
}
