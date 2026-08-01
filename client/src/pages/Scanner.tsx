import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Leaf } from "lucide-react";
import { CameraCapture } from "../components/CameraCapture";
import { ResultCard } from "../components/ResultCard";
import { HistoryView } from "../components/HistoryView";
import { LocationSelector } from "../components/LocationSelector";
import { AuthButton } from "../components/AuthButton";
import { ProfilePanel } from "../components/ProfilePanel";
import { Leaderboard } from "../components/Leaderboard";
import { classifyImage, submitFeedback } from "../lib/api";
import { resizeDataUrl } from "../lib/image";
import { addScan, clearScans, getAllScans, updateScan } from "../lib/db";
import { getStoredLocation, setStoredLocation } from "../lib/location";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { buildImpactReport, buildCsvReport, downloadReport, downloadCsv, type ReportSourceScan } from "../lib/report";
import type { ClassificationResult, DisposalCategory, MaterialCategory, ScanRecord } from "../types";

type Tab = "scan" | "history" | "leaderboard";
type ScanStatus = "idle" | "classifying" | "result" | "error";

const TABS: Tab[] = ["scan", "history", "leaderboard"];
const TAB_LABELS: Record<Tab, string> = { scan: "Scan", history: "History", leaderboard: "Rank" };

export function Scanner() {
  const { session, user, profile, refreshProfile } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [tab, setTab] = useState<Tab>("scan");
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentScanId, setCurrentScanId] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [location, setLocation] = useState(() => getStoredLocation());
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    getAllScans().then(setScans);
  }, []);

  function handleLocationChange(state: string) {
    setLocation(state);
    setStoredLocation(state);
  }

  async function handleCapture(rawDataUrl: string) {
    setStatus("classifying");
    setErrorMessage(null);
    setFeedbackGiven(false);

    try {
      const [displayImage, apiImage, thumbnail] = await Promise.all([
        resizeDataUrl(rawDataUrl, 900),
        resizeDataUrl(rawDataUrl, 1024),
        resizeDataUrl(rawDataUrl, 220, 0.7),
      ]);
      setCapturedImage(displayImage);

      const classification = await classifyImage(apiImage, location || undefined, session?.access_token);

      const record: ScanRecord = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        thumbnailDataUrl: thumbnail,
        predictedCategory: classification.category,
        itemName: classification.itemName,
        confidence: classification.confidence,
        reason: classification.reason,
        estimatedWeightGrams: classification.estimatedWeightGrams,
        materialCategory: classification.materialCategory,
        state: location || null,
        userCorrected: false,
        correctedCategory: null,
      };
      await addScan(record);
      setScans((prev) => [record, ...prev]);
      setCurrentScanId(record.id);
      setResult(classification);
      setStatus("result");
      if (classification.progress) refreshProfile();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  async function sendFeedback(corrected: boolean, correctedCategory: DisposalCategory | null) {
    const scanId = result?.progress?.scanId;
    if (!scanId || !session?.access_token) return;
    try {
      await submitFeedback(scanId, corrected, correctedCategory, session.access_token);
      refreshProfile();
    } catch {
      // Points bonus is non-critical -- the confirm/correct UI already updated optimistically,
      // so a network hiccup here just means the +5 points silently didn't land this time.
    }
  }

  async function handleCorrect(category: DisposalCategory) {
    if (!currentScanId) return;
    await updateScan(currentScanId, { userCorrected: true, correctedCategory: category });
    setScans((prev) =>
      prev.map((s) => (s.id === currentScanId ? { ...s, userCorrected: true, correctedCategory: category } : s))
    );
    setFeedbackGiven(true);
    await sendFeedback(true, category);
  }

  async function handleConfirm() {
    setFeedbackGiven(true);
    await sendFeedback(false, null);
  }

  function resetToScan() {
    setStatus("idle");
    setCapturedImage(null);
    setResult(null);
    setCurrentScanId(null);
    setFeedbackGiven(false);
  }

  async function handleClearHistory() {
    await clearScans();
    setScans([]);
  }

  async function buildCurrentReport() {
    let records: ReportSourceScan[];
    let dataSource: string;

    if (user && supabase) {
      const { data } = await supabase
        .from("scans")
        .select(
          "created_at, item_name, category, corrected_category, estimated_weight_grams, material_category, confidence, state, user_corrected, feedback_given"
        )
        .eq("user_id", user.id);
      records = (data ?? []).map((r) => ({
        timestamp: new Date(r.created_at as string).getTime(),
        itemName: r.item_name as string,
        category: r.category as "recyclable" | "trash",
        correctedCategory: r.corrected_category as string | null,
        estimatedWeightGrams: Number(r.estimated_weight_grams) || 0,
        materialCategory: (r.material_category as MaterialCategory) || "other",
        confidence: Number(r.confidence) || 0,
        state: r.state as string | null,
        userCorrected: Boolean(r.user_corrected),
        feedbackGiven: Boolean(r.feedback_given),
      }));
      dataSource = "Wastely account history (all devices)";
    } else {
      records = scans.map((s) => ({
        timestamp: s.timestamp,
        itemName: s.itemName,
        category: s.predictedCategory,
        correctedCategory: s.correctedCategory,
        estimatedWeightGrams: s.estimatedWeightGrams,
        materialCategory: s.materialCategory,
        confidence: s.confidence,
        state: s.state,
        userCorrected: s.userCorrected,
      }));
      dataSource = "local device history only (not signed in)";
    }

    const accountName = user ? profile?.display_name || user.email || "Wastely user" : "Anonymous (not signed in)";
    return buildImpactReport(records, accountName, dataSource);
  }

  async function handleExportJson() {
    setExporting(true);
    try {
      const report = await buildCurrentReport();
      downloadReport(report, `wastely-impact-report-${new Date().toISOString().slice(0, 10)}.json`);
    } finally {
      setExporting(false);
    }
  }

  async function handleExportCsv() {
    setExporting(true);
    try {
      const report = await buildCurrentReport();
      const csv = buildCsvReport(report);
      downloadCsv(csv, `wastely-impact-report-${new Date().toISOString().slice(0, 10)}.csv`);
    } finally {
      setExporting(false);
    }
  }

  const tabIndex = TABS.indexOf(tab);

  return (
    <div className="scanner-page">
      <div className="scanner-shell">
        <header className="scanner-header">
          <div className="scanner-header-top">
            <Link to="/" className="back-link" aria-label="Back to Wastely website">
              <ArrowLeft size={16} />
              Back to site
            </Link>
            <div style={{ marginLeft: "auto" }}>
              <AuthButton onOpenProfile={() => setProfileOpen(true)} />
            </div>
          </div>

          <span className="scanner-logo">
            <Leaf size={18} />
            Wastely
          </span>
          <p className="scanner-tagline">AI-powered waste sorting assistant</p>

          <div className="scanner-header-meta">
            <LocationSelector value={location} onChange={handleLocationChange} />
          </div>

          <div className="segmented-tabs">
            <div
              className="segmented-indicator"
              style={{
                width: `calc(${100 / TABS.length}% - ${8 / TABS.length}px)`,
                left: `calc(${(tabIndex * 100) / TABS.length}% + 4px)`,
              }}
            />
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                className={`segmented-tab ${tab === t ? "segmented-tab-active" : ""}`}
                onClick={() => setTab(t)}
              >
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>
        </header>

        <main className="scanner-main">
          {tab === "scan" && (
            <>
              {status === "idle" && <CameraCapture onCapture={handleCapture} disabled={false} />}

              {status === "classifying" && (
                <div className="classifying">
                  {capturedImage && (
                    <div className="classifying-thumb-wrap">
                      <img src={capturedImage} alt="Captured item" className="classifying-thumb" />
                      <div className="scan-sweep" />
                    </div>
                  )}
                  <p className="classifying-label">Identifying item…</p>
                </div>
              )}

              {status === "result" && capturedImage && result && (
                <ResultCard
                  imageDataUrl={capturedImage}
                  category={result.category}
                  itemName={result.itemName}
                  confidence={result.confidence}
                  reason={result.reason}
                  estimatedWeightGrams={result.estimatedWeightGrams}
                  materialCategory={result.materialCategory}
                  corrected={feedbackGiven}
                  progress={result.progress}
                  onConfirm={handleConfirm}
                  onCorrect={handleCorrect}
                  onScanAnother={resetToScan}
                />
              )}

              {status === "error" && (
                <div className="error-panel">
                  <p>{errorMessage}</p>
                  <button type="button" className="btn btn-primary" onClick={resetToScan}>
                    Try again
                  </button>
                </div>
              )}
            </>
          )}

          {tab === "history" && (
            <HistoryView
              scans={scans}
              isSignedIn={Boolean(user)}
              exporting={exporting}
              onClear={handleClearHistory}
              onExportJson={handleExportJson}
              onExportCsv={handleExportCsv}
            />
          )}

          {tab === "leaderboard" && <Leaderboard />}
        </main>
      </div>

      <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}
