export type DisposalCategory = "recyclable" | "trash";

export type MaterialCategory = "paper_cardboard" | "plastic" | "metal" | "glass" | "organic" | "electronic" | "other";

export interface ClassificationResult {
  category: DisposalCategory;
  itemName: string;
  confidence: number;
  reason: string;
  estimatedWeightGrams: number;
  materialCategory: MaterialCategory;
}
