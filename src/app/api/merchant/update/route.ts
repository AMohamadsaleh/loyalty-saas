export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { updateMerchant } from '@/lib/firestore/merchants';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1).max(100).optional(),
  stampTarget: z.number().int().min(1).max(20).optional(),
  rewardName: z.string().min(1).max(100).optional(),
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  description: z.string().max(300).optional(),
  passkitProgramId: z.string().max(100).optional(),
  passkitTierId: z.string().max(100).optional(),
  merchantInfo: z.string().max(200).optional(),
  passkitStampImages: z.array(z.union([z.object({ strip: z.string(), hero: z.string() }), z.null()])).optional(),
});

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

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  // Trim passkitStampImages to stampTarget+1 slots when stampTarget decreases
  if (data.stampTarget !== undefined && data.passkitStampImages === undefined) {
    const merchantSnap = await adminDb.doc(`merchants/${uid}`).get();
    const existing = merchantSnap.data();
    const existingImages = existing?.passkitStampImages as Array<unknown> | undefined;
    if (existingImages && existingImages.length > data.stampTarget + 1) {
      (data as Record<string, unknown>).passkitStampImages = existingImages.slice(0, data.stampTarget + 1);
    }
  }

  await updateMerchant(uid, data);
  return NextResponse.json({ ok: true });
}
