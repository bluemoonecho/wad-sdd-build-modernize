---
name: lint-and-typecheck
description: Use when the user asks to check code
  quality, lint the codebase, verify types, or ensure code meets project standards.
  Also use after making changes to catch type errors and style violations early.
---

1. Run the TypeScript compiler in check mode first:

   ```bash
   npx tsc --noEmit
   ```

2. If there are type errors:
   - Fix them before moving on to linting
   - Run `npx tsc --noEmit` again to confirm they are resolved

3. Run ESLint:

   ```bash
   npx eslint src/ --ext .ts
   ```

4. If there are lint violations:
   - Fix them manually (do not use `--fix` automatically)
   - Distinguish between errors and warnings
   - Errors must be resolved. Warnings should be resolved unless there is a clear reason to keep them.

5. Never suppress a lint rule with `eslint-disable` comments unless the user explicitly asks for it. If a rule feels wrong for this codebase, flag it to the user instead of silencing it.

6. After all fixes, run both checks one final time to confirm a clean result.
