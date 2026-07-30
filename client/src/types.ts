export type DisposalCategory = "recyclable" | "trash";

export type MaterialCategory = "paper_cardboard" | "plastic" | "metal" | "glass" | "organic" | "electronic" | "other";

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
  estimatedWeightGrams: number;
  materialCategory: MaterialCategory;
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
  estimatedWeightGrams: number;
  materialCategory: MaterialCategory;
  state: string | null;
  userCorrected: boolean;
  correctedCategory: DisposalCategory | null;
}
