import { Router } from "express";
import { classifyImage } from "../lib/claude.js";
import { US_STATES } from "../lib/usStates.js";
import { getUserFromAuthHeader, recordScan } from "../lib/supabase.js";

const ALLOWED_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export const classifyRouter = Router();

classifyRouter.post("/classify", async (req, res) => {
  const { imageDataUrl, state } = req.body as { imageDataUrl?: string; state?: string };
  const validState = typeof state === "string" && US_STATES.has(state) ? state : undefined;

  if (!imageDataUrl || typeof imageDataUrl !== "string") {
    res.status(400).json({ error: "imageDataUrl is required" });
    return;
  }

  const match = imageDataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) {
    res.status(400).json({ error: "imageDataUrl must be a base64 data URL" });
    return;
  }

  const [, mediaType, base64Data] = match;
  if (!ALLOWED_MEDIA_TYPES.has(mediaType)) {
    res.status(400).json({ error: `unsupported image type: ${mediaType}` });
    return;
  }

  try {
    const result = await classifyImage(base64Data, mediaType, validState);

    const user = await getUserFromAuthHeader(req.headers.authorization);
    let progress = null;
    if (user) {
      const recorded = await recordScan(user.id, {
        itemName: result.itemName,
        category: result.category,
        confidence: result.confidence,
        reason: result.reason,
        state: validState,
        estimatedWeightGrams: result.estimatedWeightGrams,
      });
      if (recorded) {
        progress = {
          scanId: recorded.scanId,
          points: recorded.points,
          scanCount: recorded.scanCount,
          currentStreak: recorded.currentStreak,
          longestStreak: recorded.longestStreak,
          pointsEarned: 10 + Math.min(recorded.currentStreak, 10) * 2,
        };
      }
    }

    res.json({ ...result, progress });
  } catch (err) {
    console.error("classification failed:", err);
    res.status(502).json({ error: "classification failed" });
  }
});
