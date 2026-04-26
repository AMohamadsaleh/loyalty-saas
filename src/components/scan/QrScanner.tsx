'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  onScan: (value: string) => void;
  active: boolean;
}

export function QrScanner({ onScan, active }: Props) {
  const [error, setError] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    if (!active) return;

    let mounted = true;

    async function start() {
      const { Html5QrcodeScanner } = await import('html5-qrcode');
      if (!mounted) return;

      const s = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      s.render(
        (decodedText: string) => { onScan(decodedText); },
        () => {}  // suppress all scan-attempt errors
      );
      scannerRef.current = s;
    }

    start().catch((e) => setError(String(e)));

    return () => {
      mounted = false;
      const s = scannerRef.current;
      if (s && typeof s.clear === 'function') {
        s.clear().catch(() => {});
      }
      scannerRef.current = null;
    };
  }, [active, onScan]);

  return (
    <div>
      <div id="qr-reader" className="w-full" />
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
}
