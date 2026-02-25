# Betty Infinite Carousel Task

Interview implementation of a scroll-only infinite carousel in Next.js + TypeScript.

## Overview

This project focuses on building an infinite-feeling, high-performance carousel with:
- Native horizontal scroll behavior (no next/prev buttons).
- Fluid continuous wheel/trackpad scrolling (no snap behavior).
- Simple clone-based infinite looping.
- Fault-tolerant data/image loading.
- Unit + integration + E2E test coverage.

## Key Features

- Infinite loop illusion via head/tail clones and seamless scroll repositioning.
- Responsive visible-card layout by breakpoint (5 desktop, 3 tablet, 2 mobile).
- Fixed slide frame size (`16:9`) regardless of source image ratio.
- Slowed-down fluid wheel control tuned for trackpads.
- Loading/error/retry states for API failures.
- Offline-only placeholder fallback dataset (1000 local slides).
- Per-slide fallback for broken image URLs.
- Error boundary for unexpected render/runtime errors.
- Accessibility semantics for carousel region and slide labels.

## Tech Stack

- React 19
- TypeScript
- Next.js (App Router)
- Tailwind CSS 4
- Vitest + Testing Library
- Playwright
- Biome + Husky

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Required:

```env
NEXT_PUBLIC_PICSUM_API_BASE=https://picsum.photos
```

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `npm run dev` - start development server
- `npm run build` - production build
- `npm run start` - run production build locally
- `npm run test` - run Vitest suite once
- `npm run test:watch` - run Vitest in watch mode
- `npm run test:e2e` - run Playwright tests
- `npm run lint` - run Biome checks
- `npm run lint:fix` - apply safe Biome fixes
- `npm run format` - format code with Biome

## Project Structure

```text
app/
  globals.css
  layout.tsx
  page.tsx

components/
  infinite-carousel.tsx
  carousel-slide.tsx
  carousel-state.tsx
  carousel-error-boundary.tsx

hooks/
  use-picsum-images.ts
  use-wheel-rail-motion.ts

lib/
  constants.ts
  helpers.ts
  picsum.ts

types/
  carousel.ts
  hooks.ts
  picsum.ts

tests/
  unit/
    components/carousel/
    hooks/
    lib/
    app.test.tsx
  e2e/
    carousel.spec.ts
```

## Architecture

### UI Layer

- `app/page.tsx`
  - Composes data state + carousel UI.
  - Chooses between success UI (`InfiniteCarousel`) and status UI (`CarouselState`).
  - Wraps content with `CarouselErrorBoundary`.

- `components/infinite-carousel.tsx`
  - Renders all real slides plus edge clones for loop continuity.
  - Pre-aligns the rail to the real segment before first visible frame.
  - Uses fixed frame sizing (`16:9`) and dynamic card width based on viewport breakpoints.
  - Computes exact card width from rail inner width (client width minus paddings/gaps) to avoid partial 6th-card cutoffs.
  - Uses delayed hover-only expansion (`1s`) with a moderate enlarge scale (`1.35`).
  - Keeps wheel motion active while cards are hovered/expanded.
  - Wires infinite loop bound correction and displays scroll hint.

- `components/carousel-slide.tsx`
  - Renders each image with responsive attributes.
  - Falls back to `"Image unavailable"` on image error.

- `components/carousel-state.tsx`
  - Loading and API-error UI with retry action.

- `components/carousel-error-boundary.tsx`
  - Catches unexpected rendering errors and shows recovery UI.

### Behavior Layer

- `hooks/use-picsum-images.ts`
  - Fetch lifecycle: `loading | success | error`.
  - Abort-safe requests via `AbortController`.
  - Explicit `retry()` mechanism.

- `hooks/use-wheel-rail-motion.ts`
  - Handles wheel/trackpad translation to horizontal movement.
  - Applies frame throttle (`requestAnimationFrame`) with latest-event-wins behavior.
  - Uses axis dominance (`deltaX` vs `deltaY`) to infer intended horizontal movement.
  - No travel caps, gesture budget, or settle snapping.

### Logic Layer

- `lib/picsum.ts`
  - Paged API fetching.
  - API payload mapping to app-level `CarouselItem`.
  - `srcSet` generation and aspect ratio derivation.

- `lib/constants.ts`
  - Scroll rail tuning constants:
    - `RAIL_WHEEL_GAIN`
    - `RAIL_HOVER_ACTIVATE_DELAY_MS`
  - Carousel sizing constants:
    - `CAROUSEL_BREAKPOINTS`
    - `CAROUSEL_SLIDE_SIZES`

- `lib/helpers.ts`
  - Motion math and measurements (`wheelDeltaToPixels`, `measureSlideStride`).
  - Loop utility:
    - `measureLoopSegmentWidth`

## Infinite Algorithm (How It Works)

1. Render `[head clones, real slides, tail clones]`.
2. On mount, jump to the beginning of the real slide segment.
3. During scrolling, detect when the viewport enters head or tail clone zones.
4. Reposition scroll by one real-segment width with `behavior: "auto"`.
5. User perceives continuous infinite looping with a simpler DOM-loop strategy.

## Performance Notes

- Breakpoint-based geometry prevents layout jitter between mixed-ratio API images.
- `requestAnimationFrame` is used for wheel frame throttling.
- CSS hints:
  - `contain: layout style`
  - `content-visibility: auto`
- Eager-loading for the first rendered group; lazy-loading for remaining slides.
- Images use `object-cover` to fill frames without changing slider size.

## Scroll UX Behavior

- Wheel/trackpad input is translated to horizontal travel with gain `0.65`.
- Wheel deltas are normalized across pixel/line/page delta modes for consistent device behavior.
- Wheel processing is frame-throttled (`requestAnimationFrame`) with latest-event-wins semantics.
- No CSS snapping and no JS settle snapping are applied.
- No per-frame/per-gesture travel caps are applied.
- The rail is hidden for the first init frame, then revealed after real-segment alignment to avoid first-paint clone cutoff.
- Cards stay neutral size during scrolling.
- Hovering a card for `1s` expands it moderately (`scale-[1.35]`) for focus.
- Wheel scrolling remains active while a card is expanded.
- Touch scrolling remains native and unchanged.

## Accessibility Notes

- Carousel region has `aria-label="Image carousel"` and roledescription.
- Slides expose `aria-label="Slide X of N"`.
- Fallback content for image failures remains readable.

## Testing Strategy

### Unit and Integration (Vitest)

- `tests/unit/lib/picsum.test.ts`
  - API mapping, env validation, pagination, signal passing.

- `tests/unit/hooks/use-picsum-images.test.ts`
  - Lifecycle transitions, signal usage, unmount abort.

- `tests/unit/components/carousel/*.test.tsx`
  - Carousel render behavior, fallback UI, accessibility semantics.

- `tests/unit/app-page.test.tsx`
  - App-level smoke render.

### E2E (Playwright)

- `tests/e2e/carousel.spec.ts`
  - Mocks Picsum API responses.
  - Verifies carousel visibility, scroll behavior, and clone-based loop rendering.

## Troubleshooting

### Error: `Missing NEXT_PUBLIC_PICSUM_API_BASE`

- Ensure `.env` exists and includes:
  - `NEXT_PUBLIC_PICSUM_API_BASE=https://picsum.photos`

### E2E fails to start app server

- Verify port `3000` is available.
- Run `npm run dev` manually to confirm app startup.

## Offline Fallback Behavior

When internet is unavailable, the app can still render a fully working carousel:

- Trigger condition:
  - remote fetch fails, and
  - browser reports offline (`navigator.onLine === false`).
- Behavior:
  - app generates `limit` placeholder items from one local SVG image,
  - current app usage means `1000` placeholder slides,
  - carousel renders normally and shows an `Offline placeholder mode` badge.
- Limitation:
  - placeholder slides are synthetic and do not represent real remote photos.
