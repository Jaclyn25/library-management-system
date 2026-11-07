# Folio visual system

## Scene and theme
Library staff use the workspace at a bright circulation desk while helping readers. Light, warm surfaces keep tables and forms legible throughout a working day.

## Color strategy
Restrained tinted neutrals with plum reserved for actions and selection. Sage indicates available stock; amber indicates overdue attention. Status text always accompanies color.

Tokens are defined in `frontend/src/style.css` using OKLCH:

| Token | Value | Purpose |
| --- | --- | --- |
| `--accent` | `oklch(43% .11 325)` | Primary actions and selected navigation |
| `--accent-soft` | `oklch(94% .025 325)` | Selected surfaces and chart fill |
| `--paper` | `oklch(99.5% .003 70)` | Working surfaces |
| `--line` | `oklch(90.5% .009 70)` | Quiet dividers |
| `--muted` | `oklch(51% .015 290)` | Supporting labels |
| `--sage` | `oklch(65% .07 155)` | Availability chart and status |

## Typography and layout
Segoe UI with system fallbacks gives controls a familiar native appearance. Desktop headings use a fixed rem scale, table data is compact, and counts use tabular numerals. A fixed sidebar becomes a toggle navigation panel on mobile. Tables scroll within their own container rather than widening the document.

## Components
Native buttons, selects and input controls retain familiar behavior. Forms use visible labels and field-level errors. Native dialog elements handle focus trapping and Escape dismissal. Data surfaces use a full quiet border with modest corner radii. Recharts has accompanying textual descriptions of chart values. Loading skeletons, purposeful empty states, request errors and dismissible success messages are shared across routes.

## Motion
Short ease-out state transitions only. Reduced-motion preferences disable animation and transitions. No entrance choreography or decorative movement.
