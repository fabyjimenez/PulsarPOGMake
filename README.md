# Pulsar POG

An interval trainer you can read while exhausted.

**Live:** [pulsar-pog.vercel.app](https://pulsar-pog.vercel.app) · **Designed and built by** [Fabiola Jiménez Serrano](https://fabiolasportfolio.com)

---

## The design problem

An interval timer is a state machine you look at mid-workout — heart rate up, attention down. *Get ready, effort, recover, done*: each state has about one second to be understood, sometimes from across the room. Every design decision in Pulsar follows from that constraint.

- **State is never colour alone.** The phase label (EFFORT / RECOVER / GET READY) carries the message; colour reinforces it. Colour-only state is the classic red-green trap, and mid-workout is the worst moment for ambiguity.
- **Numbers are huge, chrome is quiet.** The circle timer and remaining time dominate; everything secondary drops to muted text.
- **Sound is a first-class channel.** Voice cues (Web Speech API) and beeps announce phase changes, so you never have to look down at all.

## What's inside

Five workout modes — **HIIT, Tabata, Sprint, Timer, Stopwatch** — plus onboarding, training plans, workout history with local persistence, a watch-face view, a share card, and full **light/dark theming**.

## Accessibility

Checked, not assumed. Core text pairs measure **17–19:1** contrast in both themes and muted text holds **4.9–7.7:1** — all AA. Beyond contrast:

- `aria-live` regions announce phase and time changes to screen readers — the accessibility twin of the voice cues
- Visible keyboard focus rings tuned per theme (indigo on light, lime on dark)
- `prefers-reduced-motion` collapses the timer animations to simple updates
- Rest-phase colours were re-picked after a contrast audit caught them below 3:1 in both modes — now `#7DD3FC` (dark, 11.9:1) and `#0369A1` (light, 5.9:1)

## How it was built

Designed in **Figma**, made interactive in **Figma Make**, then exported and taken to production in **Cursor** with **Claude / Claude Code** in the loop for refactoring and the accessibility audit. Versioned on **GitHub**, deployed on **Vercel** — every push to `main` ships automatically.

This is a designer's codebase on purpose: the theme lives in one place (`src/app/theme.ts` + `src/styles/theme.css`), components map one-to-one to screens, and the commit history shows the actual process rather than a single "final" drop.

## Stack

React 18 · TypeScript · Vite 6 · Tailwind CSS 4 · shadcn/ui · Motion

## Run it locally

```bash
npm install
npm run dev      # local dev server
npm run build    # production build
npm run preview  # preview the production build
```

## Where things live

```
src/app/
  components/     # one file per screen: HiitTab, TabataTab, SprintTab,
                  # TimerTab, WatchTab, HistoryScreen, PlansScreen, …
  components/ui/  # shadcn primitives
  hooks/          # useVoiceCues — speech + beep cues
  theme.ts        # the design tokens, light and dark
  storage.ts      # local persistence for history and settings
src/styles/       # Tailwind v4 theme, focus/motion/a11y rules
```
