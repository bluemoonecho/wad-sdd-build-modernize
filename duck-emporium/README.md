# Duck Emporium API

## Run the API

Set the shared admin password and start the server:

ADMIN_PASSWORD=quack-secret npm run start:api

The server listens on http://localhost:3000 by default.

## Story 6 admin endpoint

Create a duck with the authenticated admin endpoint:

curl -i -X POST http://localhost:3000/admin/ducks \
  -H "Content-Type: application/json" \
  -H "x-admin-password: $ADMIN_PASSWORD" \
  -d '{
    "name": "Zen Glacier Duck",
    "category": "Wellness",
    "price": 13.25,
    "tagline": "Cool-headed serenity.",
    "description": "Radiates calm like a floating glacier temple.",
    "personalityTraits": ["calm", "patient"],
    "initialStock": 4
  }'

List ducks and confirm the new duck appears:

curl -s http://localhost:3000/ducks

## Story 7 duck of the day endpoint

Fetch the daily featured duck:

curl -s http://localhost:3000/duck-of-the-day

Response includes a deterministic duck for the calendar day, a detail link path, or a friendly fallback when all ducks are sold out.

## Story 8 personality quiz endpoints

Fetch quiz questions:

curl -s http://localhost:3000/quiz/questions

Submit answers and receive a deterministic recommendation:

curl -s -X POST http://localhost:3000/quiz/result \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [
      {"questionId": "q1", "optionId": "q1a"},
      {"questionId": "q2", "optionId": "q2a"},
      {"questionId": "q3", "optionId": "q3a"},
      {"questionId": "q4", "optionId": "q4a"},
      {"questionId": "q5", "optionId": "q5a"},
      {"questionId": "q6", "optionId": "q6a"}
    ]
  }'
