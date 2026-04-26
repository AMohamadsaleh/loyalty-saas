export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.PASSKIT_API_KEY;
  const programId = process.env.PASSKIT_PROGRAM_ID;

  const base = 'https://api.pub1.passkit.io';
  const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` };

  const results: Record<string, unknown> = { programId };

  // Test exact body that createLoyaltyPass sends
  const externalId = `diag_${Date.now()}`;
  try {
    const r = await fetch(`${base}/members/member`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        programId,
        tierId: process.env.PASSKIT_TIER_ID ?? 'base',
        externalId,
        points: 0,
        secondaryPoints: 6,
        metaData: {
          stampProgress: '0 / 6 stamps',
          reward: 'Free Coffee',
          store: 'Test Store',
        },
        person: { displayName: 'Diag User' },
      }),
      signal: AbortSignal.timeout(10000),
    });
    const text = await r.text();
    results['enrol'] = { status: r.status, body: text };

    // If enrol succeeded, check what the pass URL looks like
    if (r.ok) {
      const data = JSON.parse(text);
      results['passId'] = data.id;
      results['passUrl'] = `https://pub1.pskt.io/${data.id}`;
      results['appleUrl'] = `https://pub1.pskt.io/${data.id}.pkpass`;
      results['googleUrl'] = `https://pub1.pskt.io/${data.id}.gpay`;
    }
  } catch (err) {
    results['enrol'] = { error: String(err) };
  }

  return NextResponse.json(results, { status: 200 });
}
