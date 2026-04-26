'use client';

import { useState } from 'react';
import { WalletButtons } from './WalletButtons';
import type { Merchant } from '@/types';

interface Props {
  merchant: Merchant;
}

export function JoinForm({ merchant }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passUrl, setPassUrl] = useState<string | null>(null);

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
      setPassUrl(data.passUrl ?? 'https://example.com/pass');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create pass');
    } finally {
      setLoading(false);
    }
  }

  if (passUrl) {
    return <WalletButtons passUrl={passUrl} merchantName={merchant.name} />;
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
