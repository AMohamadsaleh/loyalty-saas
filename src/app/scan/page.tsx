'use client';

export const dynamic = 'force-dynamic';

import { useState, useCallback } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { QrScanner } from '@/components/scan/QrScanner';
import { ScanResultCard } from '@/components/scan/ScanResult';
import { NavBar } from '@/components/ui/NavBar';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ScanResult } from '@/types';

type Mode = 'qr' | 'phone';

type State =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'result'; data: ScanResult }
  | { kind: 'error'; message: string };

export default function ScanPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [mode, setMode] = useState<Mode>('qr');
  const [state, setState] = useState<State>({ kind: 'idle' });
  const [phone, setPhone] = useState('');

  async function stamp(body: Record<string, string>) {
    setState({ kind: 'loading' });
    try {
      const token = await user!.getIdToken();
      const res = await fetch('/api/scanStamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Scan failed');
      setState({ kind: 'result', data });
    } catch (err: unknown) {
      setState({ kind: 'error', message: err instanceof Error ? err.message : 'Scan failed' });
    }
  }

  const handleScan = useCallback(
    async (membershipId: string) => {
      if (state.kind !== 'idle') return;
      await stamp({ membershipId });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.kind, user]
  );

  async function handlePhoneStamp(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    await stamp({ phone: phone.trim() });
  }

  function reset() {
    setState({ kind: 'idle' });
    setPhone('');
  }

  const tabBase = 'flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors';
  const tabActive = 'bg-blue-600 text-white shadow-sm';
  const tabInactive = 'text-slate-500 hover:text-slate-700';

  return (
    <AuthGuard>
      <NavBar active="scan" />
      <main className="max-w-md mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-gray-900 mb-6 text-center">{t.scan.title}</h1>

        {state.kind === 'result' ? (
          <ScanResultCard result={state.data} onScanAgain={reset} />
        ) : state.kind === 'error' ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3">
            <p className="text-red-800 font-medium">{state.message}</p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
            >
              {t.scan.tryAgain}
            </button>
          </div>
        ) : (
          <>
            {/* Mode tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-5">
              <button
                type="button"
                onClick={() => { setMode('qr'); setState({ kind: 'idle' }); }}
                className={`${tabBase} ${mode === 'qr' ? tabActive : tabInactive}`}
              >
                {t.scan.tabQr}
              </button>
              <button
                type="button"
                onClick={() => { setMode('phone'); setState({ kind: 'idle' }); }}
                className={`${tabBase} ${mode === 'phone' ? tabActive : tabInactive}`}
              >
                {t.scan.tabPhone}
              </button>
            </div>

            {mode === 'qr' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-4">
                {state.kind === 'loading' ? (
                  <div className="flex flex-col items-center gap-3 py-12">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">{t.scan.adding}</p>
                  </div>
                ) : (
                  <>
                    <QrScanner onScan={handleScan} active={state.kind === 'idle'} />
                    <p className="text-xs text-gray-400 text-center mt-3">{t.scan.hint}</p>
                  </>
                )}
              </div>
            )}

            {mode === 'phone' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                {state.kind === 'loading' ? (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">{t.scan.adding}</p>
                  </div>
                ) : (
                  <form onSubmit={handlePhoneStamp} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        {t.scan.phoneLabel}
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={t.scan.phonePlaceholder}
                        required
                        autoFocus
                        className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!phone.trim()}
                      className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-40 transition-colors shadow-sm"
                    >
                      {t.scan.stampByPhone}
                    </button>
                  </form>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </AuthGuard>
  );
}
