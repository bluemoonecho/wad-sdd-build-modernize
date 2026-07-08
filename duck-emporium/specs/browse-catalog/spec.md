# Story 1 — Browse the Duck Catalog

## Problem
Visitors need a simple home page that shows what ducks are available before they decide to browse further or buy anything.

## Users
- Quincy Quacker, a customer visiting The Rubber Duck Emporium home page.
- Any first-time or returning visitor who wants a quick view of available ducks.

## Scope
### In scope
- Show all available ducks on the home page.
- Display each duck’s name, category, price, and one-line tagline.
- Load catalog data from a local JSON file.
- Seed the catalog with at least 10 ducks across at least 3 categories.
- Show an explicit empty-state message when the catalog has no ducks.

### Out of scope
- Pagination.
- Images.
- Sorting controls.
- Search and filtering.
- Cart, checkout, and product detail behavior.

## Functional requirements
1. The home page must render a list of ducks sourced from a local JSON file.
2. Each duck entry must include name, category, price, and a one-line tagline.
3. The catalog seed data must contain at least 10 ducks.
4. The seed data must span at least 3 categories.
5. If the catalog is empty, the home page must render an explicit empty-state message instead of a blank page.

## Non-functional requirements
- The implementation should keep the catalog data local to the application.
- The empty state and catalog list should be understandable without relying on images or other media.
- The solution should remain lightweight and suitable for a workshop environment.

## Acceptance criteria
- The home page returns a list of ducks.
- Each duck in the list shows at minimum: name, category, price, and a one-line tagline.
- The catalog is read from local storage as a JSON file.
- The catalog seed contains at least 10 ducks across at least 3 categories.
- An empty catalog renders an explicit empty-state message.

## Open questions
- None.
