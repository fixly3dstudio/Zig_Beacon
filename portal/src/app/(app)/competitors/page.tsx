import { prisma } from "@/lib/db";
import {
  CompetitorMatrix,
  type CompetitorProfile,
  type MatrixFeature,
} from "@/components/competitors/profile-drawer";
import { UploadsPanelServer } from "@/components/visual-review/uploads-panel-server";

export const dynamic = "force-dynamic";

const competitorOrder = ["Zig", "Grab", "Gojek", "TADA", "Ryde"];

function sortCompetitors<T extends { name: string }>(competitors: T[]) {
  return [...competitors].sort((a, b) => {
    const aIndex = competitorOrder.indexOf(a.name);
    const bIndex = competitorOrder.indexOf(b.name);
    return (
      (aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex) -
      (bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex)
    );
  });
}

export default async function Page() {
  const [competitorsRaw, featuresRaw] = await Promise.all([
    prisma.competitor.findMany({
      include: {
        features: {
          include: { feature: true },
        },
      },
    }),
    prisma.feature.findMany({
      include: {
        competitors: true,
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
  ]);

  const competitors = sortCompetitors(competitorsRaw);

  const profiles: CompetitorProfile[] = competitors.map((competitor) => {
    const availability = competitor.features.reduce(
      (acc, feature) => {
        if (feature.status === "available") acc.available += 1;
        else if (feature.status === "partial") acc.partial += 1;
        else acc.none += 1;
        return acc;
      },
      { available: 0, partial: 0, none: 0 }
    );

    return {
      id: competitor.id,
      name: competitor.name,
      country: competitor.country,
      overview: competitor.overview,
      strengths: competitor.strengths,
      weaknesses: competitor.weaknesses,
      notes: competitor.features
        .map((feature) => feature.notes)
        .filter((note): note is string => Boolean(note)),
      availability,
    };
  });

  const featureGroups = featuresRaw.reduce<
    { category: string; features: MatrixFeature[] }[]
  >((groups, feature) => {
    let group = groups.find((item) => item.category === feature.category);
    if (!group) {
      group = { category: feature.category, features: [] };
      groups.push(group);
    }

    group.features.push({
      id: feature.id,
      name: feature.name,
      category: feature.category,
      competitors: Object.fromEntries(
        feature.competitors.map((competitorFeature) => [
          competitorFeature.competitorId,
          {
            status: competitorFeature.status,
            notes: competitorFeature.notes,
          },
        ])
      ),
    });

    return groups;
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Competitors
      </h1>
      <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted">
        Feature coverage across Zig and Singapore ride-hailing competitors.
        Click any competitor header to inspect positioning, strengths, and
        weakness signals. Click any feature to understand what it means, why it
        matters, and how Zig compares.
      </p>

      <div className="mt-8">
        <CompetitorMatrix
          competitors={profiles}
          featureGroups={featureGroups}
        />
      </div>

      <div className="mt-5">
        <UploadsPanelServer section="competitors" title="Competitor screens from Visual Trainer" />
      </div>
    </div>
  );
}
