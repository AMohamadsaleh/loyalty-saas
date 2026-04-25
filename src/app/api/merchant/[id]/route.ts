export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { getMerchant } from '@/lib/firestore/merchants';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const bearer = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!bearer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(bearer);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  if (uid !== params.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const merchant = await getMerchant(params.id);
  if (!merchant) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ merchant });
}
