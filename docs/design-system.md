# Design System - Anime Tracking Platform

A dark-mode-first, card-driven, data-visualization-focused design system built on **shadcn/ui**.

## Design Philosophy

The UI should feel **premium, calm, and analytical**:

- **Clarity over decoration** - Let anime artwork be the visual interest
- **Visual comprehension** - Progress bars, completion states at a glance
- **Focused interaction** - No visual noise competing with anime content

Inspired by: Push (iOS workout app), AniList.co

---

## Color System

### Dark Mode (Primary & Default)

Dark mode is **not optional** - it is the default and primary experience. Background colors are near-black, not gray.

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#0B0B0C` | App background |
| `--card` | `#151518` | Card surfaces |
| `--foreground` | `#FAFAFA` | Primary text |
| `--muted-foreground` | `65% opacity` | Secondary text |
| `--primary` | `#3B82F6` | Links, interactive elements |
| `--border` | `#2A2A2E` | Subtle borders |

### Semantic Status Colors

Colors convey **meaning**, not decoration:

| Status | Color | Token | Usage |
|--------|-------|-------|-------|
| Watching | Green | `--status-watching` | Currently watching anime |
| Completed | Purple | `--status-completed` | Finished anime |
| Planned | Gray | `--status-planned` | Plan to watch |
| On Hold | Amber | `--status-on-hold` | Paused anime |
| Dropped | Red | `--status-dropped` | Dropped (minimal use) |

---

## Typography

**Font Stack:** System fonts (Geist Sans, Geist Mono)

Hierarchy is achieved through:
- Font weight (400 regular, 500 medium, 600 semibold)
- Opacity levels (100%, 70%, 50%)
- Spacing - not aggressive size jumps

### Text Hierarchy Classes

```tsx
// Primary text (default)
<p className="text-foreground">Primary content</p>

// Secondary text
<p className="text-muted-foreground">Secondary content</p>

// Tertiary text
<p className="text-muted-foreground/70">Metadata, timestamps</p>
```

---

## Components

### Card

Cards are the primary structural element. All content lives inside cards.

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Anime Title</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

**Card Properties:**
- Background: `var(--card)` - slightly lighter than app background
- No visible borders (structure through contrast)
- Consistent 16px radius

---

### Badge (Status Indicators)

Custom variants for anime tracking status:

```tsx
import { Badge } from "@/components/ui/badge"

// Standard variants
<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>

// Anime tracking status variants
<Badge variant="watching">Watching</Badge>
<Badge variant="completed">Completed</Badge>
<Badge variant="planned">Plan to Watch</Badge>
<Badge variant="onHold">On Hold</Badge>
<Badge variant="dropped">Dropped</Badge>
```

**Status Badge Styling:**
- Subtle background (15% opacity)
- Matching text color
- Subtle border (30% opacity)
- Hover state increases background opacity

---

### Progress (Episode Tracking)

Use with status colors for visual tracking:

```tsx
import { Progress } from "@/components/ui/progress"

// Basic progress
<Progress value={75} />

// With status color
<Progress
  value={(currentEpisode / totalEpisodes) * 100}
  className="[&>div]:bg-status-watching"
/>
```

---

### Button

```tsx
import { Button } from "@/components/ui/button"

// Primary CTA - high contrast
<Button>Add to List</Button>

// Secondary actions
<Button variant="secondary">Edit</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Remove</Button>
```

**Button Guidelines:**
- Primary CTA: High contrast, large tap area
- Secondary actions: Muted, never compete with primary data
- Full-width on mobile where appropriate

---

### Dialog (Modals)

For add-to-list, edit tracking, etc:

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button>Add to List</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Add Anime</DialogTitle>
    </DialogHeader>
    {/* Form content */}
  </DialogContent>
</Dialog>
```

---

### Tabs

For profile sections, anime detail tabs:

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

<Tabs defaultValue="watching">
  <TabsList>
    <TabsTrigger value="watching">Watching</TabsTrigger>
    <TabsTrigger value="completed">Completed</TabsTrigger>
    <TabsTrigger value="planned">Planned</TabsTrigger>
  </TabsList>
  <TabsContent value="watching">
    {/* Anime list */}
  </TabsContent>
</Tabs>
```

---

### Skeleton (Loading States)

```tsx
import { Skeleton } from "@/components/ui/skeleton"

// Anime card skeleton
<Card>
  <Skeleton className="aspect-[2/3] w-full" />
  <CardContent>
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-3 w-1/2 mt-2" />
  </CardContent>
</Card>
```

---

## Layout Patterns

### Mobile-First Grid

```tsx
// Anime grid - responsive
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
  {animeList.map(anime => (
    <AnimeCard key={anime.id} anime={anime} />
  ))}
</div>
```

### Spacing

- Page padding: `p-4` (mobile), `p-6` (desktop)
- Card gap: `gap-4`
- Section spacing: `space-y-6`

---

## Anime-Specific Components

### AnimeCard Pattern

```tsx
import { Card, CardContent } from "@/components/ui/card"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Image from "next/image"

interface AnimeCardProps {
  anime: {
    id: string
    title: string
    posterUrl: string
    status: "watching" | "completed" | "planned" | "onHold" | "dropped"
    currentEpisode: number
    totalEpisodes: number
  }
}

function AnimeCard({ anime }: AnimeCardProps) {
  const progress = (anime.currentEpisode / anime.totalEpisodes) * 100

  return (
    <Card className="overflow-hidden">
      <AspectRatio ratio={2/3}>
        <Image
          src={anime.posterUrl}
          alt={anime.title}
          fill
          className="object-cover"
        />
      </AspectRatio>
      <CardContent className="p-3">
        <h3 className="font-medium text-sm line-clamp-2">{anime.title}</h3>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            {anime.currentEpisode}/{anime.totalEpisodes}
          </span>
          <Badge variant={anime.status}>
            {anime.status === "onHold" ? "On Hold" :
             anime.status.charAt(0).toUpperCase() + anime.status.slice(1)}
          </Badge>
        </div>
        {anime.status === "watching" && (
          <Progress
            value={progress}
            className="mt-2 h-1 [&>div]:bg-status-watching"
          />
        )}
      </CardContent>
    </Card>
  )
}
```

### StatusBadge Helper

```tsx
import { Badge, type AnimeStatus } from "@/components/ui/badge"

const statusLabels: Record<AnimeStatus, string> = {
  watching: "Watching",
  completed: "Completed",
  planned: "Plan to Watch",
  onHold: "On Hold",
  dropped: "Dropped",
}

interface StatusBadgeProps {
  status: AnimeStatus
}

function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant={status}>
      {statusLabels[status]}
    </Badge>
  )
}
```

---

## Data Visualization

Stats should be understandable **without reading numbers**.

### Progress Indicators

```tsx
// Episode progress with status color
<div className="space-y-1">
  <div className="flex justify-between text-sm">
    <span>Progress</span>
    <span className="text-muted-foreground">8/12</span>
  </div>
  <Progress
    value={66}
    className="h-2 [&>div]:bg-status-watching"
  />
</div>
```

### Stat Cards

```tsx
<Card>
  <CardContent className="p-4">
    <p className="text-sm text-muted-foreground">Episodes Watched</p>
    <p className="text-2xl font-semibold">1,247</p>
    <p className="text-xs text-status-watching mt-1">+23 this week</p>
  </CardContent>
</Card>
```

---

## Accessibility

All components are built on Radix UI primitives with:
- Full keyboard navigation
- ARIA labels and roles
- Focus management
- Screen reader support

---

## File Structure

```
src/
├── components/
│   ├── ui/                    # shadcn components
│   │   ├── badge.tsx          # Extended with status variants
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── progress.tsx
│   │   └── ...
│   ├── anime/                 # Anime-specific compositions
│   │   ├── anime-card.tsx
│   │   ├── anime-grid.tsx
│   │   ├── episode-progress.tsx
│   │   └── status-badge.tsx
│   └── layout/
│       ├── header.tsx
│       └── bottom-nav.tsx
├── app/
│   └── globals.css            # Theme customizations
└── lib/
    └── utils.ts               # cn() helper
```

---

## Installed Components

The following shadcn/ui components are installed and ready to use:

- `card` - Container component
- `button` - Interactive buttons
- `badge` - Labels and status indicators (extended with anime status variants)
- `progress` - Progress bars
- `avatar` - User/anime avatars
- `tabs` - Tab navigation
- `dialog` - Modal dialogs
- `dropdown-menu` - Dropdown menus
- `select` - Select inputs
- `input` - Text inputs
- `skeleton` - Loading placeholders
- `separator` - Visual dividers
- `scroll-area` - Scrollable containers
- `sheet` - Slide-out panels
- `sonner` - Toast notifications
- `chart` - Data visualizations
- `aspect-ratio` - Aspect ratio containers

---

## Emotional Tone

The UI should feel:
- **Calm** - A peaceful space to track your anime journey
- **Analytical** - Data-driven insights without overwhelming
- **Confident** - Premium feel that respects the user&apos;s time
- **Focused** - Anime content is the star, UI supports it

It should **not** feel:
- Flashy or gamified
- Cluttered with social noise
- Generic or template-like
- Overly decorated or &quot;anime aesthetic&quot; (no sakura petals, etc.)

