---
name: Pangenget
description: To-do list cepat, minimalis, dan andal dengan Astro SSR dan Neon DB
colors:
  primary: "#059669"
  primary-bright: "#10b981"
  secondary: "#d97706"
  tertiary: "#e11d48"
  sky-accent: "#0284c7"
  neutral-bg: "#fafafa"
  neutral-dark: "#09090b"
  neutral-surface: "#ffffff"
  neutral-dark-surface: "#121215"
  neutral-border: "#e5e5e5"
  neutral-dark-border: "#262626"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "3rem"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.02em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-bright}"
---

# Design System: Pangenget

## Overview

**Creative North Star: "The Precision Pocket Organiser"**

Pangenget is engineered around immediate responsiveness, cognitive clarity, and physical feedback. There is no decorative fluff, no bloated sidebar trees, and no artificial loading delays. Every element prioritizes task legibility, instant status recognition, and keyboard fluidity.

The aesthetic blends clean Scandinavian minimalism with modern utilitarian tactile feedback. Contrast is crisp and purposeful: Emerald signifies completion and forward progress, Amber commands attention for urgent priorities and starred tasks, and neutral surfaces provide calm whitespace.

**Key Characteristics:**
- **Zero Latency Feel:** Optimistic UI state updates ensure actions happen before network responses return.
- **Physical Feedback:** Micro-animations (scale 0.97 on active, spring ease-out) and synthetic Web Audio chimes give tactile weight to digital actions.
- **Dense Scannability:** Task priorities, categories, and due dates use compact badges that read effortlessly in a single sweep of the eye.

## Colors

The palette uses a crisp, high-contrast tri-color system anchored in soothing neutrals.

### Primary
- **Emerald Core** (#059669 / #10b981): Action commitments, save buttons, completion checkmarks, and brand emblems. Conveys resolution and productivity.

### Secondary
- **Amber Focus** (#d97706 / #f59e0b): Pinned/starred tasks, high-priority indicators, and warning callouts.

### Tertiary
- **Rose Urgent** (#e11d48 / #f43f5e): Urgent priority indicators, overdue badges, and destructive actions.

### Neutral
- **Zinc Dark Surface** (#09090b / #121215): Background and card containers in dark mode with seamless contrast against bright accents.
- **Clean Light Surface** (#fafafa / #ffffff): Crisp daylight canvas with soft borders and zero glare.

### Named Rules
**The Rarity Rule.** Bold primary color is reserved strictly for actions and success states; cards and content containers remain neutral so the user's focus stays entirely on their tasks.

## Typography

**Display Font:** System UI Sans (-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto)
**Body Font:** System UI Sans
**Label/Mono Font:** Monospace (for keyboard shortcut badges)

**Character:** Clean, objective, and neutral. Heading sizes tighten tracking to `-0.02em` for editorial confidence, while body text stays at standard tracking for readability.

### Hierarchy
- **Display** (900, 3rem, 1.1): Hero brand title "Pangenget".
- **Headline** (700, 1.5rem, 1.25): Modal titles and main section dividers.
- **Title** (600, 1rem, 1.4): Task titles and filter section headers.
- **Body** (400, 0.875rem, 1.5): Task descriptions and subtext notes.
- **Label** (600, 0.75rem, 1.3): Badge tags, keyboard shortcuts, and metadata pills.

## Layout

- Max container width: 896px (`max-w-4xl`) centered with responsive padding (`px-4 py-8 sm:py-10`).
- Spacing rhythm: 12px / 16px / 24px vertical intervals.
- Mobile responsiveness: Single-column stack with horizontal scrolling filters that avoid awkward wraps.

## Elevation & Depth

Surfaces rely on tonal layering and crisp hairline borders rather than heavy blur or muddy drop shadows.

### Shadow Vocabulary
- **Subtle Surface** (`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)`): Standard card rests.
- **Floating Accent** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1)`): Floating Undo toast and keyboard shortcut modals.

### Named Rules
**The Tonal Boundary Rule.** Separation between elements is achieved primarily via subtle 1px border contrast (neutral-200 in light mode / neutral-800 in dark mode) and subtle background shifts, ensuring razor-sharp rendering on OLED and high-DPI displays.

## Shapes

- Corner radii follow a nested curve hierarchy: outer containers use 16px (`rounded-2xl`), cards and inputs use 12px (`rounded-xl`), and buttons/badges use 8px (`rounded-lg`).
- Interactive elements scale to `0.97` on press (`:active`) with `cubic-bezier(0.23, 1, 0.32, 1)` easing.

## Components

### Buttons
- **Shape:** Rounded 8px to 12px.
- **Primary:** Emerald background with crisp white text and active scale press feedback.
- **Ghost / Icon:** Neutral text transitioning to neutral-100 / neutral-800 hover highlight.

### Inputs / Fields
- **Style:** 12px radius, transparent or soft neutral tint with 1px border.
- **Focus:** 2px emerald ring (`focus:ring-2 focus:ring-emerald-500/70`) with zero layout shift.

### Task Cards
- **Normal State:** Neutral card with 1px border, hover border highlight.
- **Starred State:** Soft warm amber tint (`bg-amber-50/30 dark:bg-amber-950/10`) with amber border.
- **Completed State:** 80% opacity with smooth strikethrough text transition.

## Do's and Don'ts

### Do:
- **Do** provide instant optimistic UI updates on every user interaction (complete, pin, delete).
- **Do** include keyboard shortcuts (`N`, `/`, `1-4`, `Esc`, `?`) for rapid desktop usage.
- **Do** use semantic priority badges with consistent color coding (Urgent = Rose, Tinggi = Amber, Sedang = Sky, Rendah = Neutral).
- **Do** keep text contrast at ≥4.5:1 in both light and dark themes.

### Don't:
- **Don't** use slow multi-second animations for routine task toggling.
- **Don't** bury primary task actions in hidden multi-level menus.
- **Don't** show intrusive confirmation dialogs for standard deletions; provide a non-blocking Undo toast instead.
