export interface Merchant {
  id: string;
  name: string;
  ownerId: string;
  stampTarget: number;
  brandColor?: string;
  logoUrl?: string;
  description?: string;
  isActive: boolean;
  createdAt: number;
  // PassKit — set manually after creating program+tier in PassKit dashboard
  passkitProgramId?: string;
  passkitTierId?: string;
  merchantInfo?: string;
  // PassKit image IDs per stamp count — strip = Apple Wallet, hero = Google Wallet
  passkitStampImages?: Array<{ strip: string; hero: string } | null>;
}

export interface PublicMerchant {
  id: string;
  name: string;
  brandColor?: string;
  logoUrl?: string;
  description?: string;
  isActive: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  createdAt: number;
}

export interface Membership {
  id: string;
  merchantId: string;
  customerId: string;
  stamps: number;
  completedRewards: number;
  passId: string;
  passUrl?: string | null;
  lastScanAt: number;
  dailyScanCount: number;
  lastScanDate: string; // "YYYY-MM-DD"
  createdAt: number;
}

export interface Transaction {
  id: string;
  merchantId: string;
  customerId: string;
  type: 'stamp' | 'reward';
  value: number;
  createdBy: string;
  createdAt: number;
}

export interface ScanResult {
  progressText: string;
  rewardUnlocked: boolean;
  rewardRedeemed: boolean;
  completedRewards: number;
}
