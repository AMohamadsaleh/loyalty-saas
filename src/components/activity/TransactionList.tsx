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
          <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 text-sm">No activity yet. Start scanning customers!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">
              {tx.type === 'reward' ? '🎉' : '✓'}
            </span>
            <div>
              <p className="text-sm font-medium text-gray-800">
                {tx.type === 'reward' ? 'Reward unlocked' : 'Stamp added'}
              </p>
              <p className="text-xs text-gray-400">{formatTime(tx.createdAt)}</p>
            </div>
          </div>
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              tx.type === 'reward'
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {tx.type === 'reward' ? 'Reward' : '+1 stamp'}
          </span>
        </div>
      ))}
    </div>
  );
}
