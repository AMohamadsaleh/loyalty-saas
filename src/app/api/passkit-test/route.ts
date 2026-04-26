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

  // Step 1: list tiers for this program to find the tierId
  try {
    const r = await fetch(`${base}/members/tier/list`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ programId }),
      signal: AbortSignal.timeout(10000),
    });
    const text = await r.text();
    results['tier list'] = { status: r.status, body: text.slice(0, 1000) };
  } catch (err) {
    results['tier list'] = { error: String(err) };
  }

  // Step 2: get program details
  try {
    const r = await fetch(`${base}/members/program/${programId}`, {
      method: 'GET',
      headers: h,
      signal: AbortSignal.timeout(10000),
    });
    const text = await r.text();
    results['program details'] = { status: r.status, body: text.slice(0, 1000) };
  } catch (err) {
    results['program details'] = { error: String(err) };
  }

  // Step 3: try enrol with common tier IDs
  for (const tierId of ['default', 'standard', 'member', 'bronze', programId ?? '']) {
    try {
      const r = await fetch(`${base}/members/member`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ programId, tierId, externalId: `probe_${tierId}`, points: 0 }),
        signal: AbortSignal.timeout(10000),
      });
      const text = await r.text();
      results[`enrol tierId=${tierId}`] = { status: r.status, body: text.slice(0, 500) };
      if (r.ok) break; // stop on first success
    } catch (err) {
      results[`enrol tierId=${tierId}`] = { error: String(err) };
    }
  }

  return NextResponse.json(results, { status: 200 });
}
