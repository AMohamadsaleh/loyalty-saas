export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, getAdminStorage } from '@/lib/firebase/admin';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

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
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, or WebP images are allowed' }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image too large — keep under 2 MB' }, { status: 413 });
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const filePath = `logos/${merchantUid}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const bucket = getAdminStorage().bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!);
  const storageFile = bucket.file(filePath);

  await storageFile.save(buffer, {
    metadata: { contentType: file.type },
  });
  await storageFile.makePublic();

  const logoUrl = storageFile.publicUrl();

  await adminDb.doc(`merchants/${merchantUid}`).update({ logoUrl });

  return NextResponse.json({ logoUrl });
}
