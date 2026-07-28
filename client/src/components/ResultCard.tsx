import { motion } from "framer-motion";
import { Recycle, Trash2, ThumbsUp, ThumbsDown, Sparkles, ScanLine, Flame, Zap, Scale } from "lucide-react";
import type { DisposalCategory, ScanProgress } from "../types";
import { formatEstimatedWeight } from "../lib/weight";

interface ResultCardProps {
  imageDataUrl: string;
  category: DisposalCategory;
  itemName: string;
  confidence: number;
  reason: string;
  estimatedWeightGrams: number;
  corrected: boolean;
  progress: ScanProgress | null;
  onConfirm: () => void;
  onCorrect: (category: DisposalCategory) => void;
  onScanAnother: () => void;
}

export function ResultCard({
  imageDataUrl,
  category,
  itemName,
  confidence,
  reason,
  estimatedWeightGrams,
  corrected,
  progress,
  onConfirm,
  onCorrect,
  onScanAnother,
}: ResultCardProps) {
  const isRecyclable = category === "recyclable";

  return (
    <motion.div
      className="result-card"
      initial={{ opacity: 0, scale: 0.94, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {progress && (
        <motion.div
          className="points-toast"
          initial={{ opacity: 0, y: -8, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <Zap size={13} />
          +{progress.pointsEarned} points
          {progress.currentStreak > 1 && (
            <span className="points-toast-streak">
              <Flame size={12} />
              {progress.currentStreak}-day streak
            </span>
          )}
        </motion.div>
      )}

      <div className="result-thumb-wrap">
        <img src={imageDataUrl} alt={itemName} className="result-thumb" />
        <div className={`result-icon-badge ${isRecyclable ? "icon-badge-recyclable" : "icon-badge-trash"}`}>
          {isRecyclable ? <Recycle size={24} /> : <Trash2 size={24} />}
        </div>
      </div>

      <div className={`category-pill ${isRecyclable ? "pill-recyclable" : "pill-trash"}`} style={{ marginTop: 22 }}>
        {isRecyclable ? <Recycle size={12} /> : <Trash2 size={12} />}
        {isRecyclable ? "Recyclable" : "Trash"}
      </div>

      <h2 className="result-item-name">{itemName}</h2>

      <div className="confidence-row">
        <div className="confidence-track">
          <motion.div
            className="confidence-fill"
            initial={{ width: 0 }}
            animate={{ width: `${Math.round(confidence * 100)}%` }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
          />
        </div>
        <span className="confidence-label">{Math.round(confidence * 100)}% confident</span>
      </div>

      <p className="result-reason">{reason}</p>

      {estimatedWeightGrams > 0 && (
        <p className="result-weight">
          <Scale size={12} />
          Est. weight {formatEstimatedWeight(estimatedWeightGrams)}
          <span className="result-weight-note">(AI estimate)</span>
        </p>
      )}

      {!corrected ? (
        <div className="feedback-row">
          <p className="feedback-prompt">
            <ScanLine size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />
            Was this correct?{progress && " (+5 points)"}
          </p>
          <div className="feedback-buttons">
            <button type="button" className="btn btn-secondary" onClick={onConfirm}>
              <ThumbsUp size={16} />
              Yes
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onCorrect(isRecyclable ? "trash" : "recyclable")}
            >
              <ThumbsDown size={16} />
              No, it's {isRecyclable ? "trash" : "recyclable"}
            </button>
          </div>
        </div>
      ) : (
        <p className="feedback-thanks">
          <Sparkles size={14} />
          Thanks — saved to your scan history for future improvements.
        </p>
      )}

      <button type="button" className="btn btn-primary scan-another" onClick={onScanAnother}>
        Scan another item
      </button>
    </motion.div>
  );
}
