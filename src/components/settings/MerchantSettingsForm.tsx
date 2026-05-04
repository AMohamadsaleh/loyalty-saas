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
    passkitProgramId: merchant.passkitProgramId ?? '',
    passkitTierId: merchant.passkitTierId ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Track uploaded image IDs per stamp index (initialised from merchant doc)
  const [stampImages, setStampImages] = useState<(string | undefined)[]>(
    () => Array.from({ length: merchant.stampTarget + 1 }, (_, i) => merchant.passkitStampImages?.[i])
  );
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState('');

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

  function checkImageDimensions(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        if (img.width < 1125 || img.height < 336) {
          reject(new Error(`Image too small: ${img.width}×${img.height}px. Minimum required: 1125×336px (recommended: 1125×432px).`));
        } else {
          resolve();
        }
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read image dimensions')); };
      img.src = url;
    });
  }

  async function handleImageUpload(stampIndex: number, file: File) {
    if (!user) return;
    setUploadingIndex(stampIndex);
    setUploadError('');

    try {
      await checkImageDimensions(file);
      const base64 = await fileToBase64(file);
      const token = await user.getIdToken();
      const res = await fetch('/api/passkit-upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          imageBase64: base64,
          stampIndex,
          name: `${merchant.id}_stamp_${stampIndex}`,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Upload failed');
      }
      const { imageId } = await res.json();
      setStampImages((prev) => {
        const next = [...prev];
        next[stampIndex] = imageId;
        return next;
      });
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingIndex(null);
    }
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // When stampTarget changes in the form, resize the slots preview
  const slotCount = form.stampTarget + 1; // 0 through stampTarget

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

      <div className="bg-white border-2 border-slate-200 rounded-xl p-5 space-y-5">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">PassKit Wallet Pass</h2>
        <p className="text-xs text-slate-400">
          Create a program in PassKit dashboard, then paste the IDs here.
          Each merchant needs their own program for their branded pass.
        </p>
        <div>
          <label className={labelClass}>PassKit Program ID</label>
          <input
            type="text"
            value={form.passkitProgramId}
            onChange={(e) => set('passkitProgramId', e.target.value)}
            placeholder="e.g. 3Lmwu9YlZ9hlbBOuyjp85d"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>PassKit Tier ID</label>
          <input
            type="text"
            value={form.passkitTierId}
            onChange={(e) => set('passkitTierId', e.target.value)}
            placeholder="e.g. 222"
            className={inputClass}
          />
        </div>
      </div>

      <div className="bg-white border-2 border-slate-200 rounded-xl p-5 space-y-5">
        <div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Stamp Progress Images</h2>
          <p className="text-xs text-slate-400 mt-1">
            Upload one image per stamp count (0 through {form.stampTarget}). These are sent to PassKit
            and displayed on the wallet pass. Minimum: 1125&times;336 px — recommended: 1125&times;432 px PNG.
          </p>
        </div>

        {uploadError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{uploadError}</p>
        )}

        <div className="space-y-2">
          {Array.from({ length: slotCount }, (_, i) => {
            const hasImage = !!stampImages[i];
            const isUploading = uploadingIndex === i;
            const label = i === 0 ? '0 stamps (empty card)' : i === form.stampTarget ? `${i} stamps (full — reward!)` : `${i} stamp${i === 1 ? '' : 's'}`;
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="w-40 text-xs text-slate-600 shrink-0">{label}</span>
                <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer text-xs font-medium transition-colors ${hasImage ? 'border-green-300 bg-green-50 text-green-700' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-400 hover:bg-blue-50'} ${isUploading ? 'opacity-60 pointer-events-none' : ''}`}>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={isUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(i, file);
                      e.target.value = '';
                    }}
                  />
                  {isUploading ? 'Uploading…' : hasImage ? 'Uploaded ✓' : 'Choose image'}
                </label>
                {hasImage && !isUploading && (
                  <span className="text-xs text-slate-400 font-mono truncate max-w-[120px]" title={stampImages[i]}>
                    {stampImages[i]?.slice(0, 10)}…
                  </span>
                )}
              </div>
            );
          })}
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
