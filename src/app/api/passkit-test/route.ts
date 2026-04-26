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

  // Get full program details (may include tier info)
  try {
    const r = await fetch(`${base}/members/program/${programId}`, {
      method: 'GET',
      headers: h,
      signal: AbortSignal.timeout(10000),
    });
    const text = await r.text();
    results['program details (full)'] = { status: r.status, body: text };
  } catch (err) {
    results['program details (full)'] = { error: String(err) };
  }

  // Try alternate tier list endpoints
  for (const path of [
    `/members/tiers/program/${programId}`,
    `/members/tier/program/${programId}`,
    `/members/programs/${programId}/tiers`,
  ]) {
    try {
      const r = await fetch(`${base}${path}`, {
        method: 'GET',
        headers: h,
        signal: AbortSignal.timeout(10000),
      });
      const text = await r.text();
      results[`GET ${path}`] = { status: r.status, body: text.slice(0, 500) };
    } catch (err) {
      results[`GET ${path}`] = { error: String(err) };
    }
  }

  return NextResponse.json(results, { status: 200 });
}
