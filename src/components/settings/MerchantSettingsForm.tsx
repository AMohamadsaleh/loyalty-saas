'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { Merchant } from '@/types';

interface Props {
  merchant: Merchant;
  onSaved: (updated: Partial<Merchant>) => void;
}

export function MerchantSettingsForm({ merchant, onSaved }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: merchant.name,
    stampTarget: merchant.stampTarget,
    rewardName: merchant.rewardName,
    templateType: merchant.templateType,
    brandColor: merchant.brandColor,
    displayMode: merchant.displayMode,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/merchant/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Save failed');
      onSaved(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-5 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Store name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Stamp target</label>
        <input
          type="number"
          min={1}
          max={20}
          value={form.stampTarget}
          onChange={(e) => set('stampTarget', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Reward name</label>
        <input
          type="text"
          value={form.rewardName}
          onChange={(e) => set('rewardName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Stamp template</label>
        <select
          value={form.templateType}
          onChange={(e) => set('templateType', e.target.value as Merchant['templateType'])}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="grid_6">Grid (6 stamps)</option>
          <option value="circle_5">Circle (5 stamps)</option>
          <option value="bar_10">Progress bar (10 stamps)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Brand color</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={form.brandColor}
            onChange={(e) => set('brandColor', e.target.value)}
            className="h-10 w-16 cursor-pointer rounded border border-gray-300"
          />
          <span className="text-sm text-gray-500">{form.brandColor}</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Stamp display</label>
        <select
          value={form.displayMode}
          onChange={(e) => set('displayMode', e.target.value as Merchant['displayMode'])}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="image">Image (stamp card visual)</option>
          <option value="text">Text only</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {saving ? 'Saving…' : saved ? 'Saved!' : 'Save settings'}
      </button>
    </form>
  );
}
