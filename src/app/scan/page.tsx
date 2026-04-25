'use client';

export const dynamic = 'force-dynamic';

import { useState, useCallback } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { QrScanner } from '@/components/scan/QrScanner';
import { ScanResultCard } from '@/components/scan/ScanResult';
import { NavBar } from '@/components/ui/NavBar';
import { useAuth } from '@/hooks/useAuth';
import type { ScanResult } from '@/types';

type State =
  | { kind: 'scanning' }
  | { kind: 'loading' }
  | { kind: 'result'; data: ScanResult }
  | { kind: 'error'; message: string };

export default function ScanPage() {
  const { user } = useAuth();
  const [state, setState] = useState<State>({ kind: 'scanning' });

  const handleScan = useCallback(
    async (membershipId: string) => {
      if (state.kind !== 'scanning') return;
      setState({ kind: 'loading' });

      try {
        const token = await user!.getIdToken();
        const res = await fetch('/api/scanStamp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ membershipId }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Scan failed');

        setState({ kind: 'result', data });
      } catch (err: unknown) {
        setState({
          kind: 'error',
          message: err instanceof Error ? err.message : 'Scan failed',
        });
      }
    },
    [state.kind, user]
  );

  return (
    <AuthGuard>
      <NavBar active="scan" />
      <main className="max-w-md mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-gray-900 mb-6 text-center">Scan Customer Card</h1>

        {state.kind === 'scanning' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-4">
            <QrScanner onScan={handleScan} active />
            <p className="text-xs text-gray-400 text-center mt-3">
              Point camera at customer&apos;s QR code
            </p>
          </div>
        )}

        {state.kind === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Adding stamp…</p>
          </div>
        )}

        {state.kind === 'result' && (
          <ScanResultCard
            result={state.data}
            onScanAgain={() => setState({ kind: 'scanning' })}
          />
        )}

        {state.kind === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3">
            <p className="text-red-800 font-medium">{state.message}</p>
            <button
              onClick={() => setState({ kind: 'scanning' })}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
            >
              Try again
            </button>
          </div>
        )}
      </main>
    </AuthGuard>
  );
}
