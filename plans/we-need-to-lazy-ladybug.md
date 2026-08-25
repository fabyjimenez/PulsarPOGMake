# Pulsar — Phase 3 Plan

## Context
Five improvements requested after Phase 2 completion:
1. Light mode looks dated (grey card fills feel old-school)
2. Bell icon should be Music or sound icon (bell = notifications, not audio)
3. Post-workout share: generate a branded image with metrics + optional selfie, share to social or save
4. Interval plans: structured multi-day/multi-workout programs users can follow or that they can build themselves and shared with others through a link
5. Sprint timer: dedicated running-sprint mode with distance labels + pace display

---

## 1  Light Mode Refresh — `src/app/theme.ts`

**Problem:** Current light palette uses `#EAEAEE` cards on `#F0F0F5` bg — both grey, so cards don't lift off the surface.

**Fix:** White cards on a light grey canvas (Apple/Notion pattern). Only `makeTheme(false)` changes:

```
bg:       "#F5F5F7"      // light grey page wash
surface:  "#FFFFFF"      // phone shell white
surface2: "#F5F5F7"
panel:    "#FFFFFF"
card:     "#FFFFFF"      // ← white cards (was #EAEAEE)
btn:      "#F0F0F3"      // light pill buttons
hairline: "rgba(0,0,0,0.07)"  // subtle dividers
shadow:   "0 32px 80px rgba(0,0,0,0.10)"
muted:    "#6E6E7A"      // slightly richer grey text
accent:   "#4A7C00"      // richer lime for light bg contrast
effortColor: "#4A7C00"
restColor:   "#9A9AAA"
readyColor:  "#7A7A88"
```

Cards will now feel elevated against the grey wash without needing box-shadows.

---

## 2  Bell → Music Icon — `src/app/components/MainApp.tsx`

- Import `Music` from `lucide-react` alongside existing imports (remove `Bell`)
- Replace `<Bell size={15} color={t.muted} />` with `<Music size={15} color={t.muted} />`
- One line change; no logic impact

---

## 3  Share Completion — New `ShareModal.tsx` + hook into `CompletionSummary.tsx` + `MainApp.tsx`

### Flow
1. `CompletionSummary` gets a **"Share"** button beside "Try again"
2. Tapping opens `ShareModal` as a bottom-sheet overlay (z-index 70, above CompletionSummary)
3. ShareModal has two steps:
   - **Step A — Preview**: Shows a pre-rendered branded share card (Canvas). User sees the final image.
   - **Step B — Add photo (optional)**: `<input type="file" accept="image/*" capture="user">` lets user pick/take a photo. Once picked, it's composited behind the stats card on the canvas.
4. Action buttons:
   - **Share** → `navigator.share({ files: [imageFile] })` (Web Share API Level 2, supported on iOS Safari + Android Chrome). Falls back to download if unsupported.
   - **Save image** → creates an `<a download>` link from canvas `toDataURL()`
   - **Cancel** → closes modal

### ShareCard Canvas render (no external deps)
Draw directly to an off-screen `<canvas>` (1080×1920 for stories aspect ratio):
- Background: solid `#0A0A0B` (always dark, looks better as a story)
- Accent circle glow top-center (lime, blurred via radial gradient)
- PULSAR wordmark + pulsing dot (drawn as text)
- Large duration in 120px weight-900 font
- Stat grid: Calories / Rounds / Work time / Rest time (small caps labels)
- Bottom tag: "pulsar.app" in muted text
- If user uploaded a photo: draw it full-bleed first, then overlay a semi-transparent dark gradient, then draw all the above text on top

### New file: `src/app/components/ShareModal.tsx`
Props: `info: CompletionInfo`, `t: Theme`, `onClose: () => void`

### Changes to `CompletionSummary.tsx`
- Add `onShare?: () => void` prop
- Replace the two-button row with a three-button layout:
  - "Try again" (left, flex:1)
  - "Share" (middle, flex:1, with Share2 icon from lucide)
  - "Done" (right, flex:2, accent)

### Changes to `MainApp.tsx`
- Add `showShare` state and `shareInfo` state
- When `onShare` fires from CompletionSummary: set `showShare = true` with current `completionData`
- Render `<ShareModal>` inside `<AnimatePresence>` at z-index 70

---

## 4  Interval Plans — New `PlansScreen.tsx` + data types in `theme.ts`

### Data model (added to `theme.ts`)
```ts
export interface WorkoutDay {
  day: number;          // 1-indexed
  type: "hiit" | "tabata" | "rest";
  settings?: Settings;  // from HiitTab; undefined for rest days
  label?: string;       // e.g. "Upper body", optional nickname
}
export interface Plan {
  id: string;
  name: string;
  days: WorkoutDay[];
}
```

### UI — `PlansScreen.tsx`
- Listed in a new "Plans" nav item (replace History in bottom nav, or add 4th item — see note below)
- **Plan list view**: cards showing plan name + day count + completion ring
- **Plan detail view**: vertical timeline of days (number badge + workout type + label). Rest days shown as grey "Rest" chip. Tap a workout day → opens that mode
- **Create plan**: "+" button opens a simple builder:
  - Name input
  - Day list with Add Day button
  - Each day: type picker (HIIT / Tabata / Rest) + optional label field + effort/rounds inline steppers for HIIT days

### Nav change in `MainApp.tsx`
Bottom nav currently: Home / Workouts / History (3 items).
Add **Plans** as 4th item using `Map` icon from lucide. The bottom nav flex will accommodate 4 items at slightly smaller size (icon 16, font 10px).

`NAV_ITEMS` addition:
```ts
{ id: "plans" as NavScreen, label: "Plans", icon: Map }
```

`navScreen` type updated to `"home" | "workouts" | "history" | "plans"`.

`PlansScreen` rendered in the AnimatePresence block alongside the other screens.

State in MainApp: `plans: Plan[]`, `setPlans`, passed to PlansScreen + HomeScreen (home shows "Today in your plan" if a plan is active).

---

## 5  Sprint Timer — New `SprintTab.tsx` + added to workout grid

### Concept
Sprint intervals are distance-anchored: e.g. "8 × 200m sprint, 90s walk rest". The timer is time-based (no GPS) but shows the distance label so users know what to target.

### Config options
- **Distance**: 50m / 100m / 200m / 400m / 800m (stepper chip selector)
- **Sprint duration**: seconds (the target sprint time for that distance)
- **Rest duration**: seconds (walk recovery)
- **Reps**: count
- **Get ready**: optional countdown

### Phases: `empty → getReady → sprint → walk → done`

### Timer display
- Ring: uses `effortColor` during sprint, `restColor` during walk
- Center: time remaining (same CircleTimer pattern)
- Below ring: current rep + distance label ("Rep 3 / 8 · 200m Sprint")
- Next preview: same pattern as HIIT
- Completion: fires `onSessionComplete` → shows CompletionSummary

### Voice cues via `useVoiceCues` (same hook)
- getReady: "Get ready"
- sprint start: "Sprint" (1046Hz beep)
- walk start: "Walk" (523Hz)
- last rep: "Last sprint"
- done: "Workout complete"

### Big display mode: supported (same prop pattern as HiitTab/TabataTab)

### Workout grid card
Add to `WORKOUT_CARDS` in `HomeScreen.tsx`:
```ts
{ id: "sprint", name: "Sprint", icon: Footprints, desc: "Running intervals", protocol: "Distance-based" }
```
`Footprints` is available in lucide-react. Grid becomes 2×3 (or keep 2×2 and add Sprint as a 5th card in a wider single row below — design decision: **2×2 grid + 1 wide card below** to avoid awkward 3-column grid).

`WorkoutMode` type in MainApp and HomeScreen updated to include `"sprint"`.
`MODE_LABELS` updated.
MainApp renders `<SprintTab>` when `activeMode === "sprint"`.

---

## File Change Summary

| File | Change |
|------|--------|
| `src/app/theme.ts` | Light mode token refresh + `Plan`, `WorkoutDay` types |
| `src/app/components/MainApp.tsx` | Bell→Music, Plans nav item, showShare state, SprintTab, PlansScreen |
| `src/app/components/HomeScreen.tsx` | Sprint card in grid, "Today in plan" strip |
| `src/app/components/CompletionSummary.tsx` | Add Share button + `onShare` prop |
| `src/app/components/ShareModal.tsx` | **New** — Canvas share card + Web Share API |
| `src/app/components/PlansScreen.tsx` | **New** — plan list, detail, create builder |
| `src/app/components/SprintTab.tsx` | **New** — sprint interval timer |

---

## Verification
- **Light mode**: toggle to Light in Settings menu → cards should appear white on grey bg, no grey-on-grey
- **Music icon**: open app → header shows music note, not bell
- **Share**: complete any workout → tap Share in summary → preview image appears → tap Share or Save → file downloads / native share sheet opens
- **Sprint timer**: Home → Sprint card → configure → Start → verify phase transitions (sprint/walk), voice cues, completion summary fires
- **Plans**: tap Plans in bottom nav → create plan with 3 days → save → tap a HIIT day → opens HIIT in that config
