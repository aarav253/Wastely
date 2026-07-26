import type { ClassificationResult, DisposalCategory } from "../types";

export async function classifyImage(
  imageDataUrl: string,
  state?: string,
  accessToken?: string
): Promise<ClassificationResult> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch("/api/classify", {
    method: "POST",
    headers,
    body: JSON.stringify({ imageDataUrl, state }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `classification request failed (${res.status})`);
  }

  return res.json();
}

export async function submitFeedback(
  scanId: string,
  corrected: boolean,
  correctedCategory: DisposalCategory | null,
  accessToken: string
): Promise<{ points: number } | null> {
  const res = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ scanId, corrected, correctedCategory }),
  });
  if (!res.ok) return null;
  return res.json();
}
