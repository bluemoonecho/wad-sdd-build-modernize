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
