import { prisma } from "@/lib/db";
import { getPlayCredentials, getAppStoreCredentials } from "@/lib/reviews/credentials";
import { ReviewsView, type ReviewItem } from "@/components/reviews/reviews-view";

export const dynamic = "force-dynamic";
export const metadata = { title: "App Reviews — Zig Beacon" };

export default async function ReviewsPage() {
  const [rows, play, appStore] = await Promise.all([
    prisma.signal.findMany({
      // Reviews are signals carrying a star rating — this excludes the older
      // ratingless store signals that share the same source label.
      where: { source: { in: ["App Store", "Play Store"] }, rating: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    getPlayCredentials(),
    getAppStoreCredentials(),
  ]);

  const reviews: ReviewItem[] = rows.map((r) => ({
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

  return (
    <ReviewsView
      reviews={reviews}
      configured={{
        playStore: Boolean(play),
        appStore: Boolean(appStore),
      }}
    />
  );
}
