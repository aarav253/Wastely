import "dotenv/config";
import express from "express";
import cors from "cors";
import { classifyRouter } from "./routes/classify.js";
import { feedbackRouter } from "./routes/feedback.js";
import { supabaseAdmin } from "./lib/supabase.js";

const app = express();
// API_PORT (from .env) always wins for local dev, since some sandboxes/hosts
// inject their own generic PORT that isn't meant for this server. Render and
// similar PaaS hosts inject PORT and don't set API_PORT, so it's used there.
const PORT = Number(process.env.API_PORT) || Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    hasApiKey: Boolean(process.env.ANTHROPIC_API_KEY),
    hasAccounts: Boolean(supabaseAdmin),
  });
});

app.use("/api", classifyRouter);
app.use("/api", feedbackRouter);

app.listen(PORT, () => {
  console.log(`Wastely server listening on http://localhost:${PORT}`);
});
