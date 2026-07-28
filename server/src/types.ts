export type DisposalCategory = "recyclable" | "trash";

export interface ClassificationResult {
  category: DisposalCategory;
  itemName: string;
  confidence: number;
  reason: string;
  estimatedWeightGrams: number;
}
