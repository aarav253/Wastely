const GRAMS_PER_POUND = 453.592;

/** Formats an AI-estimated weight for display, e.g. "~15 g" or "~0.4 lbs". */
export function formatEstimatedWeight(grams: number): string {
  if (!grams || grams <= 0) return "";
  if (grams < 454) return `~${Math.round(grams)} g`;
  return `~${(grams / GRAMS_PER_POUND).toFixed(1)} lbs`;
}

export function gramsToPounds(grams: number): number {
  return grams / GRAMS_PER_POUND;
}
