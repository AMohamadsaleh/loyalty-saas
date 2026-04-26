'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import type { Merchant } from '@/types';

export function useMerchant() {
  const { user, loading: authLoading } = useAuth();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    user.getIdToken()
      .then((token) =>
        fetch(`/api/merchant/${user.uid}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      )
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load store (${r.status})`);
        return r.json();
      })
      .then((data) => setMerchant(data.merchant ?? null))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  return { merchant, loading, error };
}
