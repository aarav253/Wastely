const GRAMS_PER_POUND = 453.592;

export interface ReportSourceScan {
  timestamp: number;
  itemName: string;
  category: "recyclable" | "trash";
  correctedCategory?: string | null;
  estimatedWeightGrams: number;
  confidence: number;
  state: string | null;
  userCorrected: boolean;
  feedbackGiven?: boolean;
}

export interface ImpactReport {
  reportMetadata: {
    generatedAt: string;
    generatedBy: string;
    accountName: string;
    dataSource: string;
    periodStart: string | null;
    periodEnd: string | null;
    totalRecords: number;
    methodology: string;
    disclaimer: string;
  };
  summary: {
    totalScans: number;
    recyclableScans: number;
    trashScans: number;
    totalEstimatedWeightLbs: number;
    recyclableWeightLbs: number;
    trashWeightLbs: number;
    estimatedDiversionRatePercent: number | null;
    userReviewedScans: number;
  };
  scans: {
    date: string;
    itemName: string;
    category: "recyclable" | "trash";
    estimatedWeightLbs: number;
    confidence: number;
    state: string | null;
    userReviewed: boolean;
  }[];
}

const METHODOLOGY =
  "Item category and weight are estimated by an AI vision model (Claude) from a single photo taken at the moment of disposal. Weights are directional estimates based on the model's general knowledge of typical item weights -- they are not scale-verified measurements.";

const DISCLAIMER =
  "This export is intended as supporting documentation for internal sustainability tracking. It does not itself constitute a certified ESG, CSR, or waste-diversion filing, and the underlying data has not been independently verified. Consult your auditor, the relevant reporting framework (e.g. GRI, SASB, CDP), or certification body (e.g. LEED, B Corp) about whether and how this data can support a formal submission.";

export function buildImpactReport(records: ReportSourceScan[], accountName: string, dataSource: string): ImpactReport {
  const sorted = [...records].sort((a, b) => a.timestamp - b.timestamp);

  const scans = sorted.map((r) => {
    const category = (r.correctedCategory as "recyclable" | "trash" | null | undefined) ?? r.category;
    return {
      date: new Date(r.timestamp).toISOString(),
      itemName: r.itemName,
      category,
      estimatedWeightLbs: Number((r.estimatedWeightGrams / GRAMS_PER_POUND).toFixed(3)),
      confidence: r.confidence,
      state: r.state,
      userReviewed: Boolean(r.feedbackGiven ?? r.userCorrected),
    };
  });

  const totalWeightLbs = scans.reduce((sum, s) => sum + s.estimatedWeightLbs, 0);
  const recyclable = scans.filter((s) => s.category === "recyclable");
  const trash = scans.filter((s) => s.category === "trash");
  const recyclableWeightLbs = recyclable.reduce((sum, s) => sum + s.estimatedWeightLbs, 0);
  const trashWeightLbs = trash.reduce((sum, s) => sum + s.estimatedWeightLbs, 0);

  return {
    reportMetadata: {
      generatedAt: new Date().toISOString(),
      generatedBy: "Wastely (https://wastely-client-ten.vercel.app)",
      accountName,
      dataSource,
      periodStart: scans[0]?.date ?? null,
      periodEnd: scans[scans.length - 1]?.date ?? null,
      totalRecords: scans.length,
      methodology: METHODOLOGY,
      disclaimer: DISCLAIMER,
    },
    summary: {
      totalScans: scans.length,
      recyclableScans: recyclable.length,
      trashScans: trash.length,
      totalEstimatedWeightLbs: Number(totalWeightLbs.toFixed(2)),
      recyclableWeightLbs: Number(recyclableWeightLbs.toFixed(2)),
      trashWeightLbs: Number(trashWeightLbs.toFixed(2)),
      estimatedDiversionRatePercent:
        totalWeightLbs > 0 ? Number(((recyclableWeightLbs / totalWeightLbs) * 100).toFixed(1)) : null,
      userReviewedScans: scans.filter((s) => s.userReviewed).length,
    },
    scans,
  };
}

export function downloadReport(report: ImpactReport, filename: string): void {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
