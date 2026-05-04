export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

const BASE = 'https://api.pub1.passkit.io';

function h() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.PASSKIT_API_KEY}` };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tierId   = searchParams.get('tier')    ?? (process.env.PASSKIT_TIER_ID ?? 'base');
  const programId = searchParams.get('program') ?? (process.env.PASSKIT_PROGRAM_ID ?? '');
  const designId  = searchParams.get('design')  ?? '42ZDgw2RGeDV0x1Ww9bk7s';

  const results: Record<string, unknown> = { tierId, programId };

  // List all tiers for the program
  try {
    const r = await fetch(`${BASE}/members/tier/list`, {
      method: 'POST',
      headers: h(),
      body: JSON.stringify({ programId }),
      signal: AbortSignal.timeout(8000),
    });
    const text = await r.text();
    results['tier_list'] = { status: r.status, body: r.ok ? JSON.parse(text) : text };
  } catch (err) {
    results['tier_list'] = { error: String(err) };
  }

  // Try fetching tier "222" directly
  for (const id of ['222', tierId, designId]) {
    try {
      const r = await fetch(`${BASE}/members/tier/${id}`, {
        headers: h(),
        signal: AbortSignal.timeout(8000),
      });
      const text = await r.text();
      results[`tier_${id}`] = { status: r.status, body: r.ok ? JSON.parse(text) : text.slice(0, 200) };
    } catch (err) {
      results[`tier_${id}`] = { error: String(err) };
    }
  }

  return NextResponse.json(results);
}

export async function DELETE() {
  const programId = process.env.PASSKIT_PROGRAM_ID ?? '';
  const results: Record<string, unknown> = {};

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

  return NextResponse.json(results);
}
