export type DisposalCategory = "recyclable" | "trash";

export interface ScanProgress {
  scanId: string;
  points: number;
  scanCount: number;
  currentStreak: number;
  longestStreak: number;
  pointsEarned: number;
}

export interface ClassificationResult {
  category: DisposalCategory;
  itemName: string;
  confidence: number;
  reason: string;
  progress: ScanProgress | null;
}

export interface ScanRecord {
  id: string;
  timestamp: number;
  thumbnailDataUrl: string;
  predictedCategory: DisposalCategory;
  itemName: string;
  confidence: number;
  reason: string;
  state: string | null;
  userCorrected: boolean;
  correctedCategory: DisposalCategory | null;
}
