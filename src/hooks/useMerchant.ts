'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import type { Merchant } from '@/types';

const CACHE_KEY = 'merchant_cache';

function readCache(): Merchant | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Merchant) : null;
  } catch {
    return null;
  }
}

function writeCache(merchant: Merchant) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(merchant));
  } catch { /* ignore */ }
}

export function useMerchant() {
  const { user, loading: authLoading } = useAuth();
  const [merchant, setMerchant] = useState<Merchant | null>(() => readCache());
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
      .then((data) => {
        const m = data.merchant ?? null;
        if (m) writeCache(m);
        setMerchant(m);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  return { merchant, loading, error };
}
