export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getMerchant } from '@/lib/firestore/merchants';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const merchant = await getMerchant(params.id);
  if (!merchant || !merchant.isActive) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    merchant: {
      id: merchant.id,
      name: merchant.name,
      brandColor: merchant.brandColor,
      logoUrl: merchant.logoUrl,
      description: merchant.description,
      isActive: merchant.isActive,
    },
  });
}
