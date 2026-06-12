import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Region = "singapore" | "international";

type FeedSource = {
  name: string;
  region: Region;
  url: string;
};

type TransportNewsItem = {
  id: string;
  title: string;
  link: string;
  source: string;
  sourceUrl: string;
  publishedAt: string | null;
  summary: string;
  region: Region;
  topics: string[];
  relevance: number;
};

const singaporeKeywords = [
  "lta",
  "comfortdelgro",
  "zig",
  "taxi",
  "cab",
  "ride-hailing",
  "ride hailing",
  "platform fee",
  "driverless",
  "autonomous",
  "robotaxi",
  "cross-border",
  "cross border",
  "causeway",
  "mrt",
  "bus",
  "changi",
  "airport",
  "erp",
  "ev charging",
];

const internationalKeywords = [
  "taxi",
  "ride-hailing",
  "ride hailing",
  "uber",
  "lyft",
  "grab",
  "gojek",
  "driverless",
  "autonomous",
  "robotaxi",
  "waymo",
  "cruise",
  "mobility",
  "transport",
  "transit",
  "platform fee",
  "airport",
  "electric vehicle",
  "ev",
];

const topicRules = [
  { topic: "Platform Fees", terms: ["platform fee", "fare fee", "booking fee", "surcharge"] },
  { topic: "Driverless Taxi", terms: ["driverless", "autonomous", "robotaxi", "self-driving", "waymo", "cruise"] },
  { topic: "Cross-border Taxi", terms: ["cross-border", "cross border", "causeway", "second link"] },
  { topic: "Ride-hailing", terms: ["ride-hailing", "ride hailing", "uber", "lyft", "grab", "gojek", "tada", "ryde"] },
  { topic: "Taxi Supply", terms: ["taxi", "cab", "driver", "fleet", "comfortdelgro"] },
  { topic: "Public Transport", terms: ["mrt", "rail", "bus", "transit", "commuter"] },
  { topic: "Airport Mobility", terms: ["airport", "changi", "terminal", "pickup", "arrival"] },
  { topic: "EV Mobility", terms: ["electric vehicle", "ev", "charging", "green fleet"] },
];

const excludedUrlMarkers = [
  "/entertainment/",
  "/dining/",
  "/sport/",
  "/sports/",
  "/lifestyle/",
  "/crosswords/",
  "/culture/",
  "/food/",
];

const directSources: FeedSource[] = [
  {
    name: "CNA",
    region: "singapore",
    url: "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml",
  },
  {
    name: "Mothership",
    region: "singapore",
    url: "https://mothership.sg/feed/",
  },
  {
    name: "The Straits Times",
    region: "singapore",
    url: "https://www.straitstimes.com/news/singapore/rss.xml",
  },
  {
    name: "CNN",
    region: "international",
    url: "https://rss.cnn.com/rss/edition_world.rss",
  },
  {
    name: "The Guardian Transport",
    region: "international",
    url: "https://www.theguardian.com/uk/transport/rss",
  },
  {
    name: "TechCrunch Mobility",
    region: "international",
    url: "https://techcrunch.com/category/transportation/feed/",
  },
];

const searchSources: FeedSource[] = [
  {
    name: "Google News SG Mobility",
    region: "singapore",
    url: googleNewsUrl(
      "Singapore taxi OR platform fee OR driverless taxi OR autonomous taxi OR cross border taxi OR ride hailing OR Changi pickup"
    ),
  },
  {
    name: "Google News International Mobility",
    region: "international",
    url: googleNewsUrl(
      "driverless taxi OR robotaxi OR ride hailing OR transport platform fee OR autonomous vehicle OR mobility startup"
    ),
  },
];

function googleNewsUrl(query: string) {
  const params = new URLSearchParams({
    q: query,
    hl: "en-SG",
    gl: "SG",
    ceid: "SG:en",
  });
  return `https://news.google.com/rss/search?${params.toString()}`;
}

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

function sourceHost(link: string) {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function sourceUrl(link: string) {
  try {
    const url = new URL(link);
    return `${url.protocol}//${url.hostname}`;
  } catch {
    return link;
  }
}

function normaliseSourceName(source: FeedSource, block: string, link: string) {
  const embedded = readTag(block, "source");
  if (embedded && !source.name.startsWith("Google News")) return source.name;
  if (embedded) return stripHtml(embedded);
  if (!source.name.startsWith("Google News")) return source.name;
  return sourceHost(link) || source.name.replace("Google News ", "");
}

function itemId(title: string, link: string) {
  const key = `${title}|${link}`;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function detectTopics(text: string) {
  const lower = text.toLowerCase();
  return topicRules
    .filter((rule) => rule.terms.some((term) => matchesTerm(lower, term)))
    .map((rule) => rule.topic);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesTerm(lowerText: string, term: string) {
  const lowerTerm = term.toLowerCase();
  if (lowerTerm.length <= 3 || /^[a-z0-9-]+$/.test(lowerTerm)) {
    return new RegExp(`(^|[^a-z0-9])${escapeRegExp(lowerTerm)}([^a-z0-9]|$)`).test(
      lowerText
    );
  }

  return lowerText.includes(lowerTerm);
}

function relevanceScore(text: string, region: Region) {
  const lower = text.toLowerCase();
  const keywords = region === "singapore" ? singaporeKeywords : internationalKeywords;
  const keywordScore = keywords.reduce(
    (score, keyword) => score + (matchesTerm(lower, keyword) ? 1 : 0),
    0
  );
  const topicScore = detectTopics(text).length * 2;
  const singaporeBoost =
    region === "singapore" &&
    keywordScore > 0 &&
    matchesTerm(lower, "singapore")
      ? 1
      : 0;
  return keywordScore + topicScore + singaporeBoost;
}

function isClearlyOffTopic(title: string, link: string) {
  const lowerTitle = title.toLowerCase();
  const lowerLink = link.toLowerCase();
  if (excludedUrlMarkers.some((marker) => lowerLink.includes(marker))) return true;

  return [
    "world cup",
    "election",
    "polls",
    "pizza",
    "celebrity",
    "video series",
    "crossword",
    "brief letters",
  ].some((term) => lowerTitle.includes(term));
}

function hasSingaporeContext(text: string) {
  const lower = text.toLowerCase();
  return [
    "singapore",
    "s'pore",
    "sg",
    "lta",
    "comfortdelgro",
    "zig",
    "changi",
    "causeway",
    "johor",
    "malaysia",
    "mrt",
  ].some((term) => matchesTerm(lower, term));
}

function parseFeed(xml: string, source: FeedSource): TransportNewsItem[] {
  const rssItems = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  const atomItems = xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? [];
  const blocks = rssItems.length > 0 ? rssItems : atomItems;

  return blocks
    .map((block) => {
      const title = stripHtml(readTag(block, "title"));
      const link = readLink(block);
      const description =
        readTag(block, "description") ||
        readTag(block, "summary") ||
        readTag(block, "content:encoded");
      const published =
        readTag(block, "pubDate") ||
        readTag(block, "published") ||
        readTag(block, "updated") ||
        null;
      const publishedDate = published ? new Date(published) : null;
      const publishedAt =
        publishedDate && !Number.isNaN(publishedDate.getTime())
          ? publishedDate.toISOString()
          : null;
      const summary = stripHtml(description).slice(0, 260);
      const combined = `${title} ${summary}`;
      const topics = detectTopics(combined);
      const relevance = relevanceScore(combined, source.region);
      const resolvedSource = normaliseSourceName(source, block, link);

      return {
        id: itemId(title, link),
        title,
        link,
        source: resolvedSource,
        sourceUrl: sourceUrl(link),
        publishedAt,
        summary,
        region: source.region,
        topics,
        relevance,
      };
    })
    .filter(
      (item) =>
        item.title &&
        item.link &&
        item.topics.length > 0 &&
        item.relevance >= 3 &&
        !isClearlyOffTopic(item.title, item.link) &&
        (source.name !== "Google News SG Mobility" ||
          hasSingaporeContext(`${item.title} ${item.summary} ${item.source}`))
    );
}

async function fetchFeed(source: FeedSource) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
        "User-Agent": "ZigBeacon/1.0 (+https://zig-beacon.local)",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return { source, items: [], error: `${response.status} ${response.statusText}` };
    }

    const xml = await response.text();
    return { source, items: parseFeed(xml, source), error: null };
  } catch (error) {
    return {
      source,
      items: [],
      error: error instanceof Error ? error.message : "Feed failed",
    };
  } finally {
    clearTimeout(timeout);
  }
}

function uniqByLink(items: TransportNewsItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.link.replace(/[?#].*$/, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function GET() {
  const feeds = [...directSources, ...searchSources];
  const results = await Promise.all(feeds.map(fetchFeed));
  const items = uniqByLink(results.flatMap((result) => result.items))
    .sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA || b.relevance - a.relevance;
    })
    .slice(0, 80);

  const failedSources = results
    .filter((result) => result.error)
    .map((result) => ({ source: result.source.name, error: result.error }));

  return NextResponse.json(
    {
      refreshedAt: new Date().toISOString(),
      items,
      counts: {
        singapore: items.filter((item) => item.region === "singapore").length,
        international: items.filter((item) => item.region === "international").length,
      },
      failedSources,
      sources: feeds.map((source) => ({ name: source.name, region: source.region })),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
