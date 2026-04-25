'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  onScan: (value: string) => void;
  active: boolean;
}

export function QrScanner({ onScan, active }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<unknown>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!active) return;

    let scanner: { stop: () => Promise<void> } | null = null;

    async function start() {
      const { Html5QrcodeScanner } = await import('html5-qrcode');
      const s = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      s.render(
        (decodedText: string) => {
          onScan(decodedText);
        },
        (err: string) => {
          // Suppress benign "no QR code" errors
          if (!err.includes('No MultiFormat')) setError(err);
        }
      );
      scanner = s as unknown as { stop: () => Promise<void> };
      scannerRef.current = s;
    }

    start().catch((e) => setError(String(e)));

    return () => {
      scanner?.stop().catch(() => {});
    };
  }, [active, onScan]);

  return (
    <div>
      <div id="qr-reader" ref={containerRef} className="w-full" />
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
}
