export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { getMerchant } from '@/lib/firestore/merchants';
import { getMembership, getMembershipByPassId } from '@/lib/firestore/memberships';
import { stampImageUrl } from '@/lib/utils/stampImageUrl';
import { isCooldownActive, isDailyLimitReached, todayString } from '@/lib/utils/scanValidation';
import { updateLoyaltyPass } from '@/lib/passkit/client';
import type { Membership, Transaction } from '@/types';

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
  if (!scannedId) return NextResponse.json({ error: 'Missing membershipId' }, { status: 400 });

  // Resolve the real Firestore membership ID.
  // If the pass barcode uses PassKit's ${pid} instead of ${eid}, the scanned value
  // is the PassKit internal ID — fall back to a passId lookup.
  let membershipId = scannedId;
  const direct = await getMembership(scannedId);
  if (!direct) {
    const byPassId = await getMembershipByPassId(scannedId);
    if (!byPassId) return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
    membershipId = byPassId.id;
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

    // 5. Fetch merchant (needed for stampTarget, rewardName, displayMode)
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

    // 7. Build response text + image
    const progressText = `${newStamps} / ${merchant.stampTarget} visits`;
    const imageUrl =
      merchant.displayMode === 'image'
        ? stampImageUrl(merchant.templateType, newStamps)
        : undefined;

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
      imageUrl,
      rewardUnlocked,
      completedRewards: newCompletedRewards,
      passId: membership.passId,
      merchant,
      newStamps,
      customerName,
    };
  });

  // 10. Update PassKit pass (outside Firestore transaction — network call)
  try {
    await updateLoyaltyPass(
      membershipId,
      result.newStamps,
      result.merchant.stampTarget,
      result.merchant.rewardName,
      result.customerName
    );
  } catch {
    // Pass update failure is non-critical — stamp is already recorded
  }

  return NextResponse.json({
    progressText: result.progressText,
    imageUrl: result.imageUrl,
    rewardUnlocked: result.rewardUnlocked,
    completedRewards: result.completedRewards,
  });
}
