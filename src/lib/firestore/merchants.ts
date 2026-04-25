import { adminDb } from '@/lib/firebase/admin';
import type { Merchant } from '@/types';

export async function getMerchant(merchantId: string): Promise<Merchant | null> {
  const snap = await adminDb.doc(`merchants/${merchantId}`).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as Merchant;
}

export async function createMerchant(uid: string, data: Partial<Merchant>): Promise<void> {
  await adminDb.doc(`merchants/${uid}`).set({
    name: data.name ?? 'My Store',
    ownerId: uid,
    stampTarget: 6,
    rewardName: 'Free Reward',
    templateType: 'grid_6',
    brandColor: '#1E90FF',
    logoUrl: '',
    displayMode: 'image',
    isActive: true,
    createdAt: Date.now(),
    ...data,
  });
}

export async function updateMerchant(merchantId: string, data: Partial<Merchant>): Promise<void> {
  await adminDb.doc(`merchants/${merchantId}`).update(data as Record<string, unknown>);
}
