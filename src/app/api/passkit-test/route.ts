export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.PASSKIT_API_KEY;
  const programId = process.env.PASSKIT_PROGRAM_ID;

  const results: Record<string, unknown> = {
    apiKeySet: !!apiKey,
    programId,
    apiKeyPrefix: apiKey?.slice(0, 12) + '...',
  };

  // Try multiple base URLs and auth formats
  const attempts = [
    {
      label: 'api.passkit.net Bearer',
      url: `https://api.passkit.net/v1/pass/issue/single/${programId}`,
      auth: `Bearer ${apiKey}`,
    },
    {
      label: 'api.passkit.com Bearer',
      url: `https://api.passkit.com/v1/pass/issue/single/${programId}`,
      auth: `Bearer ${apiKey}`,
    },
    {
      label: 'api.passkit.net Basic',
      url: `https://api.passkit.net/v1/pass/issue/single/${programId}`,
      auth: `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
    },
  ];

  for (const attempt of attempts) {
    try {
      const res = await fetch(attempt.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: attempt.auth,
        },
        body: JSON.stringify({
          barcodeContent: 'test-membership-id',
        }),
      });

      const text = await res.text();
      results[attempt.label] = {
        status: res.status,
        response: text.slice(0, 500),
      };
    } catch (err) {
      results[attempt.label] = { error: String(err) };
    }
  }

  return NextResponse.json(results, { status: 200 });
}
