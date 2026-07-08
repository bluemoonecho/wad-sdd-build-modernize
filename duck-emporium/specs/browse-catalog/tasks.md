# Story 1 — Browse the Duck Catalog: Tasks

## 1. Add catalog seed data and types
- Create the local JSON seed file with at least 10 ducks across at least 3 categories.
- Define the Duck record shape used by the catalog layer.
- Dependency: none.
- Acceptance check: the seed file parses and the data set meets the minimum count and category requirements.

## 2. Implement catalog loading and validation
- Add the loader that reads the local JSON catalog file.
- Parse the JSON into typed duck records and validate the required fields.
- Preserve a predictable empty result when the source file has no ducks.
- Dependency: task 1.
- Acceptance check: Vitest coverage for loading, parsing, and empty-catalog behavior passes.

## 3. Implement home page rendering for catalog and empty state
- Render the catalog list on the home page using the loaded duck records.
- Show name, category, price, and one-line tagline for each duck.
- Render an explicit empty-state message when the catalog is empty.
- Dependency: task 2.
- Acceptance check: Vitest coverage for populated and empty home-page rendering passes.

## 4. Wire the home page to the catalog source
- Connect the home page entry point to the catalog loader and renderer.
- Keep the implementation local and file-based, with no external services.
- Dependency: tasks 2 and 3.
- Acceptance check: the end-to-end story flow renders the seeded catalog on the home page and the test suite remains green.
