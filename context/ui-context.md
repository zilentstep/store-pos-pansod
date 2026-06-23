# UI Context

## Theme

Light mode POS interface designed for tablet/desktop use. Clean, high-contrast layout optimized for quick order taking. Dark navy navigation bar, white card-based content, red accent for interactive elements.

## Colors

| Role            | CSS Variable       | Value      |
| --------------- | ------------------ | ---------- |
| Page background | `--bg-base`        | `#f0f2f5`  |
| Nav background  | `--bg-nav`         | `#1a1a2e`  |
| Surface         | `--bg-surface`     | `#ffffff`  |
| Primary text    | `--text-primary`   | `#1a1a1a`  |
| Muted text      | `--text-muted`     | `#888888`  |
| Primary accent  | `--accent-primary` | `#e94560`  |
| Border          | `--border-default` | `#dddddd`  |
| Border light    | `--border-light`   | `#eeeeee`  |
| Error           | `--state-error`    | `#c62828`  |
| Success         | `--state-success`  | `#2e7d32`  |

## Typography

| Role      | Font                        | Variable     |
| --------- | --------------------------- | ------------ |
| UI text   | system-ui, -apple-system, sans-serif | `--font-sans` |

## Border Radius

| Context           | Radius  |
| ----------------- | ------- |
| Inline / small UI | 4px     |
| Cards / panels    | 8px     |
| Modals / overlays | 12px    |

## Component Library

No external UI library. All components are hand-built HTML/CSS/JS. Patterns to follow:

- **Menu cards**: White card, border on hover, cat label + name + price
- **Cart items**: Horizontal flex with name, +/- controls, line total
- **Modals**: Fixed overlay with centered card, backdrop blur, two-option layout
- **Summary cards**: Stat boxes with uppercase label and large value
- **Report rows**: Horizontal flex with rank, name, quantity, bar, revenue

## Layout Patterns

- **Order taking**: Two-column grid — left menu panel, right sticky cart panel (320px)
- **Menu grid**: `repeat(auto-fill, minmax(155px, 1fr))` responsive grid
- **Sales list**: Vertical stack of order rows with inline badges and actions
- **Report two-col**: Side-by-side grid for top products and category breakdown
- **Daily summary**: Grid of stat cards, `repeat(auto-fill, minmax(170px, 1fr))`

## Icons

Unicode emoji for all icons (e.g., 🍽️ for Dine In, 🛍️ for Take Away, 💵 for Cash, 📱 for QR, 🏆 for best seller, ⏰ for peak hour, 💰 for AOV, 🛵 for Grab). No icon library needed.
