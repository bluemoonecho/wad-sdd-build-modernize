# Story 1 — Browse the Duck Catalog: Technical Plan

## Goal
Implement a home-page catalog that reads ducks from a local JSON data file, renders the catalog entries with the required fields, and shows a clear empty state when no ducks are available.

## Data model
Use a simple typed catalog record for each duck:

- `id`: stable string identifier
- `name`: display name
- `category`: category label
- `price`: numeric price in the app’s canonical currency format
- `tagline`: one-line marketing description

The JSON seed file should contain at least 10 duck records across at least 3 categories. The app should treat the JSON file as the source of truth for the catalog.

## Module and file layout
Proposed files:

- `src/catalog/catalog-data.json` - seed data for the duck catalog
- `src/catalog/catalog.ts` - catalog types and loader logic
- `src/catalog/catalog.test.ts` - loader and empty-catalog tests
- `src/home/home-page.ts` - home page rendering logic for the catalog and empty state
- `src/home/home-page.test.ts` - rendering tests for the populated and empty states

If the app already has a different top-level structure, keep the same responsibilities but place the files in the existing conventions.

## Public interfaces
Define a small catalog API that can be reused by the home page:

- `loadCatalog(): Duck[]` - reads and parses the JSON seed file
- `renderCatalogHomePage(ducks: Duck[]): string` - returns the home page markup or text representation for the catalog view
- `renderEmptyCatalogState(): string` - returns the explicit empty-state content

The home page should call the catalog loader, branch on whether the result is empty, and render either the list view or the empty state.

## External dependencies
No new runtime dependencies are required for this story. Use the existing TypeScript and Vitest setup. Keep the catalog data local and file-based, with no remote calls or database driver needed.

## Testing strategy
Cover the behavior with focused Vitest tests:

- load and parse the catalog JSON seed
- verify the seed contains at least 10 ducks
- verify at least 3 distinct categories are present in the seed
- verify each rendered duck includes name, category, price, and tagline
- verify the empty state is rendered when no ducks are returned

Prefer tests that exercise the catalog loader and home-page renderer directly so they remain stable and easy to run in the workshop environment.

## Risks
- The repository currently has no app scaffold, so the implementation may need a lightweight home-page rendering entry point before the catalog can be wired into a real UI.
- JSON parsing and data-shape drift could cause runtime failures if the loader does not validate the expected fields.
- Formatting prices consistently may require a small helper so the displayed output stays predictable in tests.
