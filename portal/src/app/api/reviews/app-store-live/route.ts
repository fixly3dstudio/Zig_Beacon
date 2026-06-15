import { NextResponse } from "next/server";
import { fetchAppStoreReviews } from "@/lib/reviews/app-store";
import { categoryFromText, sentimentFromRating } from "@/lib/reviews/classify";
import type { AppStoreCredentials } from "@/lib/reviews/credentials";

export async function POST(req: Request) {
  try {
    const creds = (await req.json()) as AppStoreCredentials;
    if (!creds.appId || !creds.keyId || !creds.issuerId || !creds.privateKey) {
      return NextResponse.json({ error: "Missing App Store credentials." }, { status: 400 });
    }

    const reviews = await fetchAppStoreReviews(creds, 3);
    return NextResponse.json({
      reviews: reviews.map((review, index) => ({
        id: -1000 - index,
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
      { error: error instanceof Error ? error.message : "Could not fetch App Store reviews." },
      { status: 500 }
    );
  }
}
