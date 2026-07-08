---
name: run-tests
description: Use when the user asks to run tests, verify
  changes, check if code works, or validate that nothing is broken. Also use after
  making code changes that could affect existing functionality.
---

1. Run the full test suite using the terminal:

   ```bash
   npm test
   ```

2. Read the test output carefully. Pay attention to:
   - Number of tests passed vs failed
   - Specific assertion errors and their messages
   - Which test file and test case failed

3. If all tests pass, confirm the result and summarize what was validated.

4. If any tests fail:
   - Identify the root cause from the error message
   - Fix the code (not the test) unless the test itself is clearly wrong
   - Run `npm test` again to verify the fix
   - Repeat until all tests pass

5. Never skip a failing test. Never mark a test as `.skip` or `.todo` to make the suite pass.
