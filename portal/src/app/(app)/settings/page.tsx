import {
  BadgeCheck,
  BellRing,
  Brain,
  DatabaseZap,
  LifeBuoy,
  Mail,
  Palette,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { Card, CardLabel } from "@/components/ui/card";
import { SettingsFeedbackForm } from "@/components/settings/feedback-form";
import { StoreIntegrations } from "@/components/settings/store-integrations";
import { getIntegrationStatus } from "@/lib/reviews/credentials";

export const dynamic = "force-dynamic";

const essentialFeatures = [
  {
    title: "Daily intelligence refresh",
    description:
      "Transport news, customer signals, and competitor movement stay fresh for product decisions.",
    icon: BellRing,
  },
  {
    title: "Beacon Score governance",
    description:
      "Feature flows, complaints, product health, and opportunities roll into a clear score narrative.",
    icon: BadgeCheck,
  },
  {
    title: "AI-assisted product review",
    description:
      "AI Coach and Visual Trainer help the team explain, score, and improve feature work.",
    icon: Brain,
  },
  {
    title: "Feedback intake",
    description:
      "Collect feature requests, usability issues, data gaps, and portal improvements in one place.",
    icon: LifeBuoy,
  },
  {
    title: "Source traceability",
    description:
      "Every insight should point back to complaints, scores, opportunities, news, or competitor data.",
    icon: DatabaseZap,
  },
  {
    title: "Admin-ready controls",
    description:
      "Prepared for future permissions, notification settings, and data refresh controls.",
    icon: SlidersHorizontal,
  },
];

const teamPrinciples = [
  "Designed for product managers, UX designers, and strategy teams who need evidence before roadmap decisions.",
  "Built around quiet, scannable dashboards instead of marketing pages, so repeated use stays fast.",
  "Every new section should explain the product implication, not just show raw data.",
];

export default async function Page() {
  const integrations = await getIntegrationStatus();
  return (
    <div>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand">
            <ShieldCheck size={14} />
            Portal operations
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
            Settings
          </h1>
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted">
            Manage the essential capabilities behind Zig Beacon, understand how
            the UI/UX team shapes the portal, and send feature feedback directly
            to the product design owner.
          </p>
        </div>
        <a
          href="mailto:manoharanharsaikron@comfortdelgro.com"
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface"
        >
          <Mail size={16} />
          Email UI/UX team
        </a>
      </div>

      <StoreIntegrations play={integrations.play} appStore={integrations.appStore} />

      <section className="mt-8">
        <CardLabel>Essential features</CardLabel>
        <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
          What this portal must keep doing well
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {essentialFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card className="p-5" key={feature.title}>
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface text-brand">
                    <Icon size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-foreground text-background">
              <Palette size={20} />
            </div>
            <div>
              <CardLabel>Developed by</CardLabel>
              <h2 className="mt-1 text-lg font-semibold text-foreground">
                UI/UX Team
              </h2>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-muted">
            Zig Beacon is shaped as an internal product-intelligence workspace:
            clean navigation, evidence-first pages, and decision-ready views for
            product and design reviews.
          </p>
          <div className="mt-5 space-y-3">
            {teamPrinciples.map((principle) => (
              <div
                className="flex gap-3 rounded-lg border border-border bg-surface p-3"
                key={principle}
              >
                <Sparkles size={15} className="mt-0.5 shrink-0 text-brand" />
                <p className="text-sm leading-6 text-foreground">{principle}</p>
              </div>
            ))}
          </div>
        </Card>

        <SettingsFeedbackForm />
      </div>
    </div>
  );
}
