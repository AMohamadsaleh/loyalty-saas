'use client';

import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  passUrl: string;
  merchantName: string;
}

export function WalletButtons({ passUrl, merchantName }: Props) {
  const { t } = useLanguage();

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 text-center">{t.wallet.allSet}</p>
      <a
        href={passUrl}
        className="flex items-center justify-center gap-2 w-full py-3 bg-black text-white rounded-xl font-medium text-sm hover:bg-gray-900 transition-colors"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
        {t.wallet.apple}
      </a>
      <a
        href={passUrl}
        className="flex items-center justify-center gap-2 w-full py-3 bg-white text-gray-800 border border-gray-300 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="4" fill="#fff" />
          <path d="M12 11.25V8.5A3.5 3.5 0 0 0 5 10.5v.75" stroke="#4285F4" strokeWidth="1.5" />
          <rect x="3" y="11" width="18" height="10" rx="2" fill="#4285F4" />
          <circle cx="12" cy="16" r="2" fill="#fff" />
        </svg>
        {t.wallet.google}
      </a>
      <p className="text-xs text-gray-400 text-center">{merchantName} — {t.wallet.loyaltyCard}</p>
    </div>
  );
}
