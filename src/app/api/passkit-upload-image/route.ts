export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { uploadPassKitImage } from '@/lib/passkit/client';

export async function POST(req: NextRequest) {
  const bearer = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!bearer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let merchantUid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(bearer);
    merchantUid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  let body: { imageUrl?: unknown; stampIndex?: unknown; name?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { imageUrl, stampIndex, name } = body;
  if (typeof imageUrl !== 'string' || typeof stampIndex !== 'number') {
    return NextResponse.json({ error: 'Missing imageUrl or stampIndex' }, { status: 400 });
  }

  const imageName = typeof name === 'string' ? name : `merchant_${merchantUid}_stamp_${stampIndex}`;

  try {
    const imageId = await uploadPassKitImage(imageUrl, imageName);

    // Update merchant.passkitStampImages[stampIndex] in Firestore
    const merchantRef = adminDb.doc(`merchants/${merchantUid}`);
    const snap = await merchantRef.get();
    const existing: (string | null)[] = (snap.data()?.passkitStampImages as (string | null)[] | undefined) ?? [];
    const length = Math.max(existing.length, stampIndex + 1);
    const updated = Array.from({ length }, (_, i) => (i === stampIndex ? imageId : (existing[i] ?? null)));
    await merchantRef.update({ passkitStampImages: updated });

    return NextResponse.json({ imageId, stampIndex });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[passkit-upload-image]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
