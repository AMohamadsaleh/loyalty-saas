export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { getMerchant } from '@/lib/firestore/merchants';
import { getMembership, getMembershipByPassId } from '@/lib/firestore/memberships';
import { isCooldownActive, isDailyLimitReached, todayString } from '@/lib/utils/scanValidation';
import { updateLoyaltyPass } from '@/lib/passkit/client';
import type { Membership, Transaction } from '@/types';

function scanCandidates(value: unknown): string[] {
  if (typeof value !== 'string') return [];

  const raw = value.trim();
  if (!raw) return [];

  const candidates = new Set<string>([raw]);

  try {
    const url = new URL(raw);
    const lastPathPart = url.pathname.split('/').filter(Boolean).pop();
    if (lastPathPart) candidates.add(lastPathPart);

    for (const key of ['membershipId', 'memberId', 'passId', 'pid', 'eid', 'externalId', 'id']) {
      const param = url.searchParams.get(key);
      if (param) candidates.add(param.trim());
    }
  } catch {
    // Not a URL. Continue with plain text parsing.
  }

  const keyValueMatch = raw.match(/(?:membershipId|memberId|passId|pid|eid|externalId|id)[:=]\s*([A-Za-z0-9_-]+)/i);
  if (keyValueMatch) candidates.add(keyValueMatch[1]);

  return Array.from(candidates).filter(Boolean);
}

export async function POST(req: NextRequest) {
  // 1. Auth
  const bearer = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!bearer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let merchantUid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(bearer);
    merchantUid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { membershipId: scannedId } = await req.json();
  const candidates = scanCandidates(scannedId);
  if (candidates.length === 0) return NextResponse.json({ error: 'Missing membershipId' }, { status: 400 });

  // Resolve the real Firestore membership ID.
  // If the pass barcode uses PassKit's ${pid} instead of ${eid}, the scanned value
  // is the PassKit internal ID — fall back to a passId lookup.
  let membershipId: string | null = null;
  for (const candidate of candidates) {
    const direct = await getMembership(candidate);
    if (direct) {
      membershipId = direct.id;
      break;
    }

    const byPassId = await getMembershipByPassId(candidate);
    if (byPassId) {
      membershipId = byPassId.id;
      break;
    }
  }

  if (!membershipId) {
    console.warn('[scanStamp] membership not found for scanned candidates:', candidates);
    return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
  }

  // Use Firestore transaction to prevent race conditions
  const membershipRef = adminDb.doc(`memberships/${membershipId}`);

  const result = await adminDb.runTransaction(async (tx) => {
    const membershipSnap = await tx.get(membershipRef);
    if (!membershipSnap.exists) throw { status: 404, error: 'Membership not found' };

    const membership = { id: membershipSnap.id, ...membershipSnap.data() } as Membership;

    // 2. Merchant isolation
    if (membership.merchantId !== merchantUid) {
      throw { status: 403, error: 'Forbidden' };
    }

    // 3. Cooldown
    if (isCooldownActive(membership.lastScanAt)) {
      throw { status: 429, error: 'Please wait before scanning again' };
    }

    // 4. Daily limit
    const { limited, count } = isDailyLimitReached(
      membership.dailyScanCount,
      membership.lastScanDate
    );
    if (limited) throw { status: 429, error: 'Daily scan limit reached' };

    // 5. Fetch merchant (needed for stampTarget)
    const merchant = await getMerchant(membership.merchantId);
    if (!merchant) throw { status: 500, error: 'Merchant not found' };

    // 6. Stamp logic
    let newStamps = membership.stamps + 1;
    let newCompletedRewards = membership.completedRewards;
    let rewardUnlocked = false;

    if (newStamps >= merchant.stampTarget) {
      newStamps = 0;
      newCompletedRewards += 1;
      rewardUnlocked = true;
    }

    // 7. Build response text
    const progressText = `${newStamps} / ${merchant.stampTarget} visits`;

    // 8. Write membership update inside transaction
    const today = todayString();
    tx.update(membershipRef, {
      stamps: newStamps,
      completedRewards: newCompletedRewards,
      lastScanAt: Date.now(),
      dailyScanCount: count + 1,
      lastScanDate: today,
    });

    // 9. Write transaction doc inside same transaction
    const txRef = adminDb.collection('transactions').doc();
    const transactionData: Omit<Transaction, 'id'> = {
      merchantId: membership.merchantId,
      customerId: membership.customerId,
      type: rewardUnlocked ? 'reward' : 'stamp',
      value: 1,
      createdBy: merchantUid,
      createdAt: Date.now(),
    };
    tx.set(txRef, transactionData);

    // Fetch customer name for PassKit update (outside transaction read is fine here)
    let customerName: string | undefined;
    try {
      const custSnap = await adminDb.doc(`customers/${membership.customerId}`).get();
      customerName = custSnap.exists ? (custSnap.data()?.name as string | undefined) : undefined;
    } catch { /* non-critical */ }

    return {
      progressText,
      rewardUnlocked,
      completedRewards: newCompletedRewards,
      passId: membership.passId,
      merchant,
      newStamps,
      customerName,
    };
  });

  // 10. Update PassKit pass (outside Firestore transaction - network call)
  if (!result.merchant.passkitStampImages?.[result.newStamps]) {
    console.warn('[PassKit] no stamp image IDs configured for stamp count:', {
      merchantId: result.merchant.id,
      stampCount: result.newStamps,
      configuredImages: result.merchant.passkitStampImages?.length ?? 0,
    });
  }

  try {
    await updateLoyaltyPass(
      membershipId,
      result.newStamps,
      result.merchant.stampTarget,
      result.customerName,
      result.merchant.passkitProgramId,
      result.merchant.passkitStampImages,
      result.merchant.merchantInfo
    );
  } catch (err: unknown) {
    // Pass update failure is non-critical - stamp is already recorded.
    const message = err instanceof Error ? err.message : String(err);
    console.error('[PassKit] updateLoyaltyPass failed:', message);
  }

  return NextResponse.json({
    progressText: result.progressText,
    rewardUnlocked: result.rewardUnlocked,
    completedRewards: result.completedRewards,
  });
}
