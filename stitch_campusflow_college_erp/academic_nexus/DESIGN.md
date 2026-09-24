---
name: Academic Nexus
colors:
  surface: '#f8f9ff'
  surface-dim: '#ccdbf3'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d5e3fc'
  on-surface: '#0d1c2e'
  on-surface-variant: '#434655'
  inverse-surface: '#233144'
  inverse-on-surface: '#eaf1ff'
  outline: '#747686'
  outline-variant: '#c4c5d7'
  surface-tint: '#2151da'
  primary: '#0037b0'
  on-primary: '#ffffff'
  primary-container: '#1d4ed8'
  on-primary-container: '#cad3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#006c4a'
  on-secondary: '#ffffff'
  secondary-container: '#82f5c1'
  on-secondary-container: '#00714e'
  tertiary: '#6b3700'
  on-tertiary: '#ffffff'
  tertiary-container: '#8d4b00'
  on-tertiary-container: '#ffcba3'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001551'
  on-primary-fixed-variant: '#0039b5'
  secondary-fixed: '#85f8c4'
  secondary-fixed-dim: '#68dba9'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005137'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#f8f9ff'
  on-background: '#0d1c2e'
  surface-variant: '#d5e3fc'
typography:
  headline-xl:
    fontFamily: Manrope
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  numeric-metric:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes an academic productivity suite designed for students, faculty, and administrators. The aesthetic synthesizes the structured, distraction-free clarity of Notion, the collaborative efficiency of Google Workspace, and the secure, metric-driven precision of modern fintech applications. 

The visual tone is calm, authoritative, and frictionless. It eliminates traditional enterprise bloat (nested dropdowns, dense unpadded tables, muddy gray borders) in favor of airy, glanceable interfaces with clear priority lanes. Every view prioritizes rapid task completion: checking attendance thresholds, managing fee clearances, reviewing course modules, and validating pending submissions. 

The interface communicates institutional reliability without feeling bureaucratic. High legibility, crisp structural dividers, expansive whitespace, and deliberate status accents ensure essential academic information can be parsed at a glance across low-end mobile devices and high-resolution desktop environments alike.

## Colors

The color palette is built on high contrast, clarity, and unambiguous semantic signaling against a clean slate backdrop.

- **Primary (`#1D4ED8`)**: Academic Indigo. Used for focal interactive touchpoints, primary action buttons, active navigation states, key metrics, and institutional brand anchors.
- **Secondary (`#059669`)**: Emerald Green. Signifies positive states: attendance above threshold (>75%), fee clearance, approved leaves, and submitted assignments.
- **Tertiary (`#D97706`)**: Amber Warning. Designates attendance borderline alerts (65%-75%), pending administrative reviews, upcoming payment deadlines, and tentative schedules.
- **Urgent Accent (`#E11D48`)**: Soft Rose. Reserved for critical alerts: attendance shortages (<65%), overdue tuition, exam disqualifications, and immediate administrative notices.
- **Neutral Palette (`#475569`, `#0F172A`, `#F8FAFC`, `#FFFFFF`)**:
  - `bg-canvas`: `#F8FAFC` (Slate 50) establishes a glare-free, warm backdrop.
  - `surface-card`: `#FFFFFF` provides clean separation for modules and summaries.
  - `border-subtle`: `#E2E8F0` (Slate 200) for delicate structural separators.
  - `text-primary`: `#0F172A` (Slate 900) ensures maximum legibility (minimum 12:1 contrast ratio against white).
  - `text-secondary`: `#475569` (Slate 600) for descriptive body text and labels.
  - `text-muted`: `#94A3B8` (Slate 400) for timestamps and placeholder hints.

## Typography

The type system blends **Manrope** for headers and numerical metric callouts with **Inter** for sustained body text, metadata, and controls. 

- **Display & Headings (Manrope)**: Delivers geometric clarity and structural authority. Manrope's open apertures and modern construction prevent administrative headings from feeling dated.
- **Body & Controls (Inter)**: Delivers neutral, utilitarian clarity at small sizes. Inter renders exceptionally well on low-DPI mobile screens, optimizing legibility for student timetables, grade lists, and multi-line institutional circulars.
- **Tabular Numerals**: Apply `font-feature-settings: "tnum" 1` across all grades, roll numbers, percentage cards, and financial figures to ensure clean vertical alignment across tabular data.

## Layout & Spacing

The design system employs a fluid, mobile-first grid anchored by an 8pt spatial cadence (with a 4pt sub-grid for fine internal alignments like badge padding and icon-to-label spacing).

### Grid & Breakpoints
- **Mobile (< 768px)**: 4-column fluid layout with `1rem` (16px) margins and `1rem` gutters. Elements occupy full width or paired half-width metric cards. Bottom navigation anchors core workflows.
- **Tablet (768px – 1024px)**: 8-column layout with `1.5rem` (24px) margins and `1rem` gutters. Persistent mini-rail sidebar for navigation.
- **Desktop (> 1024px)**: 12-column layout with `2rem` (32px) margins and `1.5rem` (24px) gutters. Centered content container capped at `1280px` max-width to prevent scanning fatigue.

### Touch Targets & Density
All interactive targets (buttons, inputs, bottom bar actions, select triggers) must meet or exceed a strict **48px minimum hit target** on mobile screens, regardless of visual icon size.

## Elevation & Depth

This design system avoids dark or skeuomorphic dropshadows, drawing depth instead through **tonal separation** and **calibrated micro-shadows**.

1. **Level 0 (Canvas)**: Slate 50 (`#F8FAFC`). Serves as the structural baseline for the application.
2. **Level 1 (Card & Module Surfaces)**: Pure White (`#FFFFFF`) with a 1px crisp outline (`#E2E8F0`) and an ambient, faint shadow:
   `box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02)`.
3. **Level 2 (Interactive Floating / Active State)**: Lifted cards, sheet dialogs, and segmented pills:
   `box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
4. **Level 3 (Modals, Slide-overs, & Popovers)**:
   `box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)`. Accompanied by a 40% opacity Slate-900 backdrop scrim (`rgba(15, 23, 42, 0.40)` with `backdrop-filter: blur(4px)`).

## Shapes

The design system uses deliberate, rounded geometry to convey warmth and modern usability while retaining structured academic credibility.

- **Standard Radius (`rounded-md`, 0.5rem / 8px)**: Used for internal elements such as input fields, small chips, notification tags, and inner table segments.
- **Card Radius (`rounded-lg` to `rounded-xl`, 1rem to 1.5rem / 16px - 24px)**: Primary module surfaces, summary widgets, and attendance metric panels use soft `rounded-2xl` (1.25rem / 20px - 1.5rem / 24px) corners to match modern mobile OS aesthetics.
- **Pill Radius (`rounded-full`, 9999px)**: Reserved strictly for status badges (e.g., "Present", "Pending Verification"), avatar frames, and floating action button anchors.

## Components

### Buttons
- **Primary**: Solid Academic Indigo (`#1D4ED8`) background, white text, 48px height on mobile (`px-5 py-3`), `rounded-xl` shape, semi-bold Inter type. No heavy shadow; uses a soft hover tint (`#1E40AF`) and active scale down (`scale-[0.98]`).
- **Secondary**: Slate 100 (`#F1F5F9`) background, Slate 800 (`#1E293B`) text, zero border.
- **Outline / Subtle**: Pure white surface, 1px border in Slate 200 (`#E2E8F0`), Slate 700 text.
- **Destructive**: Soft Rose light fill (`#FFE4E6`) with red text (`#BE123C`), escalating to solid `#E11D48` for final confirmations.

### Cards & Stat Blocks (Notion × Fintech Hybrid)
- Background: Pure White (`#FFFFFF`).
- Border: 1px continuous border (`#E2E8F0`).
- Padding: `1.25rem` (20px) on mobile; `1.5rem` (24px) on desktop.
- Header pattern: Icon slot in rounded background tint + uppercase micro-label + primary metric count in bold Manrope.
- Attendance Cards: Highlight percentage with large numeric typography and an associated horizontal progress bar (8px track height, fully rounded, colored conditionally in Emerald, Amber, or Rose).

### Chips & Status Badges
- Built using full pill geometry (`rounded-full`).
- Sizing: `py-1 px-3`, font size 12px, font-weight 600.
- Emerald Status: `#ECFDF5` background with `#047857` text (e.g., "88% • Eligible").
- Amber Status: `#FFFBEB` background with `#B45309` text (e.g., "71% • Warning").
- Rose Status: `#FFF1F2` background with `#BE123C` text (e.g., "58% • Critical Shortage").

### Input Fields & Selects
- Height: 48px standard touch target.
- Background: `#FFFFFF` resting, border 1px `#CBD5E1` (Slate 300).
- Focus state: 2px ring in Indigo (`#1D4ED8`) with 0px offset. No muddy glow.
- Labeling: Always visible top label in `label-md` (`#334155`), with an optional inline right helper or counter.

### Lists & Timetable Rows
- Separated by hairline dividers (`#F1F5F9`) rather than heavy boxed borders.
- Left-anchored 4px indicator strip denoting subject type (Lecture = Blue, Lab = Green, Seminar = Amber).
- Right-anchored time range and room number rendered in high-contrast monospaced or tabular font.

### Bottom Navigation Bar (Mobile)
- Fixed at screen bottom with safe area insets.
- Height: 64px + safe area padding.
- Surface: `#FFFFFF` with top 1px border (`#E2E8F0`).
- 4 to 5 key destination icons with active indicator pill in Indigo tint (`#EFF6FF`).