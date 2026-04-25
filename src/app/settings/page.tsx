'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { MerchantSettingsForm } from '@/components/settings/MerchantSettingsForm';
import { useMerchant } from '@/hooks/useMerchant';
import { NavBar } from '@/components/ui/NavBar';
import type { Merchant } from '@/types';

export default function SettingsPage() {
  const { merchant: initial, loading } = useMerchant();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const current = merchant ?? initial;

  function handleSaved(updated: Partial<Merchant>) {
    if (current) setMerchant({ ...current, ...updated });
  }

  return (
    <AuthGuard>
      <NavBar active="settings" />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Settings</h1>
        {loading && <p className="text-sm text-gray-400">Loading…</p>}
        {!loading && !current && <p className="text-sm text-red-500">Could not load settings.</p>}
        {current && (
          <MerchantSettingsForm merchant={current} onSaved={handleSaved} />
        )}
      </main>
    </AuthGuard>
  );
}
