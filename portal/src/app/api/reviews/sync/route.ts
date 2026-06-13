import { syncAllReviews } from "@/lib/reviews/sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Protects the endpoint when REVIEWS_SYNC_SECRET is set (e.g. for a cron job).
// If the secret is unset, the route is open — fine for a locked-down internal host.
function authorized(req: Request): boolean {
  const secret = process.env.REVIEWS_SYNC_SECRET;
  if (!secret) return true;
  const header = req.headers.get("x-sync-secret");
  const url = new URL(req.url);
  return header === secret || url.searchParams.get("secret") === secret;
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const results = await syncAllReviews();
  const totals = results.reduce(
    (acc, r) => ({
      created: acc.created + r.created,
      updated: acc.updated + r.updated,
      fetched: acc.fetched + r.fetched,
    }),
    { created: 0, updated: 0, fetched: 0 }
  );
  return Response.json({ ok: true, totals, results });
}

// Convenience: allow cron services that only do GET.
export async function GET(req: Request) {
  return POST(req);
}
