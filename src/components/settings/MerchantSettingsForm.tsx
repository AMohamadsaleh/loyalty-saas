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
    brandColor: merchant.brandColor ?? '#1E90FF',
    logoUrl: merchant.logoUrl ?? '',
    description: merchant.description ?? '',
    passkitProgramId: merchant.passkitProgramId ?? '',
    passkitTierId: merchant.passkitTierId ?? '',
    merchantInfo: merchant.merchantInfo ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Track uploaded strip image IDs per stamp index (for display only; full pair saved in Firestore)
  const [stampImages, setStampImages] = useState<(string | undefined)[]>(
    () => Array.from({ length: merchant.stampTarget + 1 }, (_, i) => merchant.passkitStampImages?.[i]?.strip)
  );
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [justUploaded, setJustUploaded] = useState<Set<number>>(new Set());

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

      const token = await user.getIdToken();
      const fd = new FormData();
      fd.append('file', file);
      fd.append('stampIndex', String(stampIndex));
      fd.append('name', `${merchant.id}_stamp_${stampIndex}`);
      const res = await fetch('/api/passkit-upload-image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
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
      setJustUploaded((prev) => {
        const next = new Set(prev);
        next.add(stampIndex);
        return next;
      });
      setTimeout(() => {
        setJustUploaded((prev) => {
          const next = new Set(prev);
          next.delete(stampIndex);
          return next;
        });
      }, 3000);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingIndex(null);
    }
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

        <div>
          <label className={labelClass}>Description <span className="text-slate-400 font-normal">(shown on join page)</span></label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="e.g. Join our loyalty program and earn rewards for every visit!"
            maxLength={300}
            rows={2}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Logo URL <span className="text-slate-400 font-normal">(optional)</span></label>
          <div className="flex items-center gap-3">
            {form.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.logoUrl}
                alt="Logo preview"
                className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <input
              type="url"
              value={form.logoUrl}
              onChange={(e) => set('logoUrl', e.target.value)}
              placeholder="https://example.com/logo.png"
              className={inputClass}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">Paste a direct link to your logo image</p>
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
        <div>
          <label className={labelClass}>Program Info (معلومات)</label>
          <textarea
            value={form.merchantInfo}
            onChange={(e) => set('merchantInfo', e.target.value)}
            placeholder="Short description shown on the wallet pass"
            maxLength={200}
            rows={2}
            className={inputClass}
          />
          <p className="text-xs text-slate-400 mt-1">Shown as &quot;معلومات&quot; on the customer&apos;s wallet pass</p>
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
            const isJustUploaded = justUploaded.has(i);
            const anyUploading = uploadingIndex !== null;
            const label = i === 0 ? '0 stamps (empty card)' : i === form.stampTarget ? `${i} stamps (full — reward!)` : `${i} stamp${i === 1 ? '' : 's'}`;
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="w-40 text-xs text-slate-600 shrink-0">{label}</span>

                {isUploading ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-blue-200 bg-blue-50 text-blue-600 text-xs font-medium">
                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Uploading…
                  </div>
                ) : isJustUploaded ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-green-400 bg-green-100 text-green-800 text-xs font-semibold animate-pulse">
                    ✓ Upload successful!
                  </div>
                ) : hasImage ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-green-300 bg-green-50 text-green-700 text-xs font-medium">
                      <span>✓ Uploaded</span>
                      <span className="text-green-500 font-mono" title={stampImages[i]}>{stampImages[i]?.slice(0, 8)}…</span>
                    </div>
                    <label className={`px-3 py-2 rounded-lg border-2 border-slate-200 bg-white text-slate-500 text-xs font-medium cursor-pointer hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors ${anyUploading ? 'pointer-events-none opacity-40' : ''}`}>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        disabled={anyUploading}
                        onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(i, file); e.target.value = ''; }}
                      />
                      Replace
                    </label>
                  </div>
                ) : (
                  <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-slate-200 bg-slate-50 text-slate-600 text-xs font-medium cursor-pointer hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-colors ${anyUploading ? 'pointer-events-none opacity-40' : ''}`}>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      disabled={anyUploading}
                      onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(i, file); e.target.value = ''; }}
                    />
                    Choose image
                  </label>
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
