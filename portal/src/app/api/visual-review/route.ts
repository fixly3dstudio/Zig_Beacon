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
    return NextResponse.json(
      {
        error:
          `Ollama is not reachable. Make sure it's running with \`ollama serve\` and that the vision model is pulled (\`ollama pull ${VISION_MODEL}\`).`,
      },
      { status: 503 }
    );
  }

  if (!ollamaRes.ok) {
    const text = await ollamaRes.text().catch(() => "unknown error");
    return NextResponse.json(
      { error: `Ollama returned ${ollamaRes.status}: ${text}` },
      { status: 502 }
    );
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
