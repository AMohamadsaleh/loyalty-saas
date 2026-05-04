export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { uploadPassKitImage } from '@/lib/passkit/client';

// Vercel serverless body limit is 4.5 MB; a 3 MB image becomes ~4 MB base64 — warn early
const MAX_BASE64_BYTES = 4 * 1024 * 1024; // 4 MB

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

  let body: { imageBase64?: unknown; stampIndex?: unknown; name?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { imageBase64, stampIndex, name } = body;
  if (typeof imageBase64 !== 'string' || typeof stampIndex !== 'number') {
    return NextResponse.json({ error: 'Missing imageBase64 or stampIndex' }, { status: 400 });
  }

  // Strip data URL prefix if present
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  if (Buffer.byteLength(base64Data, 'base64') > MAX_BASE64_BYTES) {
    return NextResponse.json({ error: 'Image too large — keep under 3 MB' }, { status: 413 });
  }

  const imageName = typeof name === 'string' ? name : `merchant_${merchantUid}_stamp_${stampIndex}`;

  try {
    const imageId = await uploadPassKitImage(base64Data, imageName);

    // Update merchant.passkitStampImages[stampIndex] in Firestore
    const merchantRef = adminDb.doc(`merchants/${merchantUid}`);
    const snap = await merchantRef.get();
    const existing: string[] = (snap.data()?.passkitStampImages as string[] | undefined) ?? [];
    const updated = [...existing];
    updated[stampIndex] = imageId;
    await merchantRef.update({ passkitStampImages: updated });

    return NextResponse.json({ imageId, stampIndex });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[passkit-upload-image]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
