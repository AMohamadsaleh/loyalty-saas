export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

const BASE = 'https://api.pub1.passkit.io';

function h() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.PASSKIT_API_KEY}` };
}

// GET — list all members so we can see who is consuming the quota
export async function GET() {
  const programId = process.env.PASSKIT_PROGRAM_ID ?? '';
  const results: Record<string, unknown> = { programId };

  try {
    const r = await fetch(`${BASE}/members/member/list/${programId}`, {
      method: 'POST',
      headers: h(),
      body: JSON.stringify({ programId, pageSize: 50 }),
      signal: AbortSignal.timeout(10000),
    });
    const text = await r.text();
    results['members'] = { status: r.status, body: text };
  } catch (err) {
    results['members'] = { error: String(err) };
  }

  return NextResponse.json(results, { status: 200 });
}

// DELETE — wipe ALL members for this program (clears quota)
export async function DELETE() {
  const programId = process.env.PASSKIT_PROGRAM_ID ?? '';
  const results: Record<string, unknown> = {};

  // List first
  const listRes = await fetch(`${BASE}/members/member/list/${programId}`, {
    method: 'POST',
    headers: h(),
    body: JSON.stringify({ programId, pageSize: 50 }),
    signal: AbortSignal.timeout(10000),
  });

  if (!listRes.ok) {
    return NextResponse.json({ error: `List failed: ${await listRes.text()}` }, { status: 500 });
  }

  const listData = await listRes.json();
  const members: Array<{ id: string; externalId: string }> = listData.members ?? listData ?? [];
  results['found'] = members.length;
  results['deleted'] = [];

  for (const m of members) {
    const eid = m.externalId ?? m.id;
    try {
      const r = await fetch(
        `${BASE}/members/member?programId=${encodeURIComponent(programId)}&externalId=${encodeURIComponent(eid)}`,
        { method: 'DELETE', headers: h(), signal: AbortSignal.timeout(8000) }
      );
      (results['deleted'] as string[]).push(`${eid}: ${r.status}`);
    } catch (err) {
      (results['deleted'] as string[]).push(`${eid}: error ${err}`);
    }
  }

  return NextResponse.json(results, { status: 200 });
}
