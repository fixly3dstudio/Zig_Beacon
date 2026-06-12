import { prisma } from "@/lib/db";
import {
  callOllama,
  getOllamaConfig,
  parseOllamaLine,
  type CoachMessage,
} from "@/lib/ollama";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RequestBody = {
  messages?: CoachMessage[];
  mode?: "strategy" | "diagnosis" | "roadmap" | "experiment";
};

function cleanMessages(messages: CoachMessage[] = []) {
  return messages
    .filter(
      (message) =>
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0
    )
    .slice(-10)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, 4000),
    }));
}

function opportunityScore(opportunity: {
  impact: number;
  frequency: number;
  reach: number;
  effort: number;
}) {
  return Math.round(
    (opportunity.impact * opportunity.frequency * opportunity.reach) /
      Math.max(opportunity.effort, 1)
  );
}

async function buildCoachContext(mode: RequestBody["mode"]) {
  const [
    complaints,
    opportunities,
    scores,
    sentiment,
    signals,
    competitors,
    zigFeatures,
  ] = await Promise.all([
    prisma.complaintCluster.findMany({
      orderBy: { volume: "desc" },
      take: 8,
    }),
    prisma.opportunity.findMany(),
    prisma.beaconScore.findMany({
      orderBy: { recordedAt: "desc" },
    }),
    prisma.signal.groupBy({
      by: ["sentiment"],
      _count: { _all: true },
    }),
    prisma.signal.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.competitor.findMany({
      include: {
        features: {
          include: { feature: true },
        },
      },
    }),
    prisma.competitorFeature.findMany({
      where: { competitor: { name: "Zig" } },
      include: { feature: true },
    }),
  ]);

  const latestScores = new Map<string, number>();
  const previousScores = new Map<string, number>();
  for (const score of scores) {
    if (!latestScores.has(score.area)) latestScores.set(score.area, score.score);
    else if (!previousScores.has(score.area)) {
      previousScores.set(score.area, score.score);
    }
  }

  const scoreLines = Array.from(latestScores.entries())
    .map(([area, score]) => {
      const previous = previousScores.get(area) ?? score;
      const delta = score - previous;
      return `${area}: ${score}/100 (${delta >= 0 ? "+" : ""}${delta} vs previous)`;
    })
    .join("\n");

  const complaintLines = complaints
    .map(
      (complaint) =>
        `${complaint.category}: ${complaint.issue}; volume ${complaint.volume}; trend ${Math.round(
          complaint.trendPct
        )}%; severity ${complaint.severity}`
    )
    .join("\n");

  const opportunityLines = opportunities
    .map(
      (opportunity) =>
        `${opportunity.problem}; score ${opportunityScore(opportunity)}; impact ${
          opportunity.impact
        }, frequency ${opportunity.frequency}, reach ${opportunity.reach}, effort ${
          opportunity.effort
        }; status ${opportunity.status}; owner ${
          opportunity.owner ?? "unassigned"
        }; evidence: ${opportunity.evidence}`
    )
    .join("\n");

  const sentimentLines = sentiment
    .map((item) => `${item.sentiment}: ${item._count._all}`)
    .join(", ");

  const signalLines = signals
    .map(
      (signal) =>
        `${signal.source}/${signal.category}/${signal.sentiment}: ${signal.text}`
    )
    .join("\n");

  const zigMissing = zigFeatures
    .filter((feature) => feature.status !== "available")
    .map(
      (feature) =>
        `${feature.feature.category}: ${feature.feature.name} is ${feature.status}${
          feature.notes ? ` (${feature.notes})` : ""
        }`
    )
    .slice(0, 12)
    .join("\n");

  const competitorLines = competitors
    .map((competitor) => {
      const available = competitor.features.filter(
        (feature) => feature.status === "available"
      ).length;
      const partial = competitor.features.filter(
        (feature) => feature.status === "partial"
      ).length;
      return `${competitor.name} (${competitor.country}): ${available} available, ${partial} partial. Strengths: ${competitor.strengths
        .slice(0, 2)
        .join("; ")}`;
    })
    .join("\n");

  return {
    sourceCount:
      complaints.length +
      opportunities.length +
      latestScores.size +
      signals.length +
      competitors.length,
    context: `You are Zig Beacon AI Coach, an internal product strategy assistant for ComfortDelGro Zig.

Answer using only the portal context below. Be decisive, concise, and action-oriented.
When helpful, structure answers as:
1. Readout
2. Evidence
3. Recommended action
4. Risks / experiment

Current coach mode: ${mode ?? "strategy"}

BEACON SCORES
${scoreLines}

COMPLAINT CLUSTERS
${complaintLines}

OPPORTUNITIES
${opportunityLines}

SENTIMENT SPLIT
${sentimentLines}

RECENT CUSTOMER SIGNALS
${signalLines}

ZIG FEATURE GAPS
${zigMissing}

COMPETITOR SNAPSHOT
${competitorLines}

Rules:
- Cite the data source type in plain language, e.g. "complaint clusters", "Beacon Score", "opportunity evidence", "competitor matrix".
- Do not invent external market data or exact financials not present in context.
- If asked for a roadmap, give a practical ordering and why.
- If asked for revenue or effort, explain that Opportunity Hub estimates are planning estimates unless exact values are provided.`,
  };
}

function offlineBriefing(context: string, sourceCount: number) {
  const promoLine = context.includes("Promo auto-apply")
    ? "Promotions is the clearest immediate priority: it has the weakest Beacon Score signal and the largest complaint cluster around manual promo entry."
    : "The highest-priority area is the one combining low score, high complaint volume, and strong roadmap evidence.";

  return [
    "AI Coach is offline because Ollama is not reachable, but the portal context is loaded.",
    "",
    `Analysed ${sourceCount} local sources from Beacon Score, complaints, opportunities, signals, and competitor data.`,
    "",
    "Immediate readout:",
    `- ${promoLine}`,
    "- Airport pickup should be treated as a workflow reliability problem: terminal clarity, flight tracking, and driver coordination are the key levers.",
    "- Booking remains relatively healthy, but cancellation and ride selection clarity still deserve focused experiments.",
    "",
    "Next action:",
    "- Start with a scoped Promo auto-apply MVP, instrument voucher discovery, checkout completion, repeat booking, and support-contact reduction.",
  ].join("\n");
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as RequestBody;
  const messages = cleanMessages(body.messages);
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
  const sessionId = req.headers.get("x-coach-session") ?? "local-session";
  const { context, sourceCount } = await buildCoachContext(body.mode);

  if (lastUserMessage) {
    await prisma.chatMessage.create({
      data: {
        sessionId,
        role: "user",
        content: lastUserMessage.content,
      },
    });
  }

  const upstreamMessages: CoachMessage[] = [
    { role: "system", content: context },
    ...messages,
  ];

  const { model } = getOllamaConfig();
  let upstream: Response;
  try {
    upstream = await callOllama(upstreamMessages);
  } catch {
    return Response.json(
      {
        error: "AI Coach is offline. Start Ollama to enable live streaming.",
        fallback: offlineBriefing(context, sourceCount),
        model,
        sourceCount,
      },
      { status: 503 }
    );
  }

  if (!upstream.ok || !upstream.body) {
    return Response.json(
      {
        error: "AI Coach is offline. Ollama did not return a usable stream.",
        fallback: offlineBriefing(context, sourceCount),
        model,
        sourceCount,
      },
      { status: 503 }
    );
  }

  let assistantText = "";
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body!.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const parsed = parseOllamaLine(line);
            const token = parsed?.message?.content;
            if (!token) continue;
            assistantText += token;
            controller.enqueue(encoder.encode(token));
          }
        }

        if (assistantText.trim()) {
          await prisma.chatMessage.create({
            data: {
              sessionId,
              role: "assistant",
              content: assistantText,
            },
          });
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Coach-Model": model,
      "X-Coach-Sources": String(sourceCount),
    },
  });
}
