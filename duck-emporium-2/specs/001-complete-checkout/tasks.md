# Tasks: Complete Checkout

**Input**: Design documents from `/specs/001-complete-checkout/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Include test tasks because workshop constraints require acceptance criteria coverage with automated tests.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm project baseline and feature artifact alignment before feature changes.

- [x] T001 Verify checkout feature artifacts (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/checkout-api.yaml`, `quickstart.md`) in specs/001-complete-checkout/
- [x] T002 Verify Node/TypeScript test tooling and scripts in duck-emporium/package.json and duck-emporium/tsconfig.json
- [x] T003 [P] Ensure order persistence fixture exists and is valid JSON array in duck-emporium/src/orders/orders-data.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build shared checkout reliability foundations required by all user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 Add/align shared checkout error mapping helpers for HTTP responses in duck-emporium/src/server/server.ts
- [x] T005 [P] Add deterministic checkout test helpers and fixture reset utilities in duck-emporium/src/checkout/checkout.test.ts
- [x] T006 [P] Add atomic persistence failure simulation coverage hooks in duck-emporium/src/orders/order-store.ts

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Submit Checkout Order (Priority: P1) 🎯 MVP

**Goal**: Allow customers to submit valid checkout details and receive order confirmation while clearing cart only after durable order creation.

**Independent Test**: Submit valid cart + checkout payload via `/checkout` and verify HTTP 200 confirmation payload, persisted order record, and empty cart.

### Tests for User Story 1

- [x] T007 [P] [US1] Add checkout contract response test for HTTP 200 confirmation payload in duck-emporium/src/server/server.test.ts
- [x] T008 [P] [US1] Add checkout service test for successful submit creating order and clearing cart in duck-emporium/src/checkout/checkout.test.ts
- [x] T009 [P] [US1] Add order persistence durability test across read/write cycle in duck-emporium/src/orders/order-store.ts

### Implementation for User Story 1

- [x] T010 [US1] Implement/align successful checkout orchestration (validate -> decrement stock -> append order -> clear cart) in duck-emporium/src/checkout/checkout.ts
- [x] T011 [US1] Implement/align `/checkout` HTTP success response shape in duck-emporium/src/server/server.ts
- [x] T012 [US1] Ensure persisted order fields (orderId, items, total, timestamp, shipping details) match spec in duck-emporium/src/orders/order-store.ts

**Checkpoint**: User Story 1 should be independently functional and testable.

---

## Phase 4: User Story 2 - Prevent Invalid Checkout Submission (Priority: P1)

**Goal**: Reject checkout when required fields are missing or email format is invalid, without creating orders.

**Independent Test**: Submit malformed checkout payloads and verify HTTP 400 with explicit validation messages and no order creation.

### Tests for User Story 2

- [x] T013 [P] [US2] Add validation test for missing shipping fields in duck-emporium/src/checkout/checkout.test.ts
- [x] T014 [P] [US2] Add validation test for invalid shipping email format in duck-emporium/src/checkout/checkout.test.ts
- [x] T015 [P] [US2] Add API test asserting HTTP 400 error payload for invalid checkout body in duck-emporium/src/server/server.test.ts

### Implementation for User Story 2

- [x] T016 [US2] Implement/align checkout request validation rules and error messages in duck-emporium/src/checkout/checkout.ts
- [x] T017 [US2] Implement/align HTTP 400 mapping for checkout validation failures in duck-emporium/src/server/server.ts
- [x] T018 [US2] Ensure failed validation path leaves cart and orders unchanged in duck-emporium/src/checkout/checkout.ts

**Checkpoint**: User Story 2 should be independently functional and testable.

---

## Phase 5: User Story 3 - Handle Stock Changes During Checkout (Priority: P1)

**Goal**: Reject checkout on stock conflicts and prevent partial stock/order updates.

**Independent Test**: Create cart state where one line item is no longer available, submit checkout, and verify HTTP 409, no order persisted, no partial stock decrement, cart unchanged.

### Tests for User Story 3

- [x] T019 [P] [US3] Add checkout stock conflict unit test for unavailable line item in duck-emporium/src/checkout/checkout.test.ts
- [x] T020 [P] [US3] Add API stock conflict test asserting HTTP 409 error payload in duck-emporium/src/server/server.test.ts
- [x] T021 [P] [US3] Add regression test ensuring no partial side effects on conflict in duck-emporium/src/checkout/checkout.test.ts

### Implementation for User Story 3

- [x] T022 [US3] Implement/align stock re-validation and all-or-nothing decrement behavior in duck-emporium/src/checkout/checkout.ts
- [x] T023 [US3] Implement/align stock conflict to `CheckoutStockError` mapping in duck-emporium/src/checkout/checkout.ts
- [x] T024 [US3] Implement/align HTTP 409 mapping for checkout stock conflicts in duck-emporium/src/server/server.ts

**Checkpoint**: User Story 3 should be independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finalize consistency, observability, and end-to-end validation.

- [x] T025 [P] Align quickstart scenario commands/results with implemented behavior in specs/001-complete-checkout/quickstart.md
- [x] T026 [P] Verify API contract examples remain aligned with implementation responses in specs/001-complete-checkout/contracts/checkout-api.yaml
- [x] T027 Run full automated test suite and capture checkout-related pass results via duck-emporium/package.json script `test`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all story phases.
- **User Story Phases (3-5)**: Depend on Foundational completion.
- **Polish (Phase 6)**: Depends on completion of all selected user stories.

### User Story Dependencies

- **US1 (P1)**: Can start immediately after Foundational.
- **US2 (P1)**: Depends on Foundational; can run in parallel with US1.
- **US3 (P1)**: Depends on Foundational; can run in parallel with US1/US2, but reuses checkout paths so merge sequencing should be managed.

### Within Each User Story

- Write tests first and confirm failure before implementation.
- Implement service/domain behavior before HTTP route wiring where possible.
- Complete story checkpoint before declaring story done.

### Parallel Opportunities

- Setup: T003 parallelizable with T001-T002 once feature path confirmed.
- Foundational: T005 and T006 can run in parallel after T004 context is understood.
- US1: T007-T009 can run in parallel.
- US2: T013-T015 can run in parallel.
- US3: T019-T021 can run in parallel.
- Polish: T025 and T026 can run in parallel before T027.

---

## Parallel Example: User Story 1

```bash
# Parallel test authoring for US1
Task: "Add checkout contract response test for HTTP 200 confirmation payload in duck-emporium/src/server/server.test.ts"
Task: "Add checkout service test for successful submit creating order and clearing cart in duck-emporium/src/checkout/checkout.test.ts"
Task: "Add order persistence durability test across read/write cycle in duck-emporium/src/orders/order-store.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete US1 tasks (T007-T012).
3. Validate independent test criteria for US1.
4. Demo/deploy MVP checkout success path.

### Incremental Delivery

1. Deliver US1 (successful checkout).
2. Deliver US2 (validation-hardening).
3. Deliver US3 (stock-conflict resilience).
4. Execute Polish phase and full regression.

### Parallel Team Strategy

1. Team completes Setup + Foundational.
2. Split by story tracks:
   - Track A: US1
   - Track B: US2
   - Track C: US3
3. Reconcile shared file edits (`src/checkout/checkout.ts`, `src/server/server.ts`) through short-lived branches and frequent rebases.

---

## Notes

- [P] tasks denote work that can be executed concurrently without direct task dependency conflicts.
- Each story remains independently testable by the checkpoint criteria above.
- Keep commits small and scoped to one task or one tightly related task group.