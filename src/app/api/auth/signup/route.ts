export const runtime = 'nodejs';

/**
 * Combines merchant setup + session cookie creation into one round trip.
 * Called only on first sign-up to avoid 3 sequential API calls.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  const { idToken, name } = await req.json();
  if (!idToken) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // Run merchant creation + custom claims in parallel
  await Promise.all([
    adminDb.doc(`merchants/${uid}`).set({
      name: name || 'My Store',
      ownerId: uid,
      stampTarget: 6,
      brandColor: '#1E90FF',
      logoUrl: '',
      isActive: true,
      createdAt: Date.now(),
    }, { merge: true }),
    adminAuth.setCustomUserClaims(uid, { role: 'merchant', merchantId: uid }),
  ]);

  // Create session cookie in the same request
  const expiresIn = 60 * 60 * 24 * 5 * 1000;
  const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

  const res = NextResponse.json({ ok: true });
  res.cookies.set('session', sessionCookie, {
    maxAge: expiresIn / 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
  });
  return res;
}
