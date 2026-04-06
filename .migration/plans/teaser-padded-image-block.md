# Teaser Block — Padded Image Variant

## Context
- **Figma URL**: `https://www.figma.com/design/bRVrW08G2QHwRAz3TUMkgH/BNY-AEM-POC-Pages-V1?node-id=2731-853&m=dev`
- **Style**: Padded Image (Figma layer: `Style=Default`)
- **Block name**: `teaser` (variant: `padded-image`)
- **Design system**: Already migrated — navy/teal/red palette, Oswald headings, Roboto body

## Design Analysis (from Figma)

The Padded Image teaser is a **card-style component** with:

| Property | Value | Token |
|----------|-------|-------|
| **Container** | White bg, 12px border-radius, 24px gap between children, 40px padding | `--color-white`, `--radius-075`, `--sizing-150-24px`, `--sizing-250-40px` |
| **Shadow** | `0 12px 24px -8px rgba(4,36,60,0.24), 0 4px 8px -4px rgba(4,36,60,0.16)` | Navy-derived shadow |
| **Image** | Full-width within padded container, overflow hidden | — |
| **Caption** | 14px Roboto regular, gray-600 (#666) | `--type-caption`, `--fg-neutral-tertiary` |
| **Pretitle** | 16px Roboto bold, navy-700 (#021624) | `--type-body-sm-base`, `--fg-neutral-primary` |
| **Heading** | 36px Oswald bold, navy-700, uppercase, -2px tracking | `--type-heading-6`, `--type-heading` |
| **Description** | 24px Roboto regular, navy-700 | `--type-body-lg`, `--fg-neutral-primary` |
| **Primary button** | Navy-500 bg, white text, rounded-pill, 24px padding, 12px v-padding | Global `.button.primary` styles |
| **Secondary button** | Navy-500 border, transparent bg, navy-500 text, rounded-pill | Global `.button.secondary` styles |

### Content Structure (EDS Authoring Model)
```
| Teaser (padded-image) |
|---|
| [image]<br>Image caption. |
| Pretitle |
| **Heading** |
| Description |
| **[Primary CTA](#)** *[Secondary CTA](#)* |
```

Single-column block with 5 rows:
1. **Row 1**: Image + optional caption
2. **Row 2**: Pretitle text (bold label)
3. **Row 3**: Heading (h3/h6-level, uppercase Oswald)
4. **Row 4**: Description paragraph
5. **Row 5**: Buttons (primary + secondary via EDS button conventions)

## Implementation Plan

### Step 1 — Create block JS (`blocks/teaser/teaser.js`)
- Export default `decorate(block)` function
- Extract rows: image, pretitle, heading, description, buttons
- Wrap in semantic elements (`.teaser-image`, `.teaser-content`)
- Add caption support beneath the image
- Handle `padded-image` variant class (applied via block table name)

### Step 2 — Create block CSS (`blocks/teaser/teaser.css`)
- Card container: white bg, rounded corners, box-shadow, padding
- Image area: full-width, overflow hidden
- Caption: small gray text beneath image
- Pretitle: bold label text
- Heading: Oswald uppercase with tight tracking
- Description: body-lg size
- Buttons row: flex with gap
- Responsive adjustments for mobile/tablet/desktop

### Step 3 — Create test content HTML
- Static HTML file in `content/` for preview at `localhost:3000`
- Block table with sample content matching the Figma design

### Step 4 — Preview & verify
- Start dev server, navigate to test page
- Compare rendering against Figma screenshot
- Verify responsive behavior at mobile/tablet/desktop widths

### Step 5 — Lint
- Run `npm run lint` to ensure code passes ESLint + Stylelint

## Checklist
- [ ] Analyze Figma design context and map to design tokens
- [ ] Define EDS content model (row/column structure)
- [ ] Create `blocks/teaser/teaser.js` — DOM decoration logic
- [ ] Create `blocks/teaser/teaser.css` — all styles using project tokens
- [ ] Handle `padded-image` variant styling (card shadow, rounded corners, padded image)
- [ ] Create test HTML content for local preview
- [ ] Verify rendering in preview against Figma screenshot
- [ ] Ensure responsive behavior (mobile / tablet / desktop)
- [ ] Run linting (`npm run lint`)

> **Note**: Switch to Execute mode to begin implementation.
