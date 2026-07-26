import { Router } from "express";
import { getUserFromAuthHeader, recordFeedback } from "../lib/supabase.js";

export const feedbackRouter = Router();

feedbackRouter.post("/feedback", async (req, res) => {
  const { scanId, corrected, correctedCategory } = req.body as {
    scanId?: string;
    corrected?: boolean;
    correctedCategory?: "recyclable" | "trash" | null;
  };

  if (!scanId || typeof scanId !== "string") {
    res.status(400).json({ error: "scanId is required" });
    return;
  }

  const user = await getUserFromAuthHeader(req.headers.authorization);
  if (!user) {
    res.status(401).json({ error: "sign in required" });
    return;
  }

  const result = await recordFeedback(scanId, user.id, Boolean(corrected), correctedCategory ?? null);
  if (!result) {
    res.status(502).json({ error: "failed to record feedback" });
    return;
  }

  res.json(result);
});
