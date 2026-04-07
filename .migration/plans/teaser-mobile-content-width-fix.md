# Teaser Mobile Content Width Fix

## Problem
Seven horizontal variants have `.teaser-content { flex: 1 }` for their row layout. When mobile switches to `flex-direction: column`, the content doesn't stretch to full width because `flex: 1` only controls the main axis (now vertical), not the cross axis (now horizontal).

## Affected Variants
- `floating-image-left`
- `floating-image-right`
- `hero-image-left`
- `hero-image-right`
- `full-bleed-image-left`
- `full-bleed-image-right`
- `padded-image-right`

## Fix
Add `width: 100%` to `.teaser-content` for all affected variants in the mobile media query.

## Excluded
- `text-overlay` — already correct on mobile, do not modify

## Checklist
- [ ] Add mobile override setting `.teaser-content` to `width: 100%` for all seven affected variants
- [ ] Verify rendering on mobile
- [ ] Run linting

> **Note**: Switch to Execute mode to implement this fix.
