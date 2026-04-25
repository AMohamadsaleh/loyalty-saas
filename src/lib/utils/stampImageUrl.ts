export function stampImageUrl(templateType: string, stamps: number): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? '';
  return `${base}/stamps/${templateType}/${stamps}.png`;
}
