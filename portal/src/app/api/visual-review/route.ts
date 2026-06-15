import { NextRequest, NextResponse } from "next/server";
import {
  saveUploadImages,
  createVisualUpload,
  sectionForMode,
  SECTION_LABEL,
} from "@/lib/visual-uploads";

export const runtime = "nodejs";

const OLLAMA_BASE = process.env.OLLAMA_URL ?? "http://localhost:11434";
const VISION_MODEL = process.env.OLLAMA_VISION_MODEL ?? "qwen2.5vl:3b";

const BASE_PROMPT = `You are a product educator and senior UX designer embedded in the ComfortDelGro Zig product team (Zig is a ride-hailing app in Singapore competing with Grab, Gojek, TADA and inDrive). Your job is to TEACH the team about product flows and features from screenshots — like an interactive training session, not a critique report.

Be concrete and reference what you actually see in the images. Explain the "why" behind design decisions so the reader learns transferable lessons. Avoid generic advice.`;

const MODE_PROMPTS: Record<string, string> = {
  "Beacon Score review": `These screenshots are a UI/UX feature flow submitted by a designer. Analyse the full flow and produce a Beacon Score assessment for the feature. Structure with:

## Feature / flow detected
What feature this appears to be, which user job it supports, and what screens/states are visible.

## Flow walkthrough
Step-by-step explanation of what the user sees, decides, taps, and expects.

## Beacon Score
Give an overall feature score from 0-100. Then score these factors from 0-100:
- Usability clarity
- Conversion confidence
- Trust and safety
- Reliability expectation
- Support deflection
- Competitive parity

For every factor, explain the evidence visible in the screens. If evidence is missing, say what screen/state the designer should add.

## Product impact
Explain how this feature would likely move Zig's Beacon Score, Product Health, complaints, and Opportunity Hub priority.

## UX fixes before build
List the highest-leverage design changes required before engineering starts.

## Final recommendation
Choose one: ready to build, needs iteration, or do not build yet. Explain why.`,

  "Explain this flow": `Walk the reader through the flow like a guided lesson. Structure your response with these markdown sections:

## What this screen does
The purpose of each screen, in plain language a new team member would understand.

## Step-by-step walkthrough
The user journey through the screens: what the user sees, taps, and expects at each step.

## Design patterns used
Name the UI/UX patterns on screen (e.g. bottom sheet, progressive disclosure, skeleton loading) and why they're used here.

## Key lessons
3-5 transferable takeaways the Zig team should remember from this flow.`,

  "Zig deep-dive": `These are screenshots of the Zig app itself. Teach the team about their own product. Structure with:

## Feature overview
What this feature/flow does and the user problem it solves.

## How it works
The mechanics of the flow, screen by screen.

## Strengths to keep
What's well-designed here and why it works — be specific about elements.

## Where it could go next
Evolution ideas: how leading ride-hailing apps handle the same job, and what a v2 could look like.`,

  "Competitor teardown": `These are screenshots of a competitor app. Run a teardown lesson. Structure with:

## Which app and what flow
Identify the app if recognisable (Grab, Gojek, TADA, inDrive, Uber, Lyft...) and what flow is shown.

## How their flow works
Step-by-step mechanics of what the competitor built.

## What they do well
Specific design and product decisions worth learning from, and why they work.

## What Zig can learn
Concrete lessons for the Zig team: patterns worth adopting, traps to avoid, and where Zig can differentiate instead of copying.`,

  "Pattern lessons": `Use these screenshots as teaching material on UI/UX patterns. Structure with:

## Patterns spotted
Each notable pattern on screen, named (e.g. segmented control, map-first layout, fare anchoring) with where it appears.

## Why each pattern works
The usability or business reasoning behind each pattern.

## Industry context
Which leading mobility/consumer apps use the same patterns and how.

## When to use / when to avoid
Practical guidance for applying each pattern in the Zig app.`,
};

function buildSystemPrompt(analysisType: string) {
  const mode = MODE_PROMPTS[analysisType] ?? MODE_PROMPTS["Explain this flow"];
  return `${BASE_PROMPT}\n\n${mode}`;
}

function buildFallbackAnalysis({
  analysisType,
  context,
  imageCount,
  reason,
}: {
  analysisType: string;
  context: string;
  imageCount: number;
  reason: string;
}) {
  const contextLine = context.trim()
    ? `The team context says: "${context.trim()}".`
    : "No extra team context was provided.";

  if (analysisType === "Beacon Score review") {
    return `## Feature / flow detected
${imageCount} screen${imageCount === 1 ? "" : "s"} were uploaded for a Beacon Score review. ${contextLine}

## Flow walkthrough
The visual AI service is currently unavailable, so this limited review cannot inspect exact UI elements. Use this as a triage template until the vision model is available:

1. Identify the entry point, primary action, confirmation state, and any error or loading state.
2. Check whether every screen makes the next step obvious.
3. Confirm that pricing, pickup, payment, support, and safety information are visible before commitment.
4. Verify that the final state tells the rider what happened and what to do next.

## Beacon Score
Overall provisional score: 62 / 100

- Usability clarity: 65 / 100 - needs screen-level validation once the vision model is online.
- Conversion confidence: 60 / 100 - confirm that the user can complete the flow without ambiguity.
- Trust and safety: 58 / 100 - check whether support, safety, driver, fare, and cancellation details are visible.
- Reliability expectation: 62 / 100 - confirm loading, error, and fallback states.
- Support deflection: 55 / 100 - add self-explanatory copy where users usually contact support.
- Competitive parity: 70 / 100 - compare against Grab, Gojek, TADA, and inDrive for the same journey.

## Product impact
This upload is saved for Product Health review. Once the vision model is available, rerun the training session to produce the detailed screen-by-screen score and connect it more tightly to Beacon Score, complaints, and Opportunity Hub.

## UX fixes before build
- Add all missing states: empty, loading, failure, retry, confirmation, and cancellation.
- Make the primary action and next step obvious on every screen.
- Surface fare, pickup, payment, safety, and support information before commitment.
- Reduce copy ambiguity around driver allocation, availability, cancellation, and refunds.

## Final recommendation
Needs iteration. This is a fallback analysis because ${reason}`;
  }

  return `## What this screen does
${imageCount} screen${imageCount === 1 ? "" : "s"} were uploaded for "${analysisType}". ${contextLine}

## Step-by-step walkthrough
The vision model is currently unavailable, so the portal cannot inspect exact pixels right now. Use this limited training pass to structure the review:

1. Name the user job this flow supports.
2. Map the first screen, decision screen, action screen, and final state.
3. Mark any missing loading, error, permission, empty, or confirmation states.
4. Compare the flow against the equivalent Zig or competitor journey.

## Design patterns to check
- Clear page title and current task.
- One obvious primary action per screen.
- Progressive disclosure for secondary details.
- Trust cues for price, driver, pickup, payment, safety, and support.
- Recovery paths for failed booking, failed payment, unavailable supply, or app errors.

## Key lessons
- A usable mobility flow must explain what is happening before the rider commits.
- The best screens reduce support tickets by clarifying fare, timing, cancellation, and next steps.
- Screens should be reviewed as a journey, not as isolated UI snapshots.

## Note
This is a fallback analysis because ${reason} Rerun the training session when Ollama and the configured vision model are available for full visual inspection.`;
}

async function saveFallbackUpload({
  section,
  analysisType,
  context,
  imageUrls,
  analysis,
}: {
  section: ReturnType<typeof sectionForMode>;
  analysisType: string;
  context: string;
  imageUrls: string[];
  analysis: string;
}) {
  try {
    await createVisualUpload({
      section,
      analysisType,
      context,
      images: imageUrls,
      analysis,
    });
  } catch {
    // Persistence should not block the training response.
  }
}

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const files = formData.getAll("images") as File[];
  const context = (formData.get("context") as string | null) ?? "";
  const analysisType = (formData.get("analysisType") as string | null) ?? "Explain this flow";

  if (files.length === 0) {
    return NextResponse.json({ error: "No images provided" }, { status: 400 });
  }

  // Persist the uploaded images to the project and route them to a section.
  const section = sectionForMode(analysisType);
  let imageUrls: string[] = [];
  try {
    imageUrls = await saveUploadImages(files);
  } catch {
    imageUrls = [];
  }

  const base64Images: string[] = [];
  for (const file of files) {
    const buffer = await file.arrayBuffer();
    const b64 = Buffer.from(buffer).toString("base64");
    base64Images.push(b64);
  }

  const userContent = [
    `Training mode: **${analysisType}**`,
    context ? `Context from team: ${context}` : null,
    `I'm sharing ${files.length} screenshot${files.length > 1 ? "s" : ""}. Please analyse ${files.length > 1 ? "these screens" : "this screen"} following the structure for this mode. If this is a Beacon Score review, treat the screenshots as a feature flow and score the entire feature accordingly.`,
  ]
    .filter(Boolean)
    .join("\n\n");

  let ollamaRes: Response;
  try {
    ollamaRes = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: VISION_MODEL,
        stream: true,
        messages: [
          { role: "system", content: buildSystemPrompt(analysisType) },
          {
            role: "user",
            content: userContent,
            images: base64Images,
          },
        ],
      }),
    });
  } catch {
    const fallback = buildFallbackAnalysis({
      analysisType,
      context,
      imageCount: files.length,
      reason: `Ollama is not reachable at ${OLLAMA_BASE}.`,
    });
    await saveFallbackUpload({ section, analysisType, context, imageUrls, analysis: fallback });
    return new Response(fallback, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "X-Upload-Section": section,
        "X-Upload-Section-Label": SECTION_LABEL[section],
        "X-AI-Fallback": "true",
      },
    });
  }

  if (!ollamaRes.ok) {
    const text = await ollamaRes.text().catch(() => "unknown error");
    const fallback = buildFallbackAnalysis({
      analysisType,
      context,
      imageCount: files.length,
      reason: `Ollama returned ${ollamaRes.status}: ${text.slice(0, 180)}`,
    });
    await saveFallbackUpload({ section, analysisType, context, imageUrls, analysis: fallback });
    return new Response(fallback, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "X-Upload-Section": section,
        "X-Upload-Section-Label": SECTION_LABEL[section],
        "X-AI-Fallback": "true",
      },
    });
  }

  const encoder = new TextEncoder();
  let analysisText = "";
  let saved = false;

  async function persist() {
    if (saved) return;
    saved = true;
    try {
      await createVisualUpload({
        section,
        analysisType,
        context,
        images: imageUrls,
        analysis: analysisText,
      });
    } catch {
      // never let persistence break the response
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      const reader = ollamaRes.body?.getReader();
      if (!reader) {
        controller.close();
        return;
      }
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const lines = decoder.decode(value, { stream: true }).split("\n");
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const parsed = JSON.parse(line) as {
                message?: { content?: string };
                done?: boolean;
              };
              const token = parsed.message?.content ?? "";
              if (token) {
                analysisText += token;
                controller.enqueue(encoder.encode(token));
              }
              if (parsed.done) {
                await persist();
                controller.close();
                return;
              }
            } catch {
              // non-JSON line, skip
            }
          }
        }
      } finally {
        await persist();
        reader.releaseLock();
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "X-Upload-Section": section,
      "X-Upload-Section-Label": SECTION_LABEL[section],
    },
  });
}
