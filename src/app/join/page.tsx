import { JoinForm } from '@/components/join/JoinForm';
import type { Merchant } from '@/types';

interface Props {
  searchParams: { merchantId?: string };
}

async function getMerchantPublic(merchantId: string): Promise<Merchant | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/merchant/${merchantId}/public`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.merchant ?? null;
  } catch {
    return null;
  }
}

export default async function JoinPage({ searchParams }: Props) {
  const { merchantId } = searchParams;

  if (!merchantId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-gray-500 text-sm">Invalid link — no merchant ID provided.</p>
      </div>
    );
  }

  const merchant = await getMerchantPublic(merchantId);

  if (!merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-gray-500 text-sm">Store not found or inactive.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div
          className="px-6 py-8 text-white text-center"
          style={{ backgroundColor: merchant.brandColor }}
        >
          {merchant.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={merchant.logoUrl}
              alt={merchant.name}
              className="w-16 h-16 rounded-full mx-auto mb-3 object-cover border-2 border-white/30"
            />
          )}
          <h1 className="text-xl font-bold">{merchant.name}</h1>
          <p className="text-sm mt-1 opacity-80">
            {merchant.stampTarget} visits = {merchant.rewardName}
          </p>
        </div>

        {/* Form */}
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4 text-center">
            Join our loyalty program and get rewarded for every visit.
          </p>
          <JoinForm merchant={merchant} />
        </div>
      </div>
    </div>
  );
}
