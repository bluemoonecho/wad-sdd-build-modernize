# Data Model: Complete Checkout

## Entity: CheckoutSubmission

- Purpose: Captures customer-provided checkout input.
- Fields:
  - `shippingName` (string, required, trimmed, non-empty)
  - `shippingEmail` (string, required, trimmed, valid email format)
  - `shippingAddress` (string, required, trimmed, non-empty)
  - `mockedCardDetails` (string, required, trimmed, non-empty)
- Validation rules:
  - All fields are required.
  - Email must match basic email format.

## Entity: Cart

- Purpose: Session-scoped collection of intended purchases.
- Fields:
  - `items` (array of CartLineItem)
  - `runningTotal` (number, derived from line totals)
- Validation rules:
  - Cart must contain at least one item at checkout submission.

## Entity: CartLineItem

- Purpose: Represents one selected duck and quantity in cart.
- Fields:
  - `duckId` (string, required)
  - `name` (string, required)
  - `unitPrice` (number, required, >= 0)
  - `quantity` (integer, required, > 0)
  - `lineTotal` (number, derived: `unitPrice * quantity`)

## Entity: StockEntry

- Purpose: Tracks inventory for a duck at checkout time.
- Fields:
  - `duckId` (string, unique identifier)
  - `availableQuantity` (integer, >= 0)
- Rules:
  - Every checkout line item must be re-validated against current stock.
  - Decrement must be all-or-nothing across all line items.

## Entity: Order

- Purpose: Durable record of successful checkout.
- Fields:
  - `orderId` (string, unique)
  - `shippingName` (string)
  - `shippingEmail` (string)
  - `shippingAddress` (string)
  - `mockedCardDetails` (string)
  - `items` (array of OrderLineItem)
  - `total` (number, required, >= 0)
  - `timestamp` (string, ISO-8601 datetime)
- Persistence rules:
  - Stored durably and retrievable after server restart.

## Entity: OrderLineItem

- Purpose: Snapshot of purchased line item at order creation time.
- Fields:
  - `duckId` (string)
  - `name` (string)
  - `unitPrice` (number)
  - `quantity` (integer)
  - `lineTotal` (number)

## Relationships

- Cart `1 -> many` CartLineItem.
- Order `1 -> many` OrderLineItem.
- CartLineItem references StockEntry by `duckId` for checkout-time stock validation.
- Successful CheckoutSubmission transforms one Cart into one Order.

## State Transitions

1. `CartReady` -> `CheckoutValidated`
   - Trigger: submission with valid required fields.
2. `CheckoutValidated` -> `CheckoutRejected`
   - Trigger: empty cart or stock conflict.
3. `CheckoutValidated` -> `OrderPersisted`
   - Trigger: stock decrement succeeds and order is written durably.
4. `OrderPersisted` -> `CartCleared`
   - Trigger: cart clear after order persistence.
5. `OrderPersisted` -> `ConfirmationReturned`
   - Trigger: response includes order ID and summary.