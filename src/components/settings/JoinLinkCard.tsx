'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  merchantId: string;
}

export function JoinLinkCard({ merchantId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const joinUrl = `${process.env.NEXT_PUBLIC_APP_URL}/join?merchantId=${merchantId}`;

  useEffect(() => {
    if (!canvasRef.current) return;
    import('qrcode').then((QRCode) => {
      QRCode.toCanvas(canvasRef.current!, joinUrl, {
        width: 200,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
      });
    });
  }, [joinUrl]);

  async function handleCopy() {
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-white border-2 border-slate-200 rounded-xl p-5 space-y-4">
      <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
        Customer Join Link
      </h2>
      <p className="text-sm text-slate-600">
        Share this link or print the QR code — customers open it to get their loyalty card.
      </p>

      {/* QR Code */}
      <div className="flex justify-center bg-slate-50 rounded-xl p-4 border border-slate-200">
        <canvas ref={canvasRef} className="rounded-lg" />
      </div>

      {/* URL + Copy */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 overflow-hidden">
          <p className="text-xs text-slate-600 truncate font-mono">{joinUrl}</p>
        </div>
        <button
          onClick={handleCopy}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            copied
              ? 'bg-green-100 text-green-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>

      {/* Print button */}
      <button
        onClick={() => window.print()}
        className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors"
      >
        Print QR code
      </button>
    </div>
  );
}
