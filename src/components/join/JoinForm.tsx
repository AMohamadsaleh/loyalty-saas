'use client';

import { useEffect, useRef, useState } from 'react';
import { WalletButtons } from './WalletButtons';
import type { Merchant } from '@/types';

interface Props {
  merchant: Merchant;
}

interface Result {
  membershipId: string;
  passUrl: string | null;
  passError?: string | null;
}

function MembershipQR({ membershipId, merchant }: { membershipId: string; merchant: Merchant }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    import('qrcode').then((QRCode) => {
      QRCode.toCanvas(canvasRef.current!, membershipId, {
        width: 200,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
      });
    });
  }, [membershipId]);

  return (
    <div className="text-center space-y-4">
      <div className="text-4xl">✅</div>
      <p className="text-lg font-bold text-slate-900">You&apos;re registered!</p>
      <p className="text-sm text-slate-500">Show this QR code at the counter to collect stamps</p>

      <div className="flex justify-center bg-white rounded-xl p-4 border-2 border-slate-200 shadow-sm">
        <canvas ref={canvasRef} className="rounded-lg" />
      </div>

      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
        <p className="text-xs text-slate-400 font-mono break-all">{membershipId}</p>
      </div>

      <p className="text-xs text-slate-400">{merchant.name} loyalty card</p>
    </div>
  );
}

export function JoinForm({ merchant }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/createCustomerPass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: merchant.id, name, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong');
      setResult({
        membershipId: data.membershipId,
        passUrl: data.passUrl ?? null,
        passError: data.passError ?? null,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create pass');
    } finally {
      setLoading(false);
    }
  }

  // Show wallet buttons if PassKit returned a real URL
  if (result?.passUrl) {
    return (
      <div className="space-y-4">
        <WalletButtons passUrl={result.passUrl} merchantName={merchant.name} />
        <MembershipQR membershipId={result.membershipId} merchant={merchant} />
      </div>
    );
  }

  // Show QR code only (PassKit not configured or failed)
  if (result?.membershipId) {
    return (
      <div className="space-y-4">
        {result.passError && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <p className="text-sm text-amber-800">
              Wallet pass is not available right now. Use this QR code at the counter.
            </p>
          </div>
        )}
        <MembershipQR membershipId={result.membershipId} merchant={merchant} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Your name <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Smith"
          className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Phone number <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 555 000 0000"
          className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-colors shadow-sm"
        style={{ backgroundColor: merchant.brandColor }}
      >
        {loading ? 'Creating your card…' : 'Get my loyalty card'}
      </button>
    </form>
  );
}
