import { adminDb } from '@/lib/firebase/admin';
import type { Membership } from '@/types';

export async function getMembership(membershipId: string): Promise<Membership | null> {
  const snap = await adminDb.doc(`memberships/${membershipId}`).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as Membership;
}

// Fallback: look up by PassKit internal passId (when barcode uses ${pid} instead of ${eid})
export async function getMembershipByPassId(passId: string): Promise<Membership | null> {
  const query = await adminDb
    .collection('memberships')
    .where('passId', '==', passId)
    .limit(1)
    .get();
  if (query.empty) return null;
  const doc = query.docs[0];
  return { id: doc.id, ...doc.data() } as Membership;
}

export async function findMembership(
  merchantId: string,
  customerId: string
): Promise<Membership | null> {
  const query = await adminDb
    .collection('memberships')
    .where('merchantId', '==', merchantId)
    .where('customerId', '==', customerId)
    .limit(1)
    .get();
  if (query.empty) return null;
  const doc = query.docs[0];
  return { id: doc.id, ...doc.data() } as Membership;
}

export async function createMembership(
  membershipId: string,
  data: Omit<Membership, 'id'>
): Promise<void> {
  await adminDb.doc(`memberships/${membershipId}`).set(data);
}

export async function updateMembership(
  membershipId: string,
  data: Partial<Membership>
): Promise<void> {
  await adminDb.doc(`memberships/${membershipId}`).update(data as Record<string, unknown>);
}
