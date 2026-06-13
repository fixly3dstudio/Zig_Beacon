// Maps a star rating and review text into the portal's sentiment + category
// taxonomy so reviews behave like any other Signal.

export function sentimentFromRating(rating: number): "positive" | "neutral" | "negative" {
  if (rating <= 2) return "negative";
  if (rating === 3) return "neutral";
  return "positive";
}

// Keyword → category. First match wins; falls back to "Reviews".
const CATEGORY_RULES: { category: string; keywords: RegExp }[] = [
  { category: "Payments", keywords: /\b(payment|card|charge|charged|refund|fare|price|cost|wallet|hold|deduct|billing)\b/i },
  { category: "Booking", keywords: /\b(book|booking|ride|driver|cancel|cancellation|pickup|pick-up|eta|wait|allocat)\b/i },
  { category: "Airport", keywords: /\b(airport|terminal|changi|flight)\b/i },
  { category: "Promotions", keywords: /\b(promo|promotion|voucher|discount|code|coupon|reward|points)\b/i },
  { category: "Account", keywords: /\b(login|log in|sign in|sign up|account|password|otp|verify|register)\b/i },
  { category: "Technical", keywords: /\b(crash|bug|freeze|slow|lag|error|glitch|load|loading|update|version)\b/i },
];

export function categoryFromText(text: string): string {
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.test(text)) return rule.category;
  }
  return "Reviews";
}
