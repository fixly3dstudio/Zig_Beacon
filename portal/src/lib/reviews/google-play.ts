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

function googleErrorMessage(status: number, detail: string) {
  let message = detail;
  try {
    const parsed = JSON.parse(detail) as {
      error?: { message?: string; status?: string; details?: { reason?: string }[] };
    };
    message = parsed.error?.message ?? detail;
  } catch {
    message = detail;
  }

  if (
    status === 403 &&
    /api has not been used|disabled|accessNotConfigured/i.test(message)
  ) {
    return [
      "Google Play reviews are not available yet because the Android Developer API is disabled for this Google Cloud project.",
      "Open https://console.developers.google.com/apis/api/androidpublisher.googleapis.com/overview and enable it for the project that owns this service account.",
      "Then confirm the service account is granted access to this app in Play Console → Users and permissions.",
    ].join(" ");
  }

  if (status === 401 || /unauthorized|invalid_grant|invalid jwt/i.test(message)) {
    return "Google Play authentication failed. Paste the full service account JSON again and make sure the private_key was not edited.";
  }

  if (status === 403) {
    return [
      `Google Play reviews fetch failed (${status}): ${message}`,
      "Make sure the service account has access to this app in Play Console → Users and permissions, and that the package name is correct.",
    ].join(" ");
  }

  return `Play reviews fetch failed (${status}): ${message.slice(0, 300)}`;
}

async function fetchReviewPage(creds: PlayCredentials, token: string, pageToken?: string) {
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
    throw new Error(googleErrorMessage(res.status, detail));
  }

  return (await res.json()) as {
    reviews?: PlayReview[];
    tokenPagination?: { nextPageToken?: string };
  };
}

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
    const data = await fetchReviewPage(creds, token, pageToken);

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

/** Credential check: token exchange + real reviews endpoint access. Throws on failure. */
export async function verifyGooglePlay(creds: PlayCredentials): Promise<void> {
  const token = await getAccessToken(creds);
  await fetchReviewPage(creds, token);
}
