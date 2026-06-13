import jwt from "jsonwebtoken";
import type { NormalizedReview } from "./types";
import type { AppStoreCredentials } from "./credentials";

function normalizeKey(key: string) {
  return key.includes("\\n") ? key.replace(/\\n/g, "\n") : key;
}

function buildToken(creds: AppStoreCredentials): string {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      iss: creds.issuerId,
      iat: now,
      exp: now + 60 * 15,
      aud: "appstoreconnect-v1",
    },
    normalizeKey(creds.privateKey),
    { algorithm: "ES256", keyid: creds.keyId }
  );
}

type AscReview = {
  id: string;
  attributes?: {
    rating?: number;
    title?: string;
    body?: string;
    reviewerNickname?: string;
    createdDate?: string;
  };
};

/**
 * Fetches App Store customer reviews (most recent first). Caps at `maxPages`
 * pages of 200 so a first sync doesn't run forever.
 */
export async function fetchAppStoreReviews(
  creds: AppStoreCredentials,
  maxPages = 5
): Promise<NormalizedReview[]> {
  const token = buildToken(creds);

  const reviews: NormalizedReview[] = [];
  let next: string | null =
    `https://api.appstoreconnect.apple.com/v1/apps/${encodeURIComponent(
      creds.appId
    )}/customerReviews?sort=-createdDate&limit=200`;
  let pages = 0;

  while (next && pages < maxPages) {
    const res: Response = await fetch(next, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`App Store reviews fetch failed (${res.status}): ${detail.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      data?: AscReview[];
      links?: { next?: string };
    };

    for (const review of data.data ?? []) {
      const attr = review.attributes ?? {};
      if (!attr.body) continue;
      reviews.push({
        externalId: `as_${review.id}`,
        store: "App Store",
        rating: attr.rating ?? 0,
        title: attr.title ?? null,
        body: attr.body,
        author: attr.reviewerNickname ?? null,
        appVersion: null,
        submittedAt: attr.createdDate ? new Date(attr.createdDate) : new Date(),
      });
    }

    next = data.links?.next ?? null;
    pages += 1;
  }

  return reviews;
}

/** Credential check: fetch a single review page. Throws on failure. */
export async function verifyAppStore(creds: AppStoreCredentials): Promise<void> {
  await fetchAppStoreReviews(creds, 1);
}
