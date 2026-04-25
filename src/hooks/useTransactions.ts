'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { getClientDb } from '@/lib/firebase/client';
import type { Transaction } from '@/types';

export function useTransactions(merchantId: string | null) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!merchantId) { setLoading(false); return; }

    const db = getClientDb();
    const q = query(
      collection(db, 'transactions'),
      where('merchantId', '==', merchantId),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction)));
      setLoading(false);
    });

    return unsub;
  }, [merchantId]);

  return { transactions, loading };
}
