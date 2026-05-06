'use client';

import { JoinForm } from './JoinForm';
import { useLanguage } from '@/contexts/LanguageContext';
import type { PublicMerchant } from '@/types';

interface Props {
  merchantId?: string;
  merchant: PublicMerchant | null;
}

export function JoinPageContent({ merchantId, merchant }: Props) {
  const { t, lang, setLang } = useLanguage();

  const langBtn = (
    <button
      onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
      className="absolute top-4 end-4 px-2.5 py-1 rounded-lg text-xs font-bold border-2 border-white/40 text-white hover:bg-white/20 transition-colors z-10"
    >
      {t.nav.langToggle}
    </button>
  );

  if (!merchantId || !merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative">
        <button
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          className="absolute top-4 end-4 px-2.5 py-1 rounded-lg text-xs font-bold border-2 border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          {t.nav.langToggle}
        </button>
        <p className="text-gray-500 text-sm">
          {!merchantId ? t.join.invalidLink : t.join.notFound}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div
          className="px-6 py-8 text-white text-center relative"
          style={{ backgroundColor: merchant.brandColor ?? '#1E90FF' }}
        >
          {langBtn}
          {merchant.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={merchant.logoUrl}
              alt={merchant.name}
              className="w-16 h-16 rounded-full mx-auto mb-3 object-cover border-2 border-white/30"
            />
          )}
          <h1 className="text-xl font-bold">{merchant.name}</h1>
        </div>

        {/* Form */}
        <div className="p-6">
          {merchant.description ? (
            <p className="text-sm text-gray-600 mb-4 text-center">{merchant.description}</p>
          ) : (
            <p className="text-sm text-gray-600 mb-4 text-center">{t.join.defaultDesc}</p>
          )}
          <JoinForm merchant={merchant} />
        </div>
      </div>
    </div>
  );
}
