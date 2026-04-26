'use client';

import type { ScanResult } from '@/types';

interface Props {
  result: ScanResult;
  onScanAgain: () => void;
}

export function ScanResultCard({ result, onScanAgain }: Props) {
  return (
    <div className="space-y-4">
      {result.rewardUnlocked ? (
        <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-6 text-center">
          <div className="text-5xl mb-3">🎉</div>
          <p className="text-green-900 font-bold text-xl">Reward Unlocked!</p>
          <p className="text-green-700 text-sm mt-1 font-medium">Card has been reset for next round</p>
        </div>
      ) : (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 text-center">
          <div className="text-5xl mb-3">✅</div>
          <p className="text-blue-900 font-bold text-xl">Stamp Added!</p>
          <p className="text-blue-700 text-sm mt-1 font-medium">{result.progressText}</p>
        </div>
      )}

      {result.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={result.imageUrl}
          alt={result.progressText}
          className="w-full max-w-xs mx-auto rounded-xl shadow-md"
        />
      )}

      {!result.imageUrl && (
        <div className="text-center bg-white border-2 border-slate-200 rounded-xl py-6">
          <p className="text-3xl font-bold text-slate-900">{result.progressText}</p>
        </div>
      )}

      <button
        onClick={onScanAgain}
        className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors"
      >
        Scan next customer
      </button>
    </div>
  );
}
