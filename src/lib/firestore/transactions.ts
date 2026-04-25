import { adminDb } from '@/lib/firebase/admin';
import type { Transaction } from '@/types';

export async function writeTransaction(data: Omit<Transaction, 'id'>): Promise<void> {
  await adminDb.collection('transactions').add(data);
}

export async function getTransactions(
  merchantId: string,
  limit = 50
): Promise<Transaction[]> {
  const snap = await adminDb
    .collection('transactions')
    .where('merchantId', '==', merchantId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction));
}
