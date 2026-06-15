import { NextResponse } from "next/server";
import { fetchRedditSignals } from "@/lib/reddit-signals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const data = await fetchRedditSignals();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        signals: [],
        clusters: [],
        error: error instanceof Error ? error.message : "Could not fetch Reddit signals.",
      },
      { status: 200 }
    );
  }
}
