export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getMerchant } from '@/lib/firestore/merchants';
import { getOrCreateCustomer } from '@/lib/firestore/customers';
import { findMembership, createMembership } from '@/lib/firestore/memberships';
import { createLoyaltyPass } from '@/lib/passkit/client';

const schema = z.object({
  merchantId: z.string().min(1),
  name: z.string().max(100).optional().default(''),
  phone: z.string().max(20).optional().default(''),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { merchantId, name, phone } = parsed.data;

  const merchant = await getMerchant(merchantId);
  if (!merchant || !merchant.isActive) {
    return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
  }

  const customer = await getOrCreateCustomer(phone || `anon_${Date.now()}`, name || 'Customer');

  const existing = await findMembership(merchantId, customer.id);
  if (existing) {
    return NextResponse.json({
      membershipId: existing.id,
      passUrl: null,
      existing: true,
    });
  }

  const membershipId = crypto.randomUUID();

  let passId = membershipId;
  let passUrl: string | null = null;
  let passError: string | null = null;

  try {
    const pass = await createLoyaltyPass(membershipId, merchant);
    passId = pass.passId;
    passUrl = pass.passUrl;
  } catch (err) {
    // Log the real error so it shows in Vercel logs
    passError = err instanceof Error ? err.message : String(err);
    console.error('[PassKit] createLoyaltyPass failed:', passError);
  }

  await createMembership(membershipId, {
    merchantId,
    customerId: customer.id,
    stamps: 0,
    completedRewards: 0,
    passId,
    lastScanAt: 0,
    dailyScanCount: 0,
    lastScanDate: '',
    createdAt: Date.now(),
  });

  // Always return membershipId — passUrl is null if PassKit not configured
  return NextResponse.json({ membershipId, passUrl, passError, existing: false });
}
