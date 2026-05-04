export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, getAdminStorage } from '@/lib/firebase/admin';
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

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file');
  const stampIndexRaw = formData.get('stampIndex');
  const nameRaw = formData.get('name');

  if (!(file instanceof File) || stampIndexRaw === null) {
    return NextResponse.json({ error: 'Missing file or stampIndex' }, { status: 400 });
  }

  const stampIndex = Number(stampIndexRaw);
  if (!Number.isInteger(stampIndex) || stampIndex < 0) {
    return NextResponse.json({ error: 'Invalid stampIndex' }, { status: 400 });
  }

  const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image too large — keep under 4 MB' }, { status: 413 });
  }

  const imageName = typeof nameRaw === 'string' ? nameRaw : `merchant_${merchantUid}_stamp_${stampIndex}`;

  try {
    // Upload file to Firebase Storage server-side (no CORS)
    const buffer = Buffer.from(await file.arrayBuffer());
    const storagePath = `passkit-images/${merchantUid}/stamp_${stampIndex}_${Date.now()}`;
    const bucket = getAdminStorage().bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    const storageFile = bucket.file(storagePath);
    await storageFile.save(buffer, { metadata: { contentType: file.type } });
    await storageFile.makePublic();
    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    // Register image with PassKit and get an image ID
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
