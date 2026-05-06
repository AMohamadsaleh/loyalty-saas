'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { MerchantSettingsForm } from '@/components/settings/MerchantSettingsForm';
import { JoinLinkCard } from '@/components/settings/JoinLinkCard';
import { useMerchant } from '@/hooks/useMerchant';
import { useAuth } from '@/hooks/useAuth';
import { NavBar } from '@/components/ui/NavBar';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Merchant } from '@/types';

export default function SettingsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { merchant: initial, loading, error } = useMerchant();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const current = merchant ?? initial;

  function handleSaved(updated: Partial<Merchant>) {
    if (current) setMerchant({ ...current, ...updated });
  }

  return (
    <AuthGuard>
      <NavBar active="settings" />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-xl font-bold text-slate-900">{t.settings.title}</h1>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
            {t.settings.loading}
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-red-700">{t.settings.loadError}</p>
            <p className="text-xs text-red-500 mt-1">{error}</p>
            <p className="text-xs text-slate-500 mt-2">{t.settings.loadErrorEnv}</p>
          </div>
        )}

        {!loading && !error && !current && (
          <p className="text-sm text-red-600 font-medium">{t.settings.notFound}</p>
        )}

        {current && user && (
          <>
            <JoinLinkCard merchantId={user.uid} />
            <MerchantSettingsForm merchant={current} onSaved={handleSaved} />
          </>
        )}
      </main>
    </AuthGuard>
  );
}
