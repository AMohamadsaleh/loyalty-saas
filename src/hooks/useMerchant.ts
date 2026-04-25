'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import type { Merchant } from '@/types';

export function useMerchant() {
  const { user, loading: authLoading } = useAuth();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    user.getIdToken().then((token) =>
      fetch(`/api/merchant/${user.uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => setMerchant(data.merchant ?? null))
        .finally(() => setLoading(false))
    );
  }, [user, authLoading]);

  return { merchant, loading };
}
