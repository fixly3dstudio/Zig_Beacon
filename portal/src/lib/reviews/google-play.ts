import jwt from "jsonwebtoken";
import type { NormalizedReview } from "./types";
import type { PlayCredentials } from "./credentials";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/androidpublisher";

function normalizeKey(key: string) {
  // env / pasted PEM may store the key with literal "\n"; turn into real newlines
  return key.includes("\\n") ? key.replace(/\\n/g, "\n") : key;
}

async function getAccessToken(creds: PlayCredentials): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign(
    {
      iss: creds.clientEmail,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    },
    normalizeKey(creds.privateKey),
    { algorithm: "RS256" }
  );

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Google OAuth failed (${res.status}): ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("Google OAuth returned no access token");
  return data.access_token;
}

type PlayReview = {
  reviewId: string;
  authorName?: string;
  comments?: {
    userComment?: {
      text?: string;
      lastModified?: { seconds?: string };
      starRating?: number;
      appVersionName?: string;
    };
  }[];
};

/**
 * Fetches recent Google Play reviews. NOTE: the Play Developer API only returns
 * reviews from roughly the last 7 days (and only those with comments). Full
 * history requires the Play Console → Cloud Storage export.
 */
export async function fetchGooglePlayReviews(
  creds: PlayCredentials
): Promise<NormalizedReview[]> {
  const token = await getAccessToken(creds);

  const reviews: NormalizedReview[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(
        creds.packageName
      )}/reviews`
    );
    url.searchParams.set("maxResults", "100");
    if (pageToken) url.searchParams.set("token", pageToken);

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Play reviews fetch failed (${res.status}): ${detail.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      reviews?: PlayReview[];
      tokenPagination?: { nextPageToken?: string };
    };

    for (const review of data.reviews ?? []) {
      const comment = review.comments?.find((c) => c.userComment)?.userComment;
      if (!comment?.text) continue;
      const seconds = Number(comment.lastModified?.seconds ?? 0);
      reviews.push({
        externalId: `gp_${review.reviewId}`,
        store: "Play Store",
        rating: comment.starRating ?? 0,
        title: null,
        body: comment.text,
        author: review.authorName ?? null,
        appVersion: comment.appVersionName ?? null,
        submittedAt: seconds ? new Date(seconds * 1000) : new Date(),
      });
    }

    pageToken = data.tokenPagination?.nextPageToken;
  } while (pageToken);

  return reviews;
}

/** Lightweight credential check: token exchange only. Throws on failure. */
export async function verifyGooglePlay(creds: PlayCredentials): Promise<void> {
  await getAccessToken(creds);
}
