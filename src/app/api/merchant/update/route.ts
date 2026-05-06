export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { updateMerchant } from '@/lib/firestore/merchants';
import { z } from 'zod';

const schema = z.object({
  stampTarget: z.number().int().min(1).max(20).optional(),
  rewardName: z.string().min(1).max(100).optional(),
  templateType: z.enum(['grid_6', 'circle_5', 'bar_10']).optional(),
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  displayMode: z.enum(['text', 'image']).optional(),
  name: z.string().min(1).max(100).optional(),
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

  await updateMerchant(uid, parsed.data);
  return NextResponse.json({ ok: true });
}
