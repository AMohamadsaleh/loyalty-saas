'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { MerchantSettingsForm } from '@/components/settings/MerchantSettingsForm';
import { useMerchant } from '@/hooks/useMerchant';
import { NavBar } from '@/components/ui/NavBar';
import type { Merchant } from '@/types';

export default function SettingsPage() {
  const { merchant: initial, loading, error } = useMerchant();
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

        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            Loading…
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm font-medium text-red-700">Could not load settings</p>
            <p className="text-xs text-red-500 mt-1">{error}</p>
            <p className="text-xs text-gray-500 mt-2">
              Make sure FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY are set in your environment variables.
            </p>
          </div>
        )}

        {!loading && !error && !current && (
          <p className="text-sm text-red-500">Store not found. Try signing out and back in.</p>
        )}

        {current && (
          <MerchantSettingsForm merchant={current} onSaved={handleSaved} />
        )}
      </main>
    </AuthGuard>
  );
}
