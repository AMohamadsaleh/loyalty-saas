export const runtime = 'nodejs';

/**
 * POST /api/passkit-upload-images
 * Uploads stamp progress images (0/target through target/target) to PassKit.
 *
 * Request body: multipart/form-data OR JSON with base64 images
 *
 * Simpler: reads images from /public/stamps/{templateType}/*.png and uploads them.
 * Returns a JSON array of image IDs — paste this into PASSKIT_STAMP_IMAGES env var.
 *
 * Usage: POST /api/passkit-upload-images?template=grid_6
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { uploadPassKitImage } from '@/lib/passkit/client';

export async function POST(req: NextRequest) {
  const template = new URL(req.url).searchParams.get('template') ?? 'grid_6';

  // Derive stamp count from template name (grid_6 → 6, circle_5 → 5, bar_10 → 10)
  const match = template.match(/(\d+)$/);
  if (!match) {
    return NextResponse.json({ error: 'Unknown template format. Use grid_6, circle_5, or bar_10' }, { status: 400 });
  }
  const stampTarget = parseInt(match[1], 10);

  const imageIds: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i <= stampTarget; i++) {
    const imagePath = join(process.cwd(), 'public', 'stamps', template, `${i}.png`);
    try {
      const imageBuffer = readFileSync(imagePath);
      const base64 = imageBuffer.toString('base64');
      const id = await uploadPassKitImage(base64, `stamp_${template}_${i}`);
      imageIds.push(id);
    } catch (err) {
      errors.push(`Image ${i}: ${err}`);
      imageIds.push(''); // placeholder so indexes stay aligned
    }
  }

  return NextResponse.json({
    imageIds,
    errors: errors.length ? errors : undefined,
    envVar: `PASSKIT_STAMP_IMAGES=${JSON.stringify(imageIds)}`,
    note: 'Copy the envVar value into your Vercel environment variables',
  });
}
