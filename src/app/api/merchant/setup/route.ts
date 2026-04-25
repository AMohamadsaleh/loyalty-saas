export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { createMerchant, getMerchant } from '@/lib/firestore/merchants';

export async function POST(req: NextRequest) {
  const bearer = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!bearer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(bearer);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const existing = await getMerchant(uid);
  if (!existing) {
    const { name } = await req.json().catch(() => ({}));
    await createMerchant(uid, { name });
  }

  await adminAuth.setCustomUserClaims(uid, { role: 'merchant', merchantId: uid });

  return NextResponse.json({ ok: true });
}
