'use client';

import type { ScanResult } from '@/types';

interface Props {
  result: ScanResult;
  onScanAgain: () => void;
}

export function ScanResultCard({ result, onScanAgain }: Props) {
  return (
    <div className="text-center space-y-4">
      {result.rewardUnlocked ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
          <div className="text-4xl mb-2">🎉</div>
          <p className="text-green-800 font-bold text-lg">Reward Unlocked!</p>
          <p className="text-green-600 text-sm mt-1">Card has been reset for next round</p>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <div className="text-4xl mb-2">✓</div>
          <p className="text-blue-800 font-bold text-lg">Stamp Added</p>
          <p className="text-blue-600 text-sm mt-1">{result.progressText}</p>
        </div>
      )}

      {result.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={result.imageUrl}
          alt={result.progressText}
          className="w-full max-w-xs mx-auto rounded-xl shadow-sm"
        />
      )}

      {!result.imageUrl && (
        <p className="text-2xl font-bold text-gray-800">{result.progressText}</p>
      )}

      <button
        onClick={onScanAgain}
        className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium text-sm hover:bg-gray-800 transition-colors"
      >
        Scan next customer
      </button>
    </div>
  );
}
