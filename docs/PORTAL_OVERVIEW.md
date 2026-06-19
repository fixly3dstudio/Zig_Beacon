# Zig Beacon Portal Overview

This document explains what the Zig Beacon portal is, what each feature does, and why the UI/UX team designed it this way.

## What This Portal Is

Zig Beacon is a product intelligence portal for the CDG Zig taxi and mobility product team. It brings customer feedback, app store reviews, complaint themes, competitor benchmarks, product health signals, opportunities, and market news into one workspace.

The goal is to help product, design, engineering, and leadership teams answer practical questions quickly:

- What are customers complaining about?
- Which product modules need attention first?
- How does Zig compare with competitors?
- Which opportunities are worth building?
- What is the expected product and business impact?
- What signals should guide the next roadmap decision?

Instead of spreading insights across screenshots, spreadsheets, app reviews, Slack messages, support tickets, and news links, the portal centralizes them into a clear operating dashboard.

## Why The UI/UX Team Built It

The UI/UX team built this portal to make product decisions more evidence-based and easier to communicate.

Before this portal, product insights could be fragmented:

- App Store and Play Store reviews were hard to review at scale.
- Complaints were visible, but not always grouped by feature or severity.
- Competitor observations were difficult to compare consistently.
- Product opportunities were discussed, but not always tied to cost, revenue, or customer pain.
- Designers needed a place to connect screen flows, Beacon Score, complaints, and product health.

Zig Beacon solves this by giving every team a shared view of product reality.

## Design Philosophy

The portal is designed as an operational product cockpit, not a marketing website.

The UI direction is:

- Calm and minimal
- Data-first
- Easy to scan
- Dense but not cluttered
- Built for daily product work
- Clear enough for leadership reviews

The visual style uses:

- White, black, and grey as the base
- Zig blue for focus, selected states, and intelligence highlights
- Red for serious complaint or negative sentiment signals
- Green for connected, successful, or positive states
- Compact cards, tabs, filters, and report sections

The design avoids decorative hero sections, heavy gradients, large illustrations, and unnecessary marketing copy because the main job is decision support.

## Main Features

### Dashboard

The Dashboard gives a high-level product intelligence overview. It summarizes key metrics, recent customer signals, top complaints, opportunities, and product priorities.

Why it exists:

- Gives leadership and product teams a quick read.
- Helps teams see what changed recently.
- Connects customer pain with product and business action.

### Competitors

The Competitors section compares Zig with other ride-hailing and taxi apps such as Grab, Gojek, TADA, Ryde, and other relevant mobility products.

It helps the team understand:

- Which features competitors already offer
- Where Zig has parity
- Where Zig is behind
- Where Zig can differentiate
- What each feature means and why it matters

Why UI/UX did this:

Designers need competitor context before proposing flows. This section makes feature comparison structured instead of anecdotal.

### Global Mobility

Global Mobility shows regional mobility patterns and benchmark details across different markets.

It covers topics such as:

- Taxi-first markets
- Ride-hailing maturity
- Airport mobility
- Payment patterns
- Regulation models
- Regional product opportunities

Why UI/UX did this:

Zig operates in a local Singapore context, but product expectations are shaped globally. This module helps the team learn from other markets without copying blindly.

### Innovation Watch

Innovation Watch tracks new mobility ideas, product patterns, and emerging customer expectations.

It helps the team monitor:

- New ride-hailing features
- Driverless taxi developments
- Platform fee changes
- Airport flow innovations
- Loyalty and subscription ideas
- Payment and wallet trends

Why UI/UX did this:

Product teams need a structured way to separate useful innovation from noise. This section turns market signals into product learning.

### Transport News

Transport News gathers Singapore and international transport news relevant to taxi, ride-hailing, autonomous mobility, airport transport, platform fees, and mobility regulation.

It includes:

- Singapore transport news
- International mobility news
- Source links to publishers such as CNA, Mothership, CNN, and others

Why UI/UX did this:

Mobility product decisions are affected by policy, competition, public sentiment, and technology changes. This page keeps the team updated without leaving the portal.

### App Reviews

App Reviews pulls and displays customer reviews from App Store and Google Play.

The page supports:

- Store filtering
- Positive and negative filtering
- Rating filtering
- Module/category filtering
- Date filtering
- Public app rating summary
- Review-level analysis

Why UI/UX did this:

App reviews are one of the strongest direct customer feedback sources. The UI makes it easier to move from raw comments to product themes.

### Complaints

The Complaints section groups customer pain points across multiple sources such as App Store, Play Store, Reddit, Support, and Twitter.

It shows:

- Complaint source tabs
- Customer comments in their own words
- Top themes
- Feature/module reports
- Complaint volume
- Trend percentage
- Severity
- Recommended fixes
- Individual downloadable complaint reports

Why UI/UX did this:

Complaints are most useful when they are grouped by feature and severity. This section helps teams decide what to fix first.

### Product Health

Product Health converts customer signals, complaints, reviews, and feature readiness into a clearer view of how each product area is performing.

It helps answer:

- Which modules are healthy?
- Which modules are declining?
- Where are complaints hurting product trust?
- Which product areas need design or engineering attention?

Why UI/UX did this:

The team needs a shared product health language. This page turns scattered signals into a more consistent product readout.

### Beacon Score

Beacon Score evaluates product areas and feature flows against factors such as usability, reliability, sentiment, complaints, parity, and opportunity.

It is used to:

- Score product areas
- Explain why a feature is strong or weak
- Connect feature quality with customer impact
- Help prioritize design and engineering work

Why UI/UX did this:

Design feedback can become subjective. Beacon Score gives the team a more structured way to evaluate product quality.

### Opportunity Hub

Opportunity Hub turns complaints, reviews, and product gaps into potential roadmap opportunities.

It includes:

- Problem statements
- Evidence
- Impact
- Effort
- Development spend estimate
- Expected revenue estimate
- Priority status

Why UI/UX did this:

Roadmap conversations need both customer pain and business logic. This page helps the team compare opportunities in a practical way.

### AI Coach

AI Coach helps the team ask product questions and get guidance based on portal signals.

It can support:

- Product prioritization
- Complaint interpretation
- Opportunity framing
- Review summarization
- Strategic product thinking

Why UI/UX did this:

Teams often need help connecting many signals into a decision. AI Coach acts as a product thinking assistant grounded in the portal.

### Visual Trainer

Visual Trainer lets designers upload app screens or feature flows for analysis.

It supports:

- Beacon Score review
- Flow explanation
- Zig feature deep-dive
- Competitor teardown
- Pattern lessons

Why UI/UX did this:

Designers need a training space where screenshots become structured product learning. Visual Trainer helps connect UI flows with product quality, customer complaints, and Beacon Score.

### Settings

Settings manages portal operations and integrations.

It includes:

- App Store Connect setup
- Google Play setup placeholder
- UI/UX feedback flow
- Essential feature explanation
- Portal operations

Why UI/UX did this:

Settings keeps operational controls in one predictable place and separates configuration from analysis pages.

## How The Portal Helps Each Team

### Product Managers

Product managers can use the portal to:

- Identify top customer pain points
- Prioritize opportunities
- Compare cost and expected revenue
- Prepare roadmap discussions
- Track product health

### UI/UX Designers

Designers can use the portal to:

- Understand customer complaints before designing
- Compare competitor flows
- Upload and review screen flows
- Use Beacon Score to explain design quality
- Connect designs to customer and business impact

### Engineers

Engineers can use the portal to:

- Understand why a feature is needed
- See complaint volume and severity
- Review module-level problem reports
- Connect Jira tickets or implementation work to customer evidence
- Understand integrations and data flows

### Leadership

Leadership can use the portal to:

- See product health at a glance
- Understand where customer trust is at risk
- Review opportunity size
- Track competitive position
- Make faster product investment decisions

## Key UX Decisions

### Compact Cards

Cards are used for metrics, reports, and repeated items. They make the portal easy to scan without turning it into a marketing layout.

### Tabs And Filters

Tabs separate major modes, while filters help users narrow down signals by store, sentiment, module, source, rating, or date.

### Downloadable Reports

Complaint reports can be downloaded individually so teams can share a specific feature issue with stakeholders.

### Evidence-First Copy

The portal uses clear product language such as:

- What to fix first
- Where to focus
- Recommended fix
- High severity
- Focus score
- Selected reviews

This keeps the language actionable.

### Quiet Animation

Animation is used only to support understanding:

- Page transitions
- Tab changes
- Expandable issue details
- Loading states
- List entry motion

The motion is intentionally subtle so the portal feels professional and fast.

## Data Sources

The portal can use:

- App Store reviews
- Google Play reviews
- Reddit mentions
- Complaint clusters
- Competitor data
- Product health scores
- Opportunity data
- Transport news feeds
- Visual screen uploads

These sources are combined to give the team a more complete view of customer and market signals.

## Why This Portal Matters

Zig Beacon helps the team move from opinion-based product discussions to evidence-based decisions.

It gives the team a shared place to see:

- What customers are saying
- What competitors are doing
- What features need attention
- What opportunities are worth building
- How design decisions connect to business and customer outcomes

The portal is not just a dashboard. It is a decision system for improving the Zig product experience.
