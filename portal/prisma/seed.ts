import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
// Prisma 7: adapter option not yet reflected in generated client types
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("Seeding database...");

  // ─── Competitors ────────────────────────────────────────────────────────────
  const competitorData = [
    {
      name: "Zig",
      country: "Singapore",
      overview:
        "Zig is ComfortDelGro's flagship ride-hailing app, leveraging Singapore's largest taxi fleet and LTA-regulated PHC drivers. It targets commuters and corporates who value reliability and safety over price. The app has grown steadily but lags behind Grab on consumer features and market share.",
      strengths: [
        "Largest regulated taxi fleet in Singapore with predictable supply",
        "Strong corporate and B2B contracts with government agencies",
        "Safety-first reputation backed by ComfortDelGro's regulatory standing",
        "Transparent metered fare option trusted by older demographics",
      ],
      weaknesses: [
        "Consumer app features lag 12–18 months behind Grab",
        "Limited promotions engine; discounts rarely auto-apply at checkout",
        "Airport terminal pickup experience is inconsistent versus Grab",
      ],
    },
    {
      name: "Grab",
      country: "Singapore",
      overview:
        "Grab is Southeast Asia's super-app and the dominant ride-hailing player in Singapore with over 70% market share. Its ecosystem spans rides, food delivery, financial services, and loyalty rewards, creating powerful lock-in. Grab invests heavily in driver supply and consumer promotions.",
      strengths: [
        "Dominant brand with 70%+ ride-hailing market share in Singapore",
        "GrabRewards loyalty programme with seamless point redemption",
        "Integrated super-app ecosystem driving daily active usage",
        "Robust driver supply resulting in the lowest average ETAs",
      ],
      weaknesses: [
        "Surge pricing frustrates commuters during peak hours",
        "Customer support resolution times are slow for disputes",
        "Privacy concerns around extensive data collection across services",
      ],
    },
    {
      name: "Gojek",
      country: "Singapore",
      overview:
        "Gojek SG operates in Singapore as a licensed ride-hailing platform competing directly with Grab and Zig. It focuses on value-for-money rides with competitive surge pricing, and has been expanding its driver pool and product features specifically for the Singapore market since 2019.",
      strengths: [
        "Competitive base fares consistently 10–20% lower than Grab during off-peak hours",
        "GoCar and GoFlash tiers cater to both budget and premium Singapore riders",
        "Clean booking UX with fast load times optimised for Singapore network conditions",
        "Promo auto-apply at checkout is available and well-implemented",
      ],
      weaknesses: [
        "Driver supply in Singapore remains thinner than Grab, leading to higher ETAs during peak hours",
        "No flight tracking or dedicated airport pickup flow for Changi Terminal zones",
        "Loyalty programme (GoRewards) is limited in Singapore vs Grab Rewards",
        "No ride subscription plan available in SG market",
        "Corporate billing portal is less mature than Zig and Grab Business",
      ],
    },
    {
      name: "TADA",
      country: "Singapore",
      overview:
        "TADA differentiates on zero commission for drivers, passing savings to passengers through lower fares. It has built a loyal niche among cost-conscious riders and driver-advocates. Its product is feature-lean but focused, and it recently introduced a basic loyalty programme.",
      strengths: [
        "Zero-commission model attracts high driver satisfaction and retention",
        "Lower fares in off-peak periods due to reduced platform take",
        "Transparent pricing with no hidden surge multipliers",
      ],
      weaknesses: [
        "Smaller driver pool leads to higher ETAs during peak periods",
        "App features and design lag industry leaders significantly",
        "Marketing budget limits consumer brand awareness",
        "No subscription or advanced booking capabilities",
      ],
    },
    {
      name: "Ryde",
      country: "Singapore",
      overview:
        "Ryde started as a carpooling platform and has expanded into ride-hailing. It targets eco-conscious commuters with EV ride options and a sustainable travel angle. Its user base is smaller but loyal, and it offers unique features like RydePOOL for shared journeys.",
      strengths: [
        "Pioneered carpooling in Singapore; strong community among regular commuters",
        "Dedicated EV ride tier (RydeEV) appeals to sustainability-conscious riders",
        "RydePLUS subscription delivers consistent savings for frequent users",
        "Transparent flat-rate pricing on many corridors",
      ],
      weaknesses: [
        "Limited driver supply outside core corridors reduces reliability",
        "Corporate and airport services are underdeveloped",
        "App stability issues reported on older Android devices",
      ],
    },
  ];

  const competitors = [];
  for (const c of competitorData) {
    const comp = await prisma.competitor.upsert({
      where: { name: c.name },
      update: c,
      create: c,
    });
    competitors.push(comp);
  }

  const compMap = Object.fromEntries(competitors.map((c) => [c.name, c.id]));

  // ─── Features ────────────────────────────────────────────────────────────────
  const featureData = [
    { name: "Flight tracking pickup", category: "Airport" },
    { name: "Promo auto-apply at checkout", category: "Promotions" },
    { name: "Multi-stop rides", category: "Booking" },
    { name: "Fare splitting", category: "Payments" },
    { name: "Loyalty tiers", category: "Rewards" },
    { name: "Ride subscription plan", category: "Subscriptions" },
    { name: "In-app safety center", category: "Safety" },
    { name: "Driver preference memory", category: "Driver Experience" },
    { name: "Street hail e-payment", category: "Payments" },
    { name: "Family accounts", category: "Booking" },
    { name: "Corporate billing", category: "Booking" },
    { name: "EV ride option", category: "Booking" },
    { name: "Pet-friendly rides", category: "Booking" },
    { name: "Advance booking 7+ days", category: "Booking" },
  ];

  const features = [];
  for (const f of featureData) {
    const feat = await prisma.feature.upsert({
      where: { name: f.name },
      update: f,
      create: f,
    });
    features.push(feat);
  }

  const featMap = Object.fromEntries(features.map((f) => [f.name, f.id]));

  // ─── CompetitorFeatures ───────────────────────────────────────────────────────
  // status: available | partial | none
  type CFRow = {
    competitorId: number;
    featureId: number;
    status: string;
    notes?: string;
  };

  const cfRows: CFRow[] = [
    // Flight tracking pickup
    { competitorId: compMap.Zig, featureId: featMap["Flight tracking pickup"], status: "none", notes: "No real-time flight integration; drivers rely on passenger messaging" },
    { competitorId: compMap.Grab, featureId: featMap["Flight tracking pickup"], status: "available", notes: "Grab links booking to Changi flight arrival time automatically" },
    { competitorId: compMap.Gojek, featureId: featMap["Flight tracking pickup"], status: "none" },
    { competitorId: compMap.TADA, featureId: featMap["Flight tracking pickup"], status: "none" },
    { competitorId: compMap.Ryde, featureId: featMap["Flight tracking pickup"], status: "none" },

    // Promo auto-apply
    { competitorId: compMap.Zig, featureId: featMap["Promo auto-apply at checkout"], status: "partial", notes: "Some corporate codes apply automatically; consumer promos require manual entry" },
    { competitorId: compMap.Grab, featureId: featMap["Promo auto-apply at checkout"], status: "available", notes: "Best available promo is highlighted and auto-applied" },
    { competitorId: compMap.Gojek, featureId: featMap["Promo auto-apply at checkout"], status: "available" },
    { competitorId: compMap.TADA, featureId: featMap["Promo auto-apply at checkout"], status: "none" },
    { competitorId: compMap.Ryde, featureId: featMap["Promo auto-apply at checkout"], status: "partial", notes: "Subscription discount auto-applies but one-off promos need manual entry" },

    // Multi-stop rides
    { competitorId: compMap.Zig, featureId: featMap["Multi-stop rides"], status: "available" },
    { competitorId: compMap.Grab, featureId: featMap["Multi-stop rides"], status: "available" },
    { competitorId: compMap.Gojek, featureId: featMap["Multi-stop rides"], status: "partial", notes: "Supports one intermediate stop only" },
    { competitorId: compMap.TADA, featureId: featMap["Multi-stop rides"], status: "none" },
    { competitorId: compMap.Ryde, featureId: featMap["Multi-stop rides"], status: "none" },

    // Fare splitting
    { competitorId: compMap.Zig, featureId: featMap["Fare splitting"], status: "none" },
    { competitorId: compMap.Grab, featureId: featMap["Fare splitting"], status: "available" },
    { competitorId: compMap.Gojek, featureId: featMap["Fare splitting"], status: "none" },
    { competitorId: compMap.TADA, featureId: featMap["Fare splitting"], status: "none" },
    { competitorId: compMap.Ryde, featureId: featMap["Fare splitting"], status: "none" },

    // Loyalty tiers
    { competitorId: compMap.Zig, featureId: featMap["Loyalty tiers"], status: "none", notes: "Basic points accumulation exists but no tiered programme" },
    { competitorId: compMap.Grab, featureId: featMap["Loyalty tiers"], status: "available", notes: "GrabRewards with Silver/Gold/Platinum tiers" },
    { competitorId: compMap.Gojek, featureId: featMap["Loyalty tiers"], status: "partial" },
    { competitorId: compMap.TADA, featureId: featMap["Loyalty tiers"], status: "partial", notes: "Basic coin rewards launched Q4 2024" },
    { competitorId: compMap.Ryde, featureId: featMap["Loyalty tiers"], status: "partial" },

    // Ride subscription plan
    { competitorId: compMap.Zig, featureId: featMap["Ride subscription plan"], status: "none" },
    { competitorId: compMap.Grab, featureId: featMap["Ride subscription plan"], status: "available", notes: "GrabUnlimited subscription with ride credits" },
    { competitorId: compMap.Gojek, featureId: featMap["Ride subscription plan"], status: "none" },
    { competitorId: compMap.TADA, featureId: featMap["Ride subscription plan"], status: "none" },
    { competitorId: compMap.Ryde, featureId: featMap["Ride subscription plan"], status: "available", notes: "RydePLUS monthly subscription" },

    // In-app safety center
    { competitorId: compMap.Zig, featureId: featMap["In-app safety center"], status: "available" },
    { competitorId: compMap.Grab, featureId: featMap["In-app safety center"], status: "available" },
    { competitorId: compMap.Gojek, featureId: featMap["In-app safety center"], status: "available" },
    { competitorId: compMap.TADA, featureId: featMap["In-app safety center"], status: "partial" },
    { competitorId: compMap.Ryde, featureId: featMap["In-app safety center"], status: "partial" },

    // Driver preference memory
    { competitorId: compMap.Zig, featureId: featMap["Driver preference memory"], status: "none" },
    { competitorId: compMap.Grab, featureId: featMap["Driver preference memory"], status: "available", notes: "Favourite driver feature in GrabCar" },
    { competitorId: compMap.Gojek, featureId: featMap["Driver preference memory"], status: "none" },
    { competitorId: compMap.TADA, featureId: featMap["Driver preference memory"], status: "none" },
    { competitorId: compMap.Ryde, featureId: featMap["Driver preference memory"], status: "none" },

    // Street hail e-payment
    { competitorId: compMap.Zig, featureId: featMap["Street hail e-payment"], status: "available", notes: "CDG taxis support in-car QR payment and Zig app top-up" },
    { competitorId: compMap.Grab, featureId: featMap["Street hail e-payment"], status: "none", notes: "App-booked rides only" },
    { competitorId: compMap.Gojek, featureId: featMap["Street hail e-payment"], status: "none" },
    { competitorId: compMap.TADA, featureId: featMap["Street hail e-payment"], status: "none" },
    { competitorId: compMap.Ryde, featureId: featMap["Street hail e-payment"], status: "none" },

    // Family accounts
    { competitorId: compMap.Zig, featureId: featMap["Family accounts"], status: "none" },
    { competitorId: compMap.Grab, featureId: featMap["Family accounts"], status: "available" },
    { competitorId: compMap.Gojek, featureId: featMap["Family accounts"], status: "none" },
    { competitorId: compMap.TADA, featureId: featMap["Family accounts"], status: "none" },
    { competitorId: compMap.Ryde, featureId: featMap["Family accounts"], status: "none" },

    // Corporate billing
    { competitorId: compMap.Zig, featureId: featMap["Corporate billing"], status: "available", notes: "Full GoBusiness corporate portal" },
    { competitorId: compMap.Grab, featureId: featMap["Corporate billing"], status: "available" },
    { competitorId: compMap.Gojek, featureId: featMap["Corporate billing"], status: "partial" },
    { competitorId: compMap.TADA, featureId: featMap["Corporate billing"], status: "none" },
    { competitorId: compMap.Ryde, featureId: featMap["Corporate billing"], status: "partial" },

    // EV ride option
    { competitorId: compMap.Zig, featureId: featMap["EV ride option"], status: "partial", notes: "Limited EV taxi fleet; no dedicated EV booking tier" },
    { competitorId: compMap.Grab, featureId: featMap["EV ride option"], status: "available", notes: "GrabGreen tier for EV rides" },
    { competitorId: compMap.Gojek, featureId: featMap["EV ride option"], status: "none" },
    { competitorId: compMap.TADA, featureId: featMap["EV ride option"], status: "none" },
    { competitorId: compMap.Ryde, featureId: featMap["EV ride option"], status: "available", notes: "RydeEV dedicated tier launched 2023" },

    // Pet-friendly rides
    { competitorId: compMap.Zig, featureId: featMap["Pet-friendly rides"], status: "none" },
    { competitorId: compMap.Grab, featureId: featMap["Pet-friendly rides"], status: "available", notes: "GrabPet with carrier requirement" },
    { competitorId: compMap.Gojek, featureId: featMap["Pet-friendly rides"], status: "none" },
    { competitorId: compMap.TADA, featureId: featMap["Pet-friendly rides"], status: "none" },
    { competitorId: compMap.Ryde, featureId: featMap["Pet-friendly rides"], status: "none" },

    // Advance booking 7+ days
    { competitorId: compMap.Zig, featureId: featMap["Advance booking 7+ days"], status: "available", notes: "Up to 7 days for taxis" },
    { competitorId: compMap.Grab, featureId: featMap["Advance booking 7+ days"], status: "available", notes: "Up to 7 days for GrabCar" },
    { competitorId: compMap.Gojek, featureId: featMap["Advance booking 7+ days"], status: "none" },
    { competitorId: compMap.TADA, featureId: featMap["Advance booking 7+ days"], status: "none" },
    { competitorId: compMap.Ryde, featureId: featMap["Advance booking 7+ days"], status: "none" },
  ];

  for (const row of cfRows) {
    await prisma.competitorFeature.upsert({
      where: { competitorId_featureId: { competitorId: row.competitorId, featureId: row.featureId } },
      update: { status: row.status, notes: row.notes },
      create: row,
    });
  }

  // ─── Complaint Clusters ───────────────────────────────────────────────────────
  await prisma.complaintCluster.deleteMany();
  await prisma.complaintCluster.createMany({
    data: [
      { issue: "Promotions not applied automatically", category: "Promotions", volume: 847, trendPct: 34, severity: "high", rootCause: "Promo codes must be entered manually at checkout — users don't discover or remember them, and the best available promo isn't auto-selected.", fix: "Auto-apply the best eligible promo at checkout; show an 'applied promo' line in the fare breakdown; surface available promos on the confirm screen." },
      { issue: "Ride selection UI unclear", category: "Booking", volume: 612, trendPct: 12, severity: "high", rootCause: "Tier names and price/ETA differences aren't explained, so riders can't tell what they're choosing before they confirm.", fix: "Add a one-line descriptor plus price and ETA delta to each tier; default to the rider's last choice; make the selected tier visually distinct." },
      { issue: "Long ETA at airport terminal", category: "Airport", volume: 489, trendPct: 8, severity: "high", rootCause: "There is no terminal-aware pickup — drivers aren't pre-positioned and riders have to message to confirm the terminal.", fix: "Capture the terminal from the flight number; add a dedicated airport pickup flow with terminal selection and a designated waiting point." },
      { issue: "Payment flow has too many steps", category: "Payments", volume: 331, trendPct: 18, severity: "medium", rootCause: "Adding or confirming a card spans multiple screens and saved cards aren't defaulted, so checkout feels heavy.", fix: "Offer one-tap checkout with a default saved card; collapse card entry into a single sheet; remember the last payment method used." },
      { issue: "Driver cancellations before pickup", category: "Booking", volume: 278, trendPct: 22, severity: "high", rootCause: "Drivers cancel after accepting; the rider still waits through re-allocation and can be charged a fee.", fix: "Penalise repeat driver cancellations; auto-rebook instantly with no rider fee; show transparent re-allocation status." },
      { issue: "App crashes on older Android devices", category: "Technical", volume: 196, trendPct: 5, severity: "medium", rootCause: "Map and SDK memory pressure on low-RAM devices and older OS versions causes crashes on the booking screen.", fix: "Add a lightweight map mode; cut memory use on the booking screen; expand crash testing across older Android device profiles." },
      { issue: "Receipt emails not received", category: "Payments", volume: 143, trendPct: -3, severity: "low", rootCause: "Receipt delivery over email is unreliable and there's no in-app fallback for riders who need one.", fix: "Make receipts available in-app immediately; add a one-tap resend; monitor email deliverability." },
      { issue: "Reward points expiring unnoticed", category: "Rewards", volume: 118, trendPct: 41, severity: "medium", rootCause: "There are no expiry reminders and the points balance and expiry date are hard to find in the app.", fix: "Send expiry reminders (push + in-app); show the points balance and next expiry prominently; offer one-tap redemption." },
    ],
  });

  // ─── BeaconScores ─────────────────────────────────────────────────────────────
  await prisma.beaconScore.deleteMany();
  const now = new Date();

  const scoreData = [
    { area: "Booking",    score: 91, factors: { satisfaction: 88, adoption: 92, retention: 90, competitorPosition: 85, businessImpact: 94, complaintSeverity: 78 } },
    { area: "Payments",   score: 87, factors: { satisfaction: 84, adoption: 89, retention: 88, competitorPosition: 82, businessImpact: 90, complaintSeverity: 72 } },
    { area: "Driverless", score: 95, factors: { satisfaction: 94, adoption: 96, retention: 95, competitorPosition: 90, businessImpact: 97, complaintSeverity: 95 } },
    { area: "Promotions", score: 48, factors: { satisfaction: 42, adoption: 55, retention: 45, competitorPosition: 38, businessImpact: 60, complaintSeverity: 30 } },
    { area: "Airport",    score: 76, factors: { satisfaction: 72, adoption: 78, retention: 74, competitorPosition: 68, businessImpact: 82, complaintSeverity: 58 } },
    { area: "Corporate",  score: 82, factors: { satisfaction: 80, adoption: 85, retention: 83, competitorPosition: 78, businessImpact: 88, complaintSeverity: 70 } },
    { area: "Rewards",    score: 71, factors: { satisfaction: 68, adoption: 74, retention: 72, competitorPosition: 62, businessImpact: 76, complaintSeverity: 55 } },
  ];

  // 30-day-ago baseline per area, used as the start of the trend
  const olderScoreData = [
    { area: "Booking",    score: 88, factors: { satisfaction: 84, adoption: 90, retention: 87, competitorPosition: 82, businessImpact: 91, complaintSeverity: 74 } },
    { area: "Payments",   score: 83, factors: { satisfaction: 80, adoption: 85, retention: 84, competitorPosition: 79, businessImpact: 86, complaintSeverity: 68 } },
    { area: "Driverless", score: 93, factors: { satisfaction: 92, adoption: 94, retention: 93, competitorPosition: 88, businessImpact: 95, complaintSeverity: 92 } },
    { area: "Promotions", score: 44, factors: { satisfaction: 38, adoption: 50, retention: 41, competitorPosition: 34, businessImpact: 56, complaintSeverity: 28 } },
    { area: "Airport",    score: 71, factors: { satisfaction: 68, adoption: 73, retention: 70, competitorPosition: 63, businessImpact: 77, complaintSeverity: 52 } },
    { area: "Corporate",  score: 79, factors: { satisfaction: 77, adoption: 82, retention: 80, competitorPosition: 74, businessImpact: 84, complaintSeverity: 66 } },
    { area: "Rewards",    score: 67, factors: { satisfaction: 64, adoption: 70, retention: 68, complaintSeverity: 50, competitorPosition: 58, businessImpact: 72 } },
  ];

  // 10 weekly snapshots per area: deterministic walk from the 10-week-ago
  // baseline to the current score, so trends and sparklines have real shape.
  const WEEKS = 10;
  for (const [areaIndex, current] of scoreData.entries()) {
    const older = olderScoreData[areaIndex];
    const start = older.score - 3; // extend the trend slightly further back
    for (let week = 0; week < WEEKS; week++) {
      const t = week / (WEEKS - 1);
      // deterministic wobble so lines aren't perfectly straight
      const wobble = Math.round(Math.sin(areaIndex * 2.7 + week * 1.9) * 2);
      const score =
        week === WEEKS - 1
          ? current.score
          : Math.max(0, Math.min(100, Math.round(start + (current.score - start) * t) + wobble));
      const recordedAt = new Date(now.getTime() - (WEEKS - 1 - week) * 7 * 24 * 60 * 60 * 1000);
      const factors = week === WEEKS - 1 ? current.factors : older.factors;
      await prisma.beaconScore.create({
        data: { area: current.area, score, factors, recordedAt },
      });
    }
  }

  // ─── Opportunities ────────────────────────────────────────────────────────────
  await prisma.opportunity.deleteMany();
  await prisma.opportunity.createMany({
    data: [
      { problem: "Promo auto-apply at checkout", evidence: "847 complaints about manual promo entry; Grab auto-applies best available promo", impact: 9, frequency: 9, reach: 8, effort: 5, status: "planned", owner: "Promotions Squad" },
      { problem: "Airport pickup flight tracking", evidence: "489 airport ETA complaints; Grab links booking to Changi arrival data", impact: 8, frequency: 6, reach: 7, effort: 7, status: "backlog", owner: "Airport Experience Team" },
      { problem: "Ride selection card redesign", evidence: "612 complaints about unclear ride type differences; usability tests show 34% task failure", impact: 7, frequency: 8, reach: 9, effort: 4, status: "in-progress", owner: "Core UX Team" },
      { problem: "Loyalty tier system", evidence: "Rewards score 71/100; 118 complaints re expiring points; Grab drives 3x repeat rides via tiers", impact: 8, frequency: 5, reach: 8, effort: 8, status: "planned", owner: "Growth Team" },
      { problem: "One-tap rebooking from history", evidence: "User research: 68% of riders repeat the same 3 destinations; rebooking takes 6 taps", impact: 6, frequency: 9, reach: 7, effort: 3, status: "backlog", owner: "Core UX Team" },
      { problem: "Receipt email reliability fix", evidence: "143 support tickets; SMTP deliverability logs show 12% drop rate on Singtel networks", impact: 4, frequency: 6, reach: 5, effort: 2, status: "in-progress", owner: "Platform Eng" },
      { problem: "Family account MVP", evidence: "Grab Family drives 22% higher household retention; zero current multi-user offering in Zig", impact: 7, frequency: 4, reach: 6, effort: 7, status: "backlog", owner: "Consumer Products" },
      { problem: "Street hail QR payment upgrade", evidence: "CDG taxi street hail volume 40% of trips; improving in-car QR UX reduces payment friction", impact: 5, frequency: 7, reach: 6, effort: 4, status: "shipped", owner: "Payments Team" },
    ],
  });

  // ─── Signals ──────────────────────────────────────────────────────────────────
  await prisma.signal.deleteMany();

  const signalTemplates = [
    // Positive
    { source: "App Store", category: "Booking", sentiment: "positive", text: "Love how easy it is to book a CDG taxi on Zig. Always reliable and on time." },
    { source: "App Store", category: "Safety", sentiment: "positive", text: "The safety features are excellent. Real-time sharing gave my wife peace of mind during my late-night ride." },
    { source: "Play Store", category: "Booking", sentiment: "positive", text: "Great app, booking is smooth and the driver tracking is accurate." },
    { source: "Play Store", category: "Payments", sentiment: "positive", text: "Payment process is quick. Saved cards work perfectly every time." },
    { source: "Reddit", category: "Corporate", sentiment: "positive", text: "Our company switched to Zig for corporate transport. The billing dashboard is clean and the dedicated support line is responsive." },
    { source: "Reddit", category: "Booking", sentiment: "positive", text: "Zig's advance booking feature is a lifesaver for early morning flights. Set it the night before and forget." },
    { source: "Support", category: "Booking", sentiment: "positive", text: "Your driver was incredibly professional and the app pinpointed the pickup perfectly. 5 stars." },
    { source: "Twitter", category: "Rewards", sentiment: "positive", text: "Finally got my Zig points redeemed for a free ride. Small win but appreciated!" },
    { source: "App Store", category: "Airport", sentiment: "positive", text: "Booked from Changi T3 and the driver was waiting before I even cleared customs. Impressive timing." },
    { source: "Play Store", category: "Safety", sentiment: "positive", text: "Emergency button is well placed and actually works. Tested it accidentally once and got a call back in 2 minutes." },
    { source: "Reddit", category: "Payments", sentiment: "positive", text: "Street hail QR payment update is really smooth now. No more fumbling with cash in the cab." },
    { source: "Twitter", category: "Booking", sentiment: "positive", text: "Multi-stop rides on Zig saved my whole team's logistics for the offsite. Booked 4 pickups from one screen." },
    { source: "Support", category: "Corporate", sentiment: "positive", text: "The monthly billing report is exactly what our finance team needed. Thank you for the quick turnaround on the feature request." },
    { source: "App Store", category: "Booking", sentiment: "positive", text: "Solid alternative to Grab. ETA estimates are accurate and I've never had a driver cancel on me." },
    { source: "Play Store", category: "Airport", sentiment: "positive", text: "Used Zig from the airport 3 times this month. Consistent pickup experience." },
    { source: "Reddit", category: "Rewards", sentiment: "positive", text: "Points are accumulating nicely. Would love a tier system like GrabRewards but at least they don't expire... yet." },
    { source: "Twitter", category: "Promotions", sentiment: "positive", text: "Got a $5 off code via email and it worked first try. Simple things done right." },
    { source: "App Store", category: "Booking", sentiment: "positive", text: "The driver preference feature would be amazing — please add it. But overall the app is very reliable." },
    // Neutral
    { source: "Reddit", category: "Promotions", sentiment: "neutral", text: "Zig promos exist but you have to know to enter the code. Grab just auto-applies the best one. Small UX difference but noticeable." },
    { source: "Reddit", category: "Booking", sentiment: "neutral", text: "Comparing Zig vs Grab for daily commute. ETAs are similar, Grab has more vehicle options. Zig has metered taxis which I trust more on long rides." },
    { source: "Twitter", category: "Airport", sentiment: "neutral", text: "Used Zig from Changi. It worked but I had to message the driver to confirm the terminal. Grab knew my terminal from the flight number." },
    { source: "Support", category: "Payments", sentiment: "neutral", text: "Wondering if there's a way to split fare with colleagues? Would use Zig for team outings if that was possible." },
    { source: "App Store", category: "Rewards", sentiment: "neutral", text: "Points system is there but I'm not sure how much I have or what I can redeem. Could be clearer." },
    { source: "Play Store", category: "Rewards", sentiment: "neutral", text: "Loyalty programme seems decent but I got an email saying my points expire next month. Wish there was more notice." },
    { source: "Reddit", category: "Booking", sentiment: "neutral", text: "Zig is fine. Nothing exceptional but nothing terrible. Price is competitive." },
    // Negative
    { source: "App Store", category: "Promotions", sentiment: "negative", text: "Why do I have to manually enter promo codes? Every other app auto-applies the best discount. This is frustrating." },
    { source: "Play Store", category: "Booking", sentiment: "negative", text: "App crashes whenever I try to book on my Samsung A14. Uninstalled and reinstalled twice. Fix it please." },
    { source: "Reddit", category: "Airport", sentiment: "negative", text: "Waited 22 minutes at T1 pickup zone. Driver had no idea which terminal I was at. Grab just knows from the flight number." },
    { source: "Twitter", category: "Promotions", sentiment: "negative", text: "Missed the promo because I didn't know to type in a code at checkout. Lost $8 saving for no reason. Grab would've applied it automatically." },
    { source: "Support", category: "Payments", sentiment: "negative", text: "I haven't received a ride receipt for my last 3 trips. My company won't reimburse without receipts. Please fix." },
    { source: "App Store", category: "Booking", sentiment: "negative", text: "Driver cancelled 5 minutes before pickup for the third time this week. No explanation and finding a new ride took forever." },
    { source: "Play Store", category: "Rewards", sentiment: "negative", text: "Lost 500 points without any warning they were expiring. At least send a push notification a week before." },
  ];

  // Spread createdAt across the last 30 days (deterministic — no Math.random() so re-seeds are stable)
  const TOTAL_SIGNALS = signalTemplates.length;
  const signals = signalTemplates.map((s, i) => ({
    ...s,
    createdAt: new Date(Date.now() - i * (30 * 24 * 60 * 60 * 1000 / TOTAL_SIGNALS)),
  }));

  for (const s of signals) {
    await prisma.signal.create({ data: s });
  }

  // ─── Demo app reviews (shown until real store credentials are added) ──────────
  const reviewTemplates = [
    { store: "Play Store", rating: 1, title: null, author: "shakilalee", appVersion: "7.0.10", category: "Payments", body: "Terrible if u use debit card. They put a hold on your money and don't release it until the bank limit expires, around 10 days. You always need twice the fare ready." },
    { store: "App Store", rating: 2, title: "Promo never applies", author: "raffles_rider", appVersion: "7.0.9", category: "Promotions", body: "Promo codes exist but you have to enter them manually every time. Grab auto-applies the best one. Small thing but annoying." },
    { store: "Play Store", rating: 5, title: null, author: "tanwl", appVersion: "7.0.10", category: "Booking", body: "Booking is smooth and the metered taxis make me trust the fare on longer rides. Drivers are usually quick to accept." },
    { store: "App Store", rating: 2, title: "Airport pickup is confusing", author: "changi_flyer", appVersion: "7.0.9", category: "Airport", body: "Used Zig from Changi. It worked but I had to message the driver to confirm the terminal. Grab knew my terminal from the flight number." },
    { store: "Play Store", rating: 4, title: null, author: "dailycommuter", appVersion: "7.0.10", category: "Booking", body: "Reliable for my daily commute. Wish there were more vehicle options at peak hours but overall solid." },
    { store: "App Store", rating: 1, title: "App keeps crashing", author: "frustrated_sg", appVersion: "7.0.8", category: "Technical", body: "Since the last update the app crashes when I open the map. Had to reinstall twice this week." },
    { store: "Play Store", rating: 3, title: null, author: "corporateuser", appVersion: "7.0.10", category: "Account", body: "Company switched us to Zig for corporate rides. Login with SSO took a few tries but works now. Receipts could be clearer." },
    { store: "App Store", rating: 5, title: "Advance booking is great", author: "earlybird", appVersion: "7.0.10", category: "Booking", body: "The advance booking feature is a lifesaver for early morning airport runs. Driver was already waiting." },
    { store: "Play Store", rating: 2, title: null, author: "pointscollector", appVersion: "7.0.9", category: "Promotions", body: "My reward points expired without any warning. Would be nice to get a reminder before they vanish." },
    { store: "App Store", rating: 4, title: "Safety features are good", author: "safe_traveller", appVersion: "7.0.10", category: "Booking", body: "Real-time ride sharing and the SOS button give me peace of mind on late night rides. Booking flow is clean." },
    { store: "Play Store", rating: 1, title: null, author: "angrypax", appVersion: "7.0.8", category: "Booking", body: "Driver cancelled twice before pickup and I still got charged a small fee. Support took two days to refund." },
    { store: "App Store", rating: 3, title: "Payment flow too long", author: "quickpay_fan", appVersion: "7.0.9", category: "Payments", body: "Saved cards work but adding a new one has too many steps. Checkout could be one tap." },
  ];

  for (const [i, r] of reviewTemplates.entries()) {
    const sentiment = r.rating <= 2 ? "negative" : r.rating === 3 ? "neutral" : "positive";
    await prisma.signal.create({
      data: {
        source: r.store,
        category: r.category,
        sentiment,
        text: r.title ? `${r.title} — ${r.body}` : r.body,
        title: r.title,
        rating: r.rating,
        author: r.author,
        appVersion: r.appVersion,
        externalId: `demo_${r.store === "App Store" ? "as" : "gp"}_${i}`,
        createdAt: new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log("Seed complete.");
  console.log(`  ${competitors.length} competitors`);
  console.log(`  ${features.length} features`);
  console.log(`  ${cfRows.length} competitor-feature rows`);
  console.log(`  8 complaint clusters`);
  console.log(`  ${scoreData.length * 2} beacon score rows`);
  console.log(`  8 opportunities`);
  console.log(`  ${signals.length} signals`);
  console.log(`  ${reviewTemplates.length} demo app reviews`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
