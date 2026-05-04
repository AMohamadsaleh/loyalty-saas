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

  const { imageBase64, stampIndex, name } = await req.json();
  if (typeof imageBase64 !== 'string' || typeof stampIndex !== 'number') {
    return NextResponse.json({ error: 'Missing imageBase64 or stampIndex' }, { status: 400 });
  }

  // Strip data URL prefix if present
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  const imageName = name ?? `merchant_${merchantUid}_stamp_${stampIndex}`;
  const imageId = await uploadPassKitImage(base64Data, imageName);

  // Update merchant.passkitStampImages[stampIndex] in Firestore
  const merchantRef = adminDb.doc(`merchants/${merchantUid}`);
  const snap = await merchantRef.get();
  const existing: string[] = (snap.data()?.passkitStampImages as string[] | undefined) ?? [];
  const updated = [...existing];
  updated[stampIndex] = imageId;

  await merchantRef.update({ passkitStampImages: updated });

  return NextResponse.json({ imageId, stampIndex });
}
