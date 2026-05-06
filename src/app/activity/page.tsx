'use client';

export const dynamic = 'force-dynamic';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { TransactionList } from '@/components/activity/TransactionList';
import { NavBar } from '@/components/ui/NavBar';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ActivityPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { transactions, loading } = useTransactions(user?.uid ?? null);

  return (
    <AuthGuard>
      <NavBar active="activity" />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-gray-900 mb-6">{t.activity.title}</h1>
        <TransactionList transactions={transactions} loading={loading} />
      </main>
    </AuthGuard>
  );
}
