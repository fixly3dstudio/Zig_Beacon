"use server";

import { revalidatePath } from "next/cache";
import { syncAllReviews } from "@/lib/reviews/sync";
import type { StoreSyncResult } from "@/lib/reviews/types";

export type SyncActionResult = {
  ok: boolean;
  results: StoreSyncResult[];
};

export async function syncReviewsAction(): Promise<SyncActionResult> {
  const results = await syncAllReviews();
  revalidatePath("/reviews");
  return { ok: true, results };
}
