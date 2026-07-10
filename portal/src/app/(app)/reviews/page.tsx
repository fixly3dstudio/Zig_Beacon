import { prisma } from "@/lib/db";
import { getPlayCredentials, getAppStoreCredentials } from "@/lib/reviews/credentials";
import { fetchAppStoreRatingSummary, fetchAppStoreReviews } from "@/lib/reviews/app-store";
import { categoryFromText, sentimentFromRating } from "@/lib/reviews/classify";
import { ReviewsView, type ReviewItem } from "@/components/reviews/reviews-view";

export const dynamic = "force-dynamic";
export const metadata = { title: "App Reviews — Zig Beacon" };

const PLAY_STORE_PUBLIC_RATING = {
  averageRating: 4.2,
  ratingCount: 31200,
};

export default async function ReviewsPage() {
  const [rows, play, appStore] = await Promise.all([
    prisma.signal.findMany({
      // Reviews are signals carrying a star rating — this excludes the older
      // ratingless store signals that share the same source label.
      where: { source: { in: ["App Store", "Play Store"] }, rating: { not: null } },
      orderBy: { createdAt: "desc" },
    }),
    getPlayCredentials(),
    getAppStoreCredentials(),
  ]);

  const storedReviews: ReviewItem[] = rows.map((r) => ({
    id: r.id,
    store: r.source,
    rating: r.rating ?? 0,
    title: r.title,
    body: r.text,
    author: r.author,
    appVersion: r.appVersion,
    category: r.category,
    sentiment: r.sentiment,
    createdAt: r.createdAt.toISOString(),
  }));

  const [liveAppStoreReviews, ratingSummary] = appStore
    ? await Promise.all([
        fetchAppStoreReviews(appStore, 3)
          .then((reviews) =>
            reviews.map((review, index) => ({
              id: -1 - index,
              store: review.store,
              rating: review.rating,
              title: review.title,
              body: review.body,
              author: review.author,
              appVersion: review.appVersion,
              category: categoryFromText(`${review.title ?? ""} ${review.body}`),
              sentiment: sentimentFromRating(review.rating),
              createdAt: review.submittedAt.toISOString(),
            }))
          )
          .catch(() => []),
        fetchAppStoreRatingSummary(appStore.appId).catch(() => null),
      ])
    : [[], null];

  const liveKeys = new Set(
    liveAppStoreReviews.map((review) => `${review.store}:${review.title}:${review.body}`)
  );
  const reviews =
    liveAppStoreReviews.length > 0
      ? [
          ...liveAppStoreReviews,
          ...storedReviews.filter(
            (review) => !liveKeys.has(`${review.store}:${review.title}:${review.body}`)
          ),
        ]
      : storedReviews;

  return (
    <ReviewsView
      reviews={reviews}
      configured={{
        playStore: Boolean(play),
        appStore: Boolean(appStore),
      }}
      ratingSummaries={{
        appStore: ratingSummary,
        playStore: PLAY_STORE_PUBLIC_RATING,
      }}
    />
  );
}
