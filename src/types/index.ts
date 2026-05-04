export interface Merchant {
  id: string;
  name: string;
  ownerId: string;
  stampTarget: number;
  rewardName: string;
  templateType: 'grid_6' | 'circle_5' | 'bar_10';
  brandColor: string;
  logoUrl: string;
  displayMode: 'text' | 'image';
  isActive: boolean;
  createdAt: number;
  // PassKit — set manually after creating program+tier in PassKit dashboard
  passkitProgramId?: string;
  passkitTierId?: string;
  // PassKit image IDs for each stamp count: index 0 = 0 stamps, index N = N stamps
  passkitStampImages?: string[];
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
  imageUrl?: string;
  rewardUnlocked: boolean;
  completedRewards: number;
}
