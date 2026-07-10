import { NextResponse } from "next/server";
import { fetchGooglePlayReviews } from "@/lib/reviews/google-play";
import { categoryFromText, sentimentFromRating } from "@/lib/reviews/classify";
import type { PlayCredentials } from "@/lib/reviews/credentials";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const creds = (await req.json()) as PlayCredentials;
    if (!creds.packageName || !creds.clientEmail || !creds.privateKey) {
      return NextResponse.json({ error: "Missing Play Store credentials." }, { status: 400 });
    }

    const reviews = await fetchGooglePlayReviews(creds);
    return NextResponse.json({
      reviews: reviews.map((review, index) => ({
        id: -2000 - index,
        store: review.store,
        rating: review.rating,
        title: review.title,
        body: review.body,
        author: review.author,
        appVersion: review.appVersion,
        category: categoryFromText(`${review.title ?? ""} ${review.body}`),
        sentiment: sentimentFromRating(review.rating),
        createdAt: review.submittedAt.toISOString(),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not fetch Play Store reviews." },
      { status: 500 }
    );
  }
}
