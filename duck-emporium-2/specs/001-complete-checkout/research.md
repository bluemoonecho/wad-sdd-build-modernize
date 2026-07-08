# Research: Complete Checkout

## Decision 1: Checkout validation scope

- Decision: Validate required shipping/payment fields and shipping email format before any stock or persistence operation.
- Rationale: Early rejection avoids unnecessary stock/persistence work and guarantees only valid submissions reach order creation.
- Alternatives considered:
  - Validate only presence and skip email format checks.
    - Rejected because it permits obviously unusable order contact data.
  - Validate after stock decrement.
    - Rejected because it can consume stock for invalid orders.

## Decision 2: Stock consistency handling

- Decision: Re-validate and decrement stock as an all-or-nothing operation at checkout submission time.
- Rationale: This prevents partial updates when a single line item is unavailable and preserves inventory integrity under concurrent attempts.
- Alternatives considered:
  - Best-effort decrement for available items and reject unavailable ones.
    - Rejected because it creates partial orders and confusing user outcomes.
  - Reserve stock at add-to-cart time.
    - Rejected for current workshop scope; introduces reservation expiry complexity.

## Decision 3: Error semantics for checkout failures

- Decision: Use explicit failure classes/messages for validation errors (400), empty cart (400), and stock conflicts (409).
- Rationale: Distinct categories improve testability and allow clients to present clear user feedback.
- Alternatives considered:
  - Single generic 400/500 error for all failures.
    - Rejected because clients cannot distinguish recoverable user input from stock conflict behavior.

## Decision 4: Order persistence strategy

- Decision: Persist orders in a local JSON store with atomic write (write temp file then rename).
- Rationale: Meets restart durability requirement with minimal workshop complexity while reducing file corruption risk on write interruption.
- Alternatives considered:
  - In-memory orders only.
    - Rejected because it violates restart persistence requirement.
  - Introduce SQLite.
    - Rejected as unnecessary complexity for this workshop scope.

## Decision 5: Order identity and confirmation payload

- Decision: Generate unique order IDs per successful checkout and return order ID, timestamp, item summary, and total.
- Rationale: Satisfies confirmation requirement and supports deterministic verification in tests.
- Alternatives considered:
  - Sequential integer IDs.
    - Rejected to avoid collision/coordination concerns in concurrent flows.
  - Return full persisted order including shipping/payment details.
    - Rejected to avoid exposing unnecessary sensitive payload in confirmation responses.