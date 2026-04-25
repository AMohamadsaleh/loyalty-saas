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
        <label className="block text-sm font-medium text-gray-700 mb-1">Your name (optional)</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Smith"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2"
          style={{ '--tw-ring-color': merchant.brandColor } as React.CSSProperties}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone number (optional)</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 555 000 0000"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 text-white rounded-xl font-medium text-sm disabled:opacity-50 transition-colors"
        style={{ backgroundColor: merchant.brandColor }}
      >
        {loading ? 'Creating your card…' : 'Get my loyalty card'}
      </button>
    </form>
  );
}
