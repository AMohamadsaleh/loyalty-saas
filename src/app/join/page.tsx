import { JoinPageContent } from '@/components/join/JoinPageContent';
import type { PublicMerchant } from '@/types';

interface Props {
  searchParams: { merchantId?: string };
}

async function getMerchantPublic(merchantId: string): Promise<PublicMerchant | null> {
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
  const merchant = merchantId ? await getMerchantPublic(merchantId) : null;
  return <JoinPageContent merchantId={merchantId} merchant={merchant} />;
}
