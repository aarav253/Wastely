import { Download, RotateCcw, ScanLine, Recycle, Trash2 } from "lucide-react";
import type { ScanRecord } from "../types";

interface HistoryViewProps {
  scans: ScanRecord[];
  onClear: () => void;
  onExport: () => void;
}

export function HistoryView({ scans, onClear, onExport }: HistoryViewProps) {
  const total = scans.length;
  const corrected = scans.filter((s) => s.userCorrected).length;
  const recyclable = scans.filter((s) => (s.correctedCategory ?? s.predictedCategory) === "recyclable").length;

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

      {total === 0 ? (
        <p className="history-empty">No scans yet — items you scan will show up here.</p>
      ) : (
        <>
          <div className="history-actions">
            <button type="button" className="btn btn-secondary" onClick={onExport}>
              <Download size={16} />
              Export data (JSON)
            </button>
            <button type="button" className="btn btn-danger" onClick={onClear}>
              Clear history
            </button>
          </div>

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
        </>
      )}
    </div>
  );
}
