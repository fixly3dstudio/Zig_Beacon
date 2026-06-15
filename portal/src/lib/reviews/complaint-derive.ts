import { categoryFromText, sentimentFromRating } from "./classify";

export type ReviewComplaintSource = {
  id: number;
  store: string;
  rating: number;
  title: string | null;
  body: string;
  author?: string | null;
  appVersion?: string | null;
  category?: string;
  sentiment?: string;
  createdAt: string;
};

export type DerivedComplaintSignal = {
  id: number;
  source: string;
  category: string;
  sentiment: string;
  text: string;
  createdAt: string;
};

export type DerivedComplaintCluster = {
  id: number;
  issue: string;
  category: string;
  volume: number;
  trendPct: number;
  severity: string;
};

function issueForReview(review: ReviewComplaintSource) {
  const text = `${review.title ?? ""} ${review.body}`.toLowerCase();
  if (/\b(no taxi|rarely available|availability|available|allocate|allocation|wait|rain|driver)\b/.test(text)) {
    return { category: "Booking", issue: "Taxi availability and driver allocation complaints" };
  }
  if (/\b(crash|bug|freeze|hang|loading|slow|update|not working|unable|error)\b/.test(text)) {
    return { category: "Technical", issue: "App stability and reliability complaints" };
  }
  if (/\b(old car|dirty|uncomfortable|reckless|condition|vehicle)\b/.test(text)) {
    return { category: "Ride Quality", issue: "Vehicle comfort and ride quality complaints" };
  }
  if (/\b(price|fare|charge|refund|wallet|payment|expensive|cost)\b/.test(text)) {
    return { category: "Payments", issue: "Fare, payment and refund complaints" };
  }
  if (/\b(promo|voucher|discount|code|coupon|reward)\b/.test(text)) {
    return { category: "Promotions", issue: "Promotion and voucher complaints" };
  }
  if (/\b(airport|terminal|changi|pickup|pick-up)\b/.test(text)) {
    return { category: "Airport", issue: "Airport pickup and terminal guidance complaints" };
  }

  const category = review.category || categoryFromText(text);
  return { category, issue: `${category} complaints from App Store reviews` };
}

function trendFor(items: ReviewComplaintSource[]) {
  const now = Date.now();
  const recent = items.filter(
    (item) => now - new Date(item.createdAt).getTime() <= 30 * 86400000
  ).length;
  if (items.length === 0) return 0;
  return Math.round((recent / items.length) * 100);
}

function severityFor(items: ReviewComplaintSource[]) {
  const avgRating =
    items.reduce((sum, item) => sum + item.rating, 0) / Math.max(items.length, 1);
  if (items.length >= 5 || avgRating <= 1.5) return "high";
  if (items.length >= 2 || avgRating <= 2.5) return "medium";
  return "low";
}

export function complaintSignalsFromReviews(
  reviews: ReviewComplaintSource[]
): DerivedComplaintSignal[] {
  return reviews
    .filter((review) => review.rating <= 3)
    .map((review) => {
      const classification = issueForReview(review);
      return {
        id: review.id,
        source: review.store,
        category: classification.category,
        sentiment: review.sentiment ?? sentimentFromRating(review.rating),
        text: review.title ? `${review.title} — ${review.body}` : review.body,
        createdAt: review.createdAt,
      };
    });
}

export function complaintClustersFromReviews(
  reviews: ReviewComplaintSource[]
): DerivedComplaintCluster[] {
  const groups = new Map<string, { issue: string; category: string; items: ReviewComplaintSource[] }>();
  for (const review of reviews.filter((item) => item.rating <= 3)) {
    const classification = issueForReview(review);
    const key = `${classification.category}:${classification.issue}`;
    const group = groups.get(key) ?? { ...classification, items: [] };
    group.items.push(review);
    groups.set(key, group);
  }

  return Array.from(groups.values())
    .map((group, index) => ({
      id: 10000 + index,
      issue: group.issue,
      category: group.category,
      volume: group.items.length,
      trendPct: trendFor(group.items),
      severity: severityFor(group.items),
    }))
    .sort((a, b) => b.volume - a.volume || b.trendPct - a.trendPct);
}
