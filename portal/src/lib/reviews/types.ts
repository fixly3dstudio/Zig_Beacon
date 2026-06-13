export type ReviewStore = "App Store" | "Play Store";

/** A review normalised across both stores, ready to upsert as a Signal. */
export type NormalizedReview = {
  /** Stable store-side id, used to dedup on every sync. */
  externalId: string;
  store: ReviewStore;
  rating: number; // 1-5
  title: string | null;
  body: string;
  author: string | null;
  appVersion: string | null;
  submittedAt: Date;
};

export type StoreSyncResult = {
  store: ReviewStore;
  configured: boolean;
  fetched: number;
  created: number;
  updated: number;
  error?: string;
  note?: string;
};
