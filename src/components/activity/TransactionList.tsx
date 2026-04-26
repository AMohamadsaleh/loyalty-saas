'use client';

import type { Transaction } from '@/types';

interface Props {
  transactions: Transaction[];
  loading: boolean;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TransactionList({ transactions, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border-2 border-slate-200">
        <p className="text-3xl mb-3">📋</p>
        <p className="text-slate-700 font-semibold">No activity yet</p>
        <p className="text-slate-400 text-sm mt-1">Start scanning customers to see transactions here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="flex items-center justify-between bg-white border-2 border-slate-200 rounded-xl px-4 py-3.5 hover:border-slate-300 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
              tx.type === 'reward' ? 'bg-green-100' : 'bg-blue-100'
            }`}>
              {tx.type === 'reward' ? '🎉' : '✓'}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {tx.type === 'reward' ? 'Reward unlocked' : 'Stamp added'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{formatTime(tx.createdAt)}</p>
            </div>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
            tx.type === 'reward'
              ? 'bg-green-100 text-green-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {tx.type === 'reward' ? '🏆 Reward' : '+1 stamp'}
          </span>
        </div>
      ))}
    </div>
  );
}
