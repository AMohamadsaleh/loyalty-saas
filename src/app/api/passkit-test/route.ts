export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.PASSKIT_API_KEY;
  const programId = process.env.PASSKIT_PROGRAM_ID;

  const results: Record<string, unknown> = {
    apiKeySet: !!apiKey,
    apiKeyPrefix: apiKey?.slice(0, 20) + '...',
    programId,
  };

  const endpoints = [
    {
      label: 'pub1 GET member list',
      url: `https://api.pub1.passkit.io/members/member/list/${programId}`,
      method: 'POST',
      auth: `Bearer ${apiKey}`,
      body: JSON.stringify({ programId }),
    },
    {
      label: 'pub2 GET member list',
      url: `https://api.pub2.passkit.io/members/member/list/${programId}`,
      method: 'POST',
      auth: `Bearer ${apiKey}`,
      body: JSON.stringify({ programId }),
    },
    {
      label: 'pub1 enrol member (test)',
      url: `https://api.pub1.passkit.io/members/member`,
      method: 'POST',
      auth: `Bearer ${apiKey}`,
      body: JSON.stringify({ programId, externalId: `test_${Date.now()}`, points: 0 }),
    },
    {
      label: 'pub2 enrol member (test)',
      url: `https://api.pub2.passkit.io/members/member`,
      method: 'POST',
      auth: `Bearer ${apiKey}`,
      body: JSON.stringify({ programId, externalId: `test_${Date.now()}`, points: 0 }),
    },
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, {
        method: ep.method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: ep.auth,
        },
        body: ep.body,
        signal: AbortSignal.timeout(10000),
      });
      const text = await res.text();
      results[ep.label] = { status: res.status, body: text.slice(0, 500) };
    } catch (err) {
      results[ep.label] = { error: String(err) };
    }
  }

  return NextResponse.json(results, { status: 200 });
}
