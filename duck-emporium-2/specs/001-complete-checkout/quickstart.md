# Quickstart Validation: Complete Checkout

This guide validates checkout behavior end-to-end against the feature spec.

## Prerequisites

- Node.js 20+
- npm
- API service source available (for this workshop, typically in `duck-emporium/`)

## Setup

1. Install dependencies:

```bash
cd ../duck-emporium
npm install
```

2. Start API server:

```bash
npm run start:api
```

3. In a second terminal, keep this base URL ready:

```bash
export BASE_URL=http://localhost:4444
```

## Validation Scenarios

### Scenario 1: Successful checkout clears cart and returns confirmation

1. Add an item to cart:

```bash
curl -s -X POST "$BASE_URL/cart/items" \
  -H 'content-type: application/json' \
  -d '{"duckId":"classic-yellow","quantity":1}'
```

2. Submit checkout:

```bash
curl -s -X POST "$BASE_URL/checkout" \
  -H 'content-type: application/json' \
  -d '{
    "shippingName":"Quincy Quacker",
    "shippingEmail":"quincy@example.com",
    "shippingAddress":"42 Pond Lane",
    "mockedCardDetails":"visa test 4242"
  }'
```

Expected:
- HTTP 200
- Response contains `orderId`, `timestamp`, and `summary.total`

3. Verify cart is empty:

```bash
curl -s "$BASE_URL/cart"
```

Expected:
- `items` is an empty array

### Scenario 2: Reject invalid email

```bash
curl -s -X POST "$BASE_URL/checkout" \
  -H 'content-type: application/json' \
  -d '{
    "shippingName":"Quincy Quacker",
    "shippingEmail":"not-an-email",
    "shippingAddress":"42 Pond Lane",
    "mockedCardDetails":"visa test 4242"
  }'
```

Expected:
- HTTP 400
- Error message indicates valid shipping email is required

### Scenario 3: Reject empty cart checkout

```bash
curl -s -X POST "$BASE_URL/checkout" \
  -H 'content-type: application/json' \
  -d '{
    "shippingName":"Quincy Quacker",
    "shippingEmail":"quincy@example.com",
    "shippingAddress":"42 Pond Lane",
    "mockedCardDetails":"visa test 4242"
  }'
```

Expected:
- HTTP 400
- Error message indicates empty cart cannot be checked out

### Scenario 4: Reject checkout with stock conflict

1. Prepare cart with an item that has limited stock.
2. Reduce that item stock in another flow so requested quantity is no longer available.
3. Submit checkout request.

Expected:
- HTTP 409
- Error message identifies stock conflict
- Cart remains unchanged

## Automated Tests

Run the feature tests:

```bash
cd ../duck-emporium
npm test
```

Expected:
- Checkout tests pass for success, validation, empty-cart, and stock-conflict behavior.

## Contract and Model References

- API contract: [contracts/checkout-api.yaml](./contracts/checkout-api.yaml)
- Data model: [data-model.md](./data-model.md)