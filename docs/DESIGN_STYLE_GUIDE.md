# Zig Beacon Design Style Guide

This document captures the UI/UX style, interaction language, and animation patterns used in the Zig Beacon portal. Use it when extending the portal so new pages feel like part of the same product.

## Design Personality

Zig Beacon should feel like a serious product intelligence cockpit:

- Clear, calm, and executive-ready
- Dense enough for repeated product work
- Minimal, not decorative
- Data-first, but easy to scan
- Confident use of black, white, muted grey, and Zig blue
- Sharp hierarchy with small labels, large numbers, and compact controls

Avoid marketing-page styling, oversized hero sections, decorative gradients, and heavy illustration. The portal is an operational product tool.

## Visual Foundation

### Color Tokens

Defined in `portal/src/app/globals.css`.

| Token | Light | Dark | Usage |
| --- | --- | --- | --- |
| `background` | `#ffffff` | `#0b0b0d` | Page background |
| `foreground` | `#0a0a0a` | `#f4f4f5` | Primary text, selected controls |
| `muted` | `#71717a` | `#9a9aa6` | Secondary text, metadata |
| `surface` | `#fafafa` | `#161619` | Empty states, subtle panels |
| `elevated` | `#f4f4f5` | `#1f1f24` | Chips, hover fills, light UI backgrounds |
| `track` | `#e4e4e7` | `#2c2c33` | Progress tracks, dividers |
| `border` | `#e4e4e7` | `#292930` | Card and control borders |
| `brand` | `#0367fc` | `#4f9bff` | Zig blue, active intelligence states |
| `danger` | `#dc2626` | `#f87171` | Negative sentiment, high severity |
| `warn` | `#f59e0b` | `#fbbf24` | Warnings, medium severity |
| `success` | `#16a34a` | `#4ade80` | Connected, complete, positive states |

### Color Usage Rules

- Use white/black/grey as the main interface.
- Use Zig blue only for selected accents, priority states, and learning/AI affordances.
- Use red only when a signal is truly negative or high severity.
- Use green only for success, connection, completion, or positive sentiment.
- Use amber for warnings and medium risk.
- Avoid one-page palettes dominated by a single hue.

## Typography

Font stack:

```css
Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

Mono stack:

```css
"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace
```

### Type Hierarchy

| Element | Style |
| --- | --- |
| Page title | `text-2xl font-semibold tracking-tight` |
| Card heading | `text-base` to `text-xl`, usually `font-semibold tracking-tight` |
| Metric numbers | `text-3xl font-semibold tabular-nums` |
| Small labels | `text-[11px] font-medium uppercase tracking-wider text-muted` |
| Body copy | `text-sm leading-6 text-muted` |
| Dense data rows | `text-[13px] leading-5/6` |
| Metadata | `text-[11px] text-muted tabular-nums` |

### Typography Rules

- Keep headings compact. This is a tool, not a landing page.
- Use uppercase labels for dashboard sections and metric labels.
- Use `tabular-nums` for ratings, counts, percentages, ranks, and trends.
- Keep body copy short and explanatory.
- Do not use negative letter spacing.

## Layout System

### App Shell

The authenticated app uses:

```text
Sidebar + Topbar + scrollable content area
```

Content container:

```text
max-width: 1200px
padding: 16px mobile, 24px/32px desktop
```

Layout file:

```text
portal/src/app/(app)/layout.tsx
```

### Page Layout Pattern

Most pages follow this structure:

1. Small badge or context label when useful
2. Page title
3. One short description
4. Optional action button on the right
5. KPI row or tab/filter row
6. Main content grid
7. Detail cards, lists, reports, or interactive panels

Example spacing:

- `mb-6` after page header
- `mt-5` before tab content or result lists
- `gap-4` for KPI cards
- `gap-5` for larger grids
- `space-y-3` for stacked feed items
- `space-y-6` for report sections

## Cards and Surfaces

Base card:

```tsx
rounded-xl border border-border bg-background p-6
```

Component:

```text
portal/src/components/ui/card.tsx
```

### Card Rules

- Use cards for repeated items, metric blocks, modals, and framed tools.
- Do not nest cards inside cards unless there is a clear repeated sub-item.
- Prefer full-width sections or grids over decorative floating panels.
- Use `rounded-xl` for cards and panels.
- Use smaller radii for compact controls and buttons.
- Keep borders quiet and consistent.

### KPI Cards

KPI cards use:

- Small uppercase label
- Large metric
- Short muted explanation
- Optional small icon or trend badge

Do not overload KPI cards with long explanation text.

## Navigation

Navigation is grouped by product mental model:

- Dashboard
- Intelligence
- Customers
- Product
- AI
- Settings

Icons come from `lucide-react`.

Config file:

```text
portal/src/components/nav-config.ts
```

### Navigation Rules

- Use concise labels: `Competitors`, `Global Mobility`, `App Reviews`.
- Use one icon per nav item.
- Active items should use strong contrast.
- Keep the sidebar calm and predictable.

## Buttons and Controls

### Primary Button

Use black foreground buttons for primary actions:

```tsx
rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background
```

Examples:

- `Start training session`
- `Sync now`
- `Create ticket`

### Secondary Button

Use bordered buttons:

```tsx
rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-muted
```

### Pills and Filters

Filter pills use:

```tsx
rounded-full border px-3.5 py-2 text-xs font-medium
```

Selected state:

```tsx
border-foreground bg-foreground text-background
```

Unselected state:

```tsx
border-border bg-background text-muted hover:text-foreground
```

### Selects

Select inputs are compact, bordered, and icon-assisted:

- Height: `h-9`
- Border: `border-border`
- Text: `text-xs font-medium`
- Chevron icon on the right

## Data Display Patterns

### Metric Rows

Use metric rows when comparing:

- Reviews
- Ratings
- Complaint counts
- High severity counts
- Trend %
- Focus score

Use `tabular-nums` and keep units visible.

### Progress Bars

Progress bars use:

- Track: `bg-elevated`
- Fill: `bg-foreground` or `bg-brand`
- Height: `h-1.5`
- Radius: `rounded-full`

### Sentiment and Severity

| State | Treatment |
| --- | --- |
| Negative / high | Red dot, red text, red-tinted border or pill |
| Medium / warning | Amber |
| Positive / success | Green |
| Neutral | Grey/elevated |

Use red sparingly so serious problems stand out.

## UX Patterns

### Tabs

Top-level tabs use a segmented control:

```tsx
inline-flex rounded-xl border border-border bg-surface p-1
```

Selected tab:

```tsx
bg-foreground text-background
```

Use tabs for major content modes, such as:

- `What people are saying`
- `Reports`

### Expandable Detail Rows

Used in complaint issue breakdowns.

Pattern:

- Full-width row button
- Severity dot on the left
- Issue text
- Count
- Trend
- Chevron
- Expanded area with root cause, progress bar, and recommended fix

Use expandable rows when the page needs density but still has deep detail.

### Source Filters

Use source filters when content comes from multiple media:

- App Store
- Play Store
- Reddit
- Support
- Twitter

Each source should show a count.

### Empty States

Empty states are quiet and useful:

- Dashed border
- Muted icon
- One short explanation
- One suggested recovery action

Avoid dramatic empty-state artwork.

## Animation and Motion

Animation library:

```text
framer-motion
```

### Page Transitions

The portal uses light page transitions through `PageTransition`.

Motion should feel fast and functional.

Recommended default:

```tsx
initial={{ opacity: 0, y: 8 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -8 }}
transition={{ duration: 0.18 }}
```

### List Item Entrance

Feed items and cards can stagger lightly:

```tsx
initial={{ opacity: 0, y: 6 }}
animate={{ opacity: 1, y: 0 }}
transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.2 }}
```

Rules:

- Keep stagger delays under `0.3s`.
- Do not animate layout-heavy dashboard metrics excessively.
- Motion should clarify state change, not decorate.

### Expand / Collapse

Expandable sections use `AnimatePresence`:

```tsx
initial={{ opacity: 0, height: 0 }}
animate={{ opacity: 1, height: "auto" }}
exit={{ opacity: 0, height: 0 }}
```

Use this for root causes, report details, and AI analysis reveals.

### Loading States

Loading states use:

- `Loader2` icon
- `animate-spin`
- Short status text
- No blocking overlays unless absolutely necessary

For AI/Visual Trainer, use a calm processing panel with a small animated icon.

## AI and Analysis UI

AI output should feel like an analysis workspace, not a chat toy.

Patterns:

- Markdown renderer with compact headings
- Uppercase section headings
- Bullet lists with small dots
- Inline code styling
- Clear saved/complete state

Markdown renderer:

```text
portal/src/components/ui/markdown.tsx
```

### AI Result Panels

Use:

- Rounded panel
- Border
- `bg-surface`
- Min height for stable layout
- Streaming cursor only while generating

Do not use large chat bubbles for analytical pages unless the page is specifically AI Coach.

## Report Design

Complaint reports use a more focused report style:

- Priority hero block
- Metric chips
- Expandable issue details
- Download report button
- Generated HTML report for individual modules

Reports should answer:

1. What feature/module is affected?
2. How many people complained?
3. How severe is it?
4. What is the trend?
5. What should the product team fix first?

## Responsive Behavior

General rules:

- Use single-column layouts on mobile.
- Use `grid-cols-12` for dashboard and report pages.
- Use `xl:grid-cols-[1fr_1fr]` for two-panel tools like Visual Trainer.
- Keep filter pills horizontally scrollable on small screens.
- Avoid text overlap by using `min-w-0`, `truncate`, and wrapping controls.

## Accessibility Expectations

- Buttons must use real `<button>` elements.
- Icon-only buttons need hover title or visible context.
- Form inputs must have labels.
- Do not rely on color alone for severity; pair dots/icons with text.
- Keep focus states visible through borders or brand color.
- External links should use `target="_blank"` and `rel="noreferrer"`.

## Copywriting Style

Tone:

- Clear
- Product-focused
- Practical
- Short

Use phrases like:

- `What to fix first`
- `Where to focus`
- `Recommended fix`
- `App store reviews`
- `Selected reviews`
- `Focus score`

Avoid:

- Marketing slogans
- Long paragraphs inside cards
- Explaining obvious UI controls
- Overly playful copy in operational pages

## Reusable Implementation Rules

When adding a new page:

1. Start with the app shell container and page header.
2. Use `Card` and `CardLabel` for metrics and framed content.
3. Use `lucide-react` icons.
4. Use compact filters rather than large form panels.
5. Prefer data-backed labels and counts.
6. Add motion only to tabs, list entrances, modals, and expandable details.
7. Run `npm run build` before shipping.

## Example Page Skeleton

```tsx
export default function Page() {
  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Page title
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted">
            One clear sentence explaining what this page helps the team decide.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-5">
          <CardLabel>Metric label</CardLabel>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">
            42
          </p>
          <p className="mt-1 text-xs text-muted">Useful context</p>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-12 gap-5">
        <Card className="col-span-12 lg:col-span-8">
          Main work area
        </Card>
        <Card className="col-span-12 lg:col-span-4">
          Supporting rail
        </Card>
      </div>
    </div>
  );
}
```

## Design Checklist

Before shipping a new UI:

- Does the first viewport show the actual product work, not marketing?
- Are primary metrics readable within 3 seconds?
- Are filters compact and easy to scan?
- Are cards used only where framing helps?
- Are labels and numbers aligned with `tabular-nums` where needed?
- Does motion help explain state change?
- Does the page work on mobile without text overlap?
- Are success, warning, and danger states semantically correct?
- Does the page match the quiet black/white/grey/Zig-blue visual language?
