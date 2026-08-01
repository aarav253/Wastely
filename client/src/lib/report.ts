import type { DisposalCategory, MaterialCategory } from "../types";
import { MATERIAL_LABELS } from "./material";

const GRAMS_PER_METRIC_TON = 1_000_000;
const GRAMS_PER_KG = 1_000;
const GRAMS_PER_POUND = 453.592;

export interface ReportSourceScan {
  timestamp: number;
  itemName: string;
  category: DisposalCategory;
  correctedCategory?: string | null;
  estimatedWeightGrams: number;
  materialCategory: MaterialCategory;
  confidence: number;
  state: string | null;
  userCorrected: boolean;
  feedbackGiven?: boolean;
}

interface MaterialBreakdownRow {
  materialCategory: MaterialCategory;
  weightMetricTons: number;
  scanCount: number;
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
    alignedWith: string;
    methodology: string;
    limitations: string[];
    disclaimer: string;
  };
  disclosures: {
    "306-3_wasteGenerated": {
      description: string;
      totalWeightMetricTons: number;
      byMaterialCategory: MaterialBreakdownRow[];
    };
    "306-4_wasteDivertedFromDisposal": {
      description: string;
      totalWeightMetricTons: number;
      byRecoveryOperation: { operation: string; weightMetricTons: number }[];
      byMaterialCategory: MaterialBreakdownRow[];
    };
    "306-5_wasteDirectedToDisposal": {
      description: string;
      totalWeightMetricTons: number;
      byDisposalOperation: { operation: string; weightMetricTons: number }[];
      byMaterialCategory: MaterialBreakdownRow[];
    };
  };
  estimatedDiversionRatePercent: number | null;
  scans: {
    date: string;
    itemName: string;
    category: DisposalCategory;
    materialCategory: MaterialCategory;
    estimatedWeightKg: number;
    confidence: number;
    state: string | null;
    userReviewed: boolean;
  }[];
}

const METHODOLOGY =
  "Item category, material composition, and weight are estimated by an AI vision model (Claude) from a single photo taken at the moment of disposal. Weights are directional estimates based on the model's general knowledge of typical item weights -- they are not scale-verified measurements.";

const LIMITATIONS = [
  "Weights are AI-estimated from photos, not scale-verified -- treat all weight figures as directional, not audit-grade measurements.",
  "Wastely only distinguishes two outcomes (recycling vs. general disposal); it does not track reuse-preparation, composting, incineration, or other specific recovery/disposal operations, so those breakdowns are approximated as a single category each below.",
  "A recorded 'recyclable' scan reflects the app's classification at the point of disposal, not confirmation that the item was actually received and processed by a recycling facility.",
];

const DISCLAIMER =
  "This report presents Wastely data in a structure aligned with GRI 306: Waste 2020 (Disclosures 306-3, 306-4, 306-5) to ease incorporation into a broader sustainability report. It is intended as supporting documentation only -- it is not itself a certified ESG, CSR, or waste-diversion filing, and the underlying data has not been independently verified or assured. Consult your auditor, reporting framework (e.g. GRI, SASB, CDP), or certification body (e.g. LEED, B Corp) about whether and how this data can support a formal submission.";

function summarizeByMaterial(
  scans: { materialCategory: MaterialCategory; estimatedWeightGrams: number }[]
): MaterialBreakdownRow[] {
  const totals = new Map<MaterialCategory, { grams: number; count: number }>();
  for (const s of scans) {
    const entry = totals.get(s.materialCategory) ?? { grams: 0, count: 0 };
    entry.grams += s.estimatedWeightGrams;
    entry.count += 1;
    totals.set(s.materialCategory, entry);
  }
  return [...totals.entries()]
    .map(([materialCategory, { grams, count }]) => ({
      materialCategory,
      weightMetricTons: Number((grams / GRAMS_PER_METRIC_TON).toFixed(6)),
      scanCount: count,
    }))
    .sort((a, b) => b.weightMetricTons - a.weightMetricTons);
}

export function buildImpactReport(records: ReportSourceScan[], accountName: string, dataSource: string): ImpactReport {
  const sorted = [...records].sort((a, b) => a.timestamp - b.timestamp);

  const resolved = sorted.map((r) => ({
    ...r,
    // Records written before materialCategory/estimatedWeightGrams existed (older local
    // IndexedDB history) won't have these fields -- default them so they don't silently
    // vanish from the JSON output (undefined values are dropped by JSON.stringify) and
    // so they still land somewhere sane in the material breakdown instead of splitting
    // into a bogus "undefined" bucket.
    materialCategory: r.materialCategory ?? "other",
    estimatedWeightGrams: r.estimatedWeightGrams ?? 0,
    finalCategory: ((r.correctedCategory as DisposalCategory | null | undefined) ?? r.category) as DisposalCategory,
  }));

  const diverted = resolved.filter((r) => r.finalCategory === "recyclable");
  const disposed = resolved.filter((r) => r.finalCategory === "trash");

  const totalGrams = resolved.reduce((sum, r) => sum + r.estimatedWeightGrams, 0);
  const divertedGrams = diverted.reduce((sum, r) => sum + r.estimatedWeightGrams, 0);
  const disposedGrams = disposed.reduce((sum, r) => sum + r.estimatedWeightGrams, 0);

  return {
    reportMetadata: {
      generatedAt: new Date().toISOString(),
      generatedBy: "Wastely (https://wastely-client-ten.vercel.app)",
      accountName,
      dataSource,
      periodStart: resolved[0] ? new Date(resolved[0].timestamp).toISOString() : null,
      periodEnd: resolved[resolved.length - 1] ? new Date(resolved[resolved.length - 1].timestamp).toISOString() : null,
      totalRecords: resolved.length,
      alignedWith: "GRI 306: Waste 2020 (Disclosures 306-3, 306-4, 306-5)",
      methodology: METHODOLOGY,
      limitations: LIMITATIONS,
      disclaimer: DISCLAIMER,
    },
    disclosures: {
      "306-3_wasteGenerated": {
        description: "Total waste generated, by material category, in metric tons.",
        totalWeightMetricTons: Number((totalGrams / GRAMS_PER_METRIC_TON).toFixed(6)),
        byMaterialCategory: summarizeByMaterial(resolved),
      },
      "306-4_wasteDivertedFromDisposal": {
        description: "Waste diverted from disposal via recovery operations, by material category, in metric tons.",
        totalWeightMetricTons: Number((divertedGrams / GRAMS_PER_METRIC_TON).toFixed(6)),
        byRecoveryOperation: [
          { operation: "recycling", weightMetricTons: Number((divertedGrams / GRAMS_PER_METRIC_TON).toFixed(6)) },
        ],
        byMaterialCategory: summarizeByMaterial(diverted),
      },
      "306-5_wasteDirectedToDisposal": {
        description: "Waste directed to disposal, by material category, in metric tons.",
        totalWeightMetricTons: Number((disposedGrams / GRAMS_PER_METRIC_TON).toFixed(6)),
        byDisposalOperation: [
          {
            operation: "unspecified (Wastely does not track landfill vs. incineration vs. other disposal method)",
            weightMetricTons: Number((disposedGrams / GRAMS_PER_METRIC_TON).toFixed(6)),
          },
        ],
        byMaterialCategory: summarizeByMaterial(disposed),
      },
    },
    estimatedDiversionRatePercent: totalGrams > 0 ? Number(((divertedGrams / totalGrams) * 100).toFixed(1)) : null,
    scans: resolved.map((r) => ({
      date: new Date(r.timestamp).toISOString(),
      itemName: r.itemName,
      category: r.finalCategory,
      materialCategory: r.materialCategory,
      estimatedWeightKg: Number((r.estimatedWeightGrams / GRAMS_PER_KG).toFixed(4)),
      confidence: r.confidence,
      state: r.state,
      userReviewed: Boolean(r.feedbackGiven ?? r.userCorrected),
    })),
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

function csvCell(value: string | number | boolean): string {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function csvRow(cells: (string | number | boolean)[]): string {
  return cells.map(csvCell).join(",");
}

function lbs(grams: number): number {
  return Number((grams / GRAMS_PER_POUND).toFixed(2));
}

/** Human-readable spreadsheet version of the same report -- meant to be opened and read
 * directly in Excel/Sheets, not parsed by machine (the JSON export is for that). */
export function buildCsvReport(report: ImpactReport): string {
  const lines: string[] = [];

  lines.push(csvRow(["Wastely Impact Report"]));
  lines.push(csvRow(["Generated", new Date(report.reportMetadata.generatedAt).toLocaleString()]));
  lines.push(csvRow(["Account", report.reportMetadata.accountName]));
  lines.push(csvRow(["Data source", report.reportMetadata.dataSource]));
  lines.push(
    csvRow([
      "Period",
      report.reportMetadata.periodStart ? new Date(report.reportMetadata.periodStart).toLocaleDateString() : "--",
      "to",
      report.reportMetadata.periodEnd ? new Date(report.reportMetadata.periodEnd).toLocaleDateString() : "--",
    ])
  );
  lines.push("");

  lines.push(csvRow(["Summary"]));
  lines.push(csvRow(["Metric", "Value"]));
  lines.push(csvRow(["Total scans", report.reportMetadata.totalRecords]));
  lines.push(csvRow(["Recyclable (diverted) weight, lbs", lbs(report.disclosures["306-4_wasteDivertedFromDisposal"].totalWeightMetricTons * GRAMS_PER_METRIC_TON)]));
  lines.push(csvRow(["Trash (disposed) weight, lbs", lbs(report.disclosures["306-5_wasteDirectedToDisposal"].totalWeightMetricTons * GRAMS_PER_METRIC_TON)]));
  lines.push(csvRow(["Total weight, lbs", lbs(report.disclosures["306-3_wasteGenerated"].totalWeightMetricTons * GRAMS_PER_METRIC_TON)]));
  lines.push(csvRow(["Estimated diversion rate", report.estimatedDiversionRatePercent !== null ? `${report.estimatedDiversionRatePercent}%` : "--"]));
  lines.push("");

  lines.push(csvRow(["Waste by material category"]));
  lines.push(csvRow(["Material", "Weight, lbs", "Scan count"]));
  for (const row of report.disclosures["306-3_wasteGenerated"].byMaterialCategory) {
    lines.push(csvRow([MATERIAL_LABELS[row.materialCategory], lbs(row.weightMetricTons * GRAMS_PER_METRIC_TON), row.scanCount]));
  }
  lines.push("");

  lines.push(csvRow(["Scan details"]));
  lines.push(csvRow(["Date", "Item", "Category", "Material", "Est. weight, lbs", "Confidence", "State", "Reviewed by user"]));
  for (const s of report.scans) {
    lines.push(
      csvRow([
        new Date(s.date).toLocaleString(),
        s.itemName,
        s.category === "recyclable" ? "Recyclable" : "Trash",
        MATERIAL_LABELS[s.materialCategory],
        lbs(s.estimatedWeightKg * GRAMS_PER_KG),
        `${Math.round(s.confidence * 100)}%`,
        s.state ?? "",
        s.userReviewed ? "Yes" : "No",
      ])
    );
  }
  lines.push("");
  lines.push(csvRow(["Note: weights are AI-estimated from photos, not scale-verified. See the JSON export for full methodology and limitations."]));

  return lines.join("\r\n");
}

export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
