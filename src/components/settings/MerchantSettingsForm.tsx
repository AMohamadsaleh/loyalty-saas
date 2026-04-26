'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { Merchant } from '@/types';

interface Props {
  merchant: Merchant;
  onSaved: (updated: Partial<Merchant>) => void;
}

const inputClass = 'w-full px-3.5 py-2.5 bg-white border-2 border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-500 transition-colors';
const labelClass = 'block text-sm font-semibold text-slate-700 mb-1.5';

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

      <div className="bg-white border-2 border-slate-200 rounded-xl p-5 space-y-5">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Store Info</h2>

        <div>
          <label className={labelClass}>Store name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="My Store"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Brand color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.brandColor}
              onChange={(e) => set('brandColor', e.target.value)}
              className="h-11 w-20 cursor-pointer rounded-lg border-2 border-slate-200 p-1"
            />
            <span className="text-sm font-mono text-slate-700 bg-slate-100 px-3 py-2 rounded-lg">
              {form.brandColor}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white border-2 border-slate-200 rounded-xl p-5 space-y-5">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Loyalty Program</h2>

        <div>
          <label className={labelClass}>Stamps needed for reward</label>
          <input
            type="number"
            min={1}
            max={20}
            value={form.stampTarget}
            onChange={(e) => set('stampTarget', parseInt(e.target.value))}
            className={inputClass}
          />
          <p className="text-xs text-slate-400 mt-1">Between 1 and 20</p>
        </div>

        <div>
          <label className={labelClass}>Reward name</label>
          <input
            type="text"
            value={form.rewardName}
            onChange={(e) => set('rewardName', e.target.value)}
            placeholder="e.g. Free Coffee"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Stamp card template</label>
          <select
            value={form.templateType}
            onChange={(e) => set('templateType', e.target.value as Merchant['templateType'])}
            className={inputClass}
          >
            <option value="grid_6">Grid (6 stamps)</option>
            <option value="circle_5">Circle (5 stamps)</option>
            <option value="bar_10">Progress bar (10 stamps)</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Stamp display mode</label>
          <select
            value={form.displayMode}
            onChange={(e) => set('displayMode', e.target.value as Merchant['displayMode'])}
            className={inputClass}
          >
            <option value="image">Image (stamp card visual)</option>
            <option value="text">Text only</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <p className="text-sm text-green-700 font-medium">Settings saved successfully!</p>
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
      >
        {saving ? 'Saving…' : 'Save settings'}
      </button>
    </form>
  );
}
