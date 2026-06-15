import { categoryFromText } from "@/lib/reviews/classify";

export type RedditSignal = {
  id: number;
  source: "Reddit";
  category: string;
  sentiment: "positive" | "neutral" | "negative";
  text: string;
  createdAt: string;
  url: string;
  subreddit: string | null;
};

export type RedditCluster = {
  id: number;
  issue: string;
  category: string;
  volume: number;
  trendPct: number;
  severity: string;
  rootCause: string;
  fix: string;
};

const queries = [
  '"CDG Zig"',
  '"ComfortDelGro Zig"',
  '"Zig app" taxi Singapore',
  '"ComfortDelGro" "taxi app"',
  '"CDG" "taxi app" Singapore',
  '"ComfortDelGro" "booking" taxi',
];

const positiveTerms = /\b(good|great|smooth|easy|reliable|fast|cheaper|useful|love|works|better)\b/i;
const negativeTerms =
  /\b(bad|bug|crash|slow|expensive|cancel|cancelled|fail|failed|problem|issue|wait|waiting|refund|charge|promo|not working|unable|dirty|uncomfortable)\b/i;

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .trim();
}

function stripHtml(value: string) {
  return decodeXml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(match[1]) : "";
}

function readLink(block: string) {
  const link = readTag(block, "link");
  if (link) return link;
  const href = block.match(/<link[^>]+href=["']([^"']+)["']/i);
  return href ? decodeXml(href[1]) : "";
}

function itemId(title: string, link: string) {
  const key = `${title}|${link}`;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return -Math.abs(hash);
}

function subredditFromLink(link: string) {
  const match = link.match(/reddit\.com\/r\/([^/]+)/i);
  return match ? `r/${match[1]}` : null;
}

function sentimentFromText(text: string): RedditSignal["sentiment"] {
  if (negativeTerms.test(text)) return "negative";
  if (positiveTerms.test(text)) return "positive";
  return "neutral";
}

function isRelevant(text: string) {
  const lower = text.toLowerCase();
  const hasBrand =
    lower.includes("cdg zig") ||
    lower.includes("comfortdelgro zig") ||
    lower.includes("zig app") ||
    lower.includes("comfortdelgro") ||
    lower.includes("cdg");
  const hasMobility =
    /\b(taxi|cab|ride|booking|driver|fare|promo|voucher|payment|airport|changi|pickup|app)\b/i.test(
      text
    );
  return hasBrand && hasMobility;
}

function redditSearchUrl(query: string) {
  const params = new URLSearchParams({
    q: query,
    sort: "new",
    t: "year",
  });
  return `https://www.reddit.com/search.rss?${params.toString()}`;
}

async function fetchRedditFeed(query: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(redditSearchUrl(query), {
      signal: controller.signal,
      headers: {
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
        "User-Agent": "ZigBeacon/1.0 (+https://portal-eight-omega-90.vercel.app)",
      },
      cache: "no-store",
    });

    if (!response.ok) return [];
    const xml = await response.text();
    const blocks = xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? [];

    return blocks
      .map((block) => {
        const title = stripHtml(readTag(block, "title"));
        const body = stripHtml(readTag(block, "content") || readTag(block, "summary"));
        const link = readLink(block);
        const published = readTag(block, "updated") || readTag(block, "published");
        const createdAt = published ? new Date(published) : new Date();
        const text = [title, body].filter(Boolean).join(" — ").slice(0, 700);

        if (!title || !link || !isRelevant(text)) return null;

        return {
          id: itemId(title, link),
          source: "Reddit" as const,
          category: categoryFromText(text),
          sentiment: sentimentFromText(text),
          text,
          createdAt: Number.isNaN(createdAt.getTime()) ? new Date().toISOString() : createdAt.toISOString(),
          url: link,
          subreddit: subredditFromLink(link),
        };
      })
      .filter((item): item is RedditSignal => Boolean(item));
  } finally {
    clearTimeout(timeout);
  }
}

function issueForCategory(category: string) {
  const issue: Record<string, string> = {
    Booking: "Reddit complaints about taxi booking, pickup and driver allocation",
    Payments: "Reddit complaints about fare, payment and refund clarity",
    Promotions: "Reddit complaints about promo, voucher and reward friction",
    Airport: "Reddit complaints about airport pickup and terminal guidance",
    Technical: "Reddit complaints about app stability and reliability",
    Account: "Reddit complaints about login and account access",
  };
  return issue[category] ?? `Reddit discussion about ${category.toLowerCase()} experience`;
}

function fixForCategory(category: string) {
  const fix: Record<string, string> = {
    Booking: "Clarify taxi availability, allocation status, cancellation rules and pickup expectations before confirmation.",
    Payments: "Show fare, holds, refunds and payment status in a single transparent receipt timeline.",
    Promotions: "Auto-apply eligible vouchers and explain why a promo is unavailable before booking.",
    Airport: "Add terminal-aware pickup guidance with clear meeting point and driver coordination states.",
    Technical: "Prioritise crash and loading failures mentioned in Reddit threads, then ask users to retest the fixed flow.",
    Account: "Simplify login recovery and make OTP/account errors actionable.",
  };
  return fix[category] ?? "Route the Reddit theme to the owning product squad for review.";
}

export function redditClustersFromSignals(signals: RedditSignal[]): RedditCluster[] {
  const groups = new Map<string, RedditSignal[]>();
  for (const signal of signals) {
    const items = groups.get(signal.category) ?? [];
    items.push(signal);
    groups.set(signal.category, items);
  }

  return Array.from(groups.entries())
    .map(([category, items], index) => {
      const negative = items.filter((item) => item.sentiment === "negative").length;
      const recent = items.filter(
        (item) => Date.now() - new Date(item.createdAt).getTime() <= 30 * 86400000
      ).length;
      return {
        id: 30000 + index,
        issue: issueForCategory(category),
        category,
        volume: items.length,
        trendPct: Math.round((recent / Math.max(items.length, 1)) * 100),
        severity: negative >= 5 || items.length >= 8 ? "high" : negative >= 2 ? "medium" : "low",
        rootCause: "Reddit users are discussing this Zig taxi-app area in public Singapore mobility conversations.",
        fix: fixForCategory(category),
      };
    })
    .sort((a, b) => b.volume - a.volume || b.trendPct - a.trendPct);
}

export async function fetchRedditSignals() {
  const results = await Promise.allSettled(queries.map(fetchRedditFeed));
  const byId = new Map<number, RedditSignal>();

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    for (const signal of result.value) {
      byId.set(signal.id, signal);
    }
  }

  const signals = Array.from(byId.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return {
    signals: signals.slice(0, 80),
    clusters: redditClustersFromSignals(signals),
  };
}
