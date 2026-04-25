import type { Merchant } from '@/types';

const BASE = 'https://api.passkit.com/v1';

function headers() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.PASSKIT_API_KEY}`,
  };
}

export async function createLoyaltyPass(
  membershipId: string,
  merchant: Merchant
): Promise<{ passId: string; passUrl: string }> {
  const res = await fetch(`${BASE}/pass/issue/single/${process.env.PASSKIT_PROGRAM_ID}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      templateName: merchant.templateType,
      dynamicData: {
        primaryFields: [{ key: 'stamps', value: `0 / ${merchant.stampTarget} visits` }],
        secondaryFields: [{ key: 'status', value: `Start collecting stamps` }],
      },
      barcodeContent: membershipId,
      backgroundColor: merchant.brandColor,
      logoText: merchant.name,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PassKit createPass failed: ${err}`);
  }

  const data = await res.json();
  return {
    passId: data.id ?? data.passId ?? membershipId,
    passUrl: data.passUrl ?? data.url ?? `${BASE}/pass/${data.id}`,
  };
}

export async function updateLoyaltyPass(
  passId: string,
  stamps: number,
  stampTarget: number,
  rewardName: string,
  imageUrl?: string
): Promise<void> {
  const remaining = stampTarget - stamps;
  const secondaryValue =
    stamps === 0 && remaining === stampTarget
      ? `Reward unlocked: ${rewardName}`
      : `${remaining} more to get ${rewardName}`;

  const body: Record<string, unknown> = {
    dynamicData: {
      primaryFields: [{ key: 'stamps', value: `${stamps} / ${stampTarget} visits` }],
      secondaryFields: [{ key: 'status', value: secondaryValue }],
    },
  };

  if (imageUrl) {
    body.thumbnailImage = imageUrl;
  }

  const res = await fetch(`${BASE}/pass/update/${passId}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PassKit updatePass failed: ${err}`);
  }
}
