import { Download, FileSpreadsheet, RotateCcw, ScanLine, Recycle, Trash2 } from "lucide-react";
import type { ScanRecord } from "../types";

interface HistoryViewProps {
  scans: ScanRecord[];
  isSignedIn: boolean;
  exporting: boolean;
  onClear: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
}

export function HistoryView({ scans, isSignedIn, exporting, onClear, onExportJson, onExportCsv }: HistoryViewProps) {
  const total = scans.length;
  const corrected = scans.filter((s) => s.userCorrected).length;
  const recyclable = scans.filter((s) => (s.correctedCategory ?? s.predictedCategory) === "recyclable").length;
  const canExport = total > 0 || isSignedIn;

  return (
    <div className="history-view">
      <div className="history-stats">
        <div className="stat">
          <ScanLine size={18} className="stat-icon" />
          <span className="stat-value">{total}</span>
          <span className="stat-label">Scans</span>
        </div>
        <div className="stat">
          <Recycle size={18} className="stat-icon" />
          <span className="stat-value">{recyclable}</span>
          <span className="stat-label">Recyclable</span>
        </div>
        <div className="stat">
          <Trash2 size={18} className="stat-icon" />
          <span className="stat-value">{total - recyclable}</span>
          <span className="stat-label">Trash</span>
        </div>
        <div className="stat">
          <RotateCcw size={18} className="stat-icon" />
          <span className="stat-value">{corrected}</span>
          <span className="stat-label">Corrections</span>
        </div>
      </div>

      {canExport && (
        <div className="history-actions">
          <button type="button" className="btn btn-secondary" onClick={onExportCsv} disabled={exporting}>
            <FileSpreadsheet size={16} />
            {exporting ? "Exporting…" : "Export summary (CSV)"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onExportJson} disabled={exporting}>
            <Download size={16} />
            {exporting ? "Exporting…" : "Export full report (JSON)"}
          </button>
          {total > 0 && (
            <button type="button" className="btn btn-danger" onClick={onClear}>
              Clear local history
            </button>
          )}
        </div>
      )}

      {canExport && (
        <p className="history-export-note">
          CSV opens directly in Excel/Sheets — best for a quick look or sharing. JSON has the full structured
          breakdown (GRI 306-aligned) for feeding into other tools.
          {isSignedIn && " Export pulls your full account history (all devices); \"Clear\" only clears this device's local copy."}
        </p>
      )}

      {total === 0 ? (
        <p className="history-empty">No scans on this device yet — items you scan will show up here.</p>
      ) : (
        <ul className="history-list">
          {scans.map((scan) => {
            const finalCategory = scan.correctedCategory ?? scan.predictedCategory;
            const isRecyclable = finalCategory === "recyclable";
            return (
              <li key={scan.id} className="history-item">
                <img src={scan.thumbnailDataUrl} alt={scan.itemName} className="history-thumb" />
                <div className="history-item-body">
                  <div className="history-item-top">
                    <span className="history-item-name">{scan.itemName}</span>
                    <span className={`category-pill ${isRecyclable ? "pill-recyclable" : "pill-trash"}`}>
                      {isRecyclable ? <Recycle size={11} /> : <Trash2 size={11} />}
                      {isRecyclable ? "Recyclable" : "Trash"}
                    </span>
                  </div>
                  <span className="history-item-time">
                    {new Date(scan.timestamp).toLocaleString()}
                    {scan.state && ` · ${scan.state}`}
                    {scan.userCorrected && " · corrected"}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
