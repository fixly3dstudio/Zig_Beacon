import { prisma } from "@/lib/db";
import { categoryFromText, sentimentFromRating } from "./classify";
import { fetchGooglePlayReviews } from "./google-play";
import { fetchAppStoreReviews } from "./app-store";
import {
  getPlayCredentials,
  getAppStoreCredentials,
  markSync,
} from "./credentials";
import type { NormalizedReview, StoreSyncResult, ReviewStore } from "./types";

async function upsertReviews(reviews: NormalizedReview[]) {
  let created = 0;
  let updated = 0;

  for (const review of reviews) {
    const text = review.title ? `${review.title} — ${review.body}` : review.body;
    const data = {
      source: review.store,
      category: categoryFromText(`${review.title ?? ""} ${review.body}`),
      sentiment: sentimentFromRating(review.rating),
      text,
      createdAt: review.submittedAt,
      rating: review.rating,
      appVersion: review.appVersion,
      author: review.author,
      title: review.title,
    };

    const existing = await prisma.signal.findUnique({
      where: { externalId: review.externalId },
      select: { id: true },
    });

    if (existing) {
      await prisma.signal.update({ where: { externalId: review.externalId }, data });
      updated += 1;
    } else {
      await prisma.signal.create({ data: { ...data, externalId: review.externalId } });
      created += 1;
    }
  }

  return { created, updated };
}

async function syncStore(
  store: ReviewStore,
  key: "play" | "appstore",
  configured: boolean,
  fetcher: () => Promise<NormalizedReview[]>,
  note?: string
): Promise<StoreSyncResult> {
  if (!configured) {
    return { store, configured: false, fetched: 0, created: 0, updated: 0, note };
  }
  try {
    const reviews = await fetcher();
    const { created, updated } = await upsertReviews(reviews);
    await markSync(key, `${reviews.length} fetched · ${created} new`);
    return { store, configured: true, fetched: reviews.length, created, updated, note };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await markSync(key, `Error: ${message}`);
    return { store, configured: true, fetched: 0, created: 0, updated: 0, error: message };
  }
}

export async function syncAllReviews(): Promise<StoreSyncResult[]> {
  const [play, appStore] = await Promise.all([
    getPlayCredentials(),
    getAppStoreCredentials(),
  ]);

  return Promise.all([
    syncStore(
      "Play Store",
      "play",
      Boolean(play),
      () => fetchGooglePlayReviews(play!),
      "Play API returns ~7 days of reviews; older history needs the Play Console export."
    ),
    syncStore("App Store", "appstore", Boolean(appStore), () =>
      fetchAppStoreReviews(appStore!)
    ),
  ]);
}
