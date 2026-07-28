import Anthropic from "@anthropic-ai/sdk";
import type { ClassificationResult } from "../types.js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-5";

const CLASSIFY_TOOL: Anthropic.Tool = {
  name: "emit_classification",
  description: "Emit the waste classification for the item shown in the image.",
  input_schema: {
    type: "object",
    required: ["category", "itemName", "confidence", "reason"],
    properties: {
      category: {
        type: "string",
        enum: ["recyclable", "trash"],
        description:
          "recyclable: commonly accepted in curbside single-stream recycling (clean paper/cardboard, metal cans, rigid plastics #1/#2, glass bottles/jars). trash: everything else, including food waste, soiled/greasy items, plastic film, styrofoam, and anything you cannot confidently identify.",
      },
      itemName: {
        type: "string",
        description: "short human-readable name of the item, e.g. 'aluminum can', 'pizza box (greasy)'",
      },
      confidence: {
        type: "number",
        description: "0 to 1, how confident you are in the classification",
      },
      reason: {
        type: "string",
        description: "one short sentence explaining why, in plain language a user can act on",
      },
      estimatedWeightGrams: {
        type: "number",
        description:
          "rough typical weight of this item in grams, based on general knowledge of similar items (e.g. an empty aluminum can ~15g, a plastic water bottle ~20g, a pizza box ~150g, a glass jar ~180g). This is a directional estimate for tracking trends, not a precise measurement -- do not overthink it, just give a reasonable ballpark.",
      },
    },
  },
};

const BASE_SYSTEM_PROMPT = `You are the vision classifier inside Wastely, an AI waste-sorting assistant. You are shown a single photo of one item. Identify the item, classify it as "recyclable" or "trash", and give a rough estimated weight in grams. When uncertain about the category, prefer "trash" (over-claiming recyclability causes real contamination problems at recycling facilities). Always respond by calling the emit_classification tool exactly once.`;

function buildSystemPrompt(state?: string): string {
  if (!state) {
    return `${BASE_SYSTEM_PROMPT} The user hasn't specified a location, so classify per typical US curbside single-stream recycling norms.`;
  }
  return `${BASE_SYSTEM_PROMPT} The user is located in ${state}. Where you're reasonably confident it changes the answer, factor in ${state}'s general curbside recycling norms (for example, some states/municipalities accept glass or plastic film curbside while most don't). Exact rules still vary by city and hauler within any state, so don't invent specific local program details you aren't confident about — keep the "reason" general enough to stay accurate, and default to typical US norms when you lack state-specific knowledge.`;
}

export async function classifyImage(
  base64Data: string,
  mediaType: string,
  state?: string
): Promise<ClassificationResult> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: buildSystemPrompt(state),
    tools: [CLASSIFY_TOOL],
    tool_choice: { type: "tool", name: "emit_classification" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType as "image/jpeg" | "image/png" | "image/webp",
              data: base64Data,
            },
          },
          {
            type: "text",
            text: "Classify the item in this image.",
          },
        ],
      },
    ],
  });

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );

  if (!toolUse) {
    throw new Error("Model did not return a classification");
  }

  const input = toolUse.input as ClassificationResult;
  return {
    category: input.category === "recyclable" ? "recyclable" : "trash",
    itemName: input.itemName || "Unknown item",
    confidence: Math.max(0, Math.min(1, Number(input.confidence) || 0)),
    reason: input.reason || "",
    estimatedWeightGrams: Math.max(0, Number(input.estimatedWeightGrams) || 0),
  };
}
