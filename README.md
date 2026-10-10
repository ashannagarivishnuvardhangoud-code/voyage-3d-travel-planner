# VOYAGE 3D — Explore More, Plan Smarter

A full-stack travel planning workspace built with React, Vite, Tailwind CSS, Express, MongoDB, and Mongoose. Travelers can discover destinations, manage trips and day plans, track expenses, map stops, pack for each trip, keep a journal, save a wishlist, and share a read-only itinerary.

## Run locally

Requirements: Node.js 20 or newer and MongoDB 6 or newer (local or hosted).

1. Copy `.env.example` to `.env` and set a MongoDB connection string and a long, private JWT secret.
2. Install dependencies and seed the public destination catalog:

   ```sh
   npm install
   npm run seed
   ```

3. Start the Vite client and Express API together:

   ```sh
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173). Register an account to save data to MongoDB. The API runs at `http://localhost:4000` and Vite proxies `/api` requests to it.

To build the production client, run `npm run build`. Set `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, and `PORT` before `npm start`; Express then serves the built client and API from one origin.

## Deploy to Render

The included `render.yaml` defines one free Node web service that builds the Vite client and serves it with the Express API. Connect a Git repository containing this project to Render and create a Blueprint from `render.yaml`. Render generates `JWT_SECRET` and prompts for `MONGODB_URI`; provide a MongoDB Atlas connection string to enable persistent accounts and records. Without it, the site still opens in clearly labeled local demo mode, while private API operations return HTTP 503. The production service is same-origin, so it does not need `CLIENT_ORIGIN`; set that variable only when hosting the client on a separate origin. See the [Render Blueprint guide](https://render.com/docs/blueprint-spec) for the current creation flow.

## Demo mode

Choose **Explore the demo workspace** on the sign-in or registration screen to try the app without configuring MongoDB. The seeded sample trips, activities, expenses, checklist, and journal are saved in this browser's local storage and marked **DEMO DATA** in the app. Demo data is not sent to the server or treated as a real account. Reset it by clearing the `voyage3d-demo-records`, `voyage3d-token`, and `voyage3d-user` local-storage keys for this site.

Without `MONGODB_URI`, the API still starts and `/api/health` reports `database: "disconnected"`. Persistent authentication and private API records return HTTP 503. Public destination browsing uses clearly labeled sample catalog data, and the local demo remains available.

## Configuration

| Variable | Purpose |
| --- | --- |
| `PORT` | Express port (default `4000`) |
| `MONGODB_URI` | MongoDB connection string for persistent accounts and trips |
| `JWT_SECRET` | Private signing secret for seven-day bearer tokens; use a strong random value |
| `CLIENT_ORIGIN` | Comma-separated allowed browser origins (default `http://localhost:5173`) |
| `NODE_ENV` | Set to `production` to serve `dist/` from Express |

Never commit `.env` or put `JWT_SECRET` in the client bundle.

## Admin access

New accounts receive the `traveler` role. After registering an administrator account, promote it directly in MongoDB:

```javascript
use voyage3d
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })
```

The protected Admin Studio shows aggregate record counts and a limited list of account fields. Administrators can create, edit, and remove public destination catalog entries. Password hashes and private user travel records are never included in the account listing.

## API overview

All successful responses are JSON. Validation errors use HTTP 400, missing/invalid auth uses 401, ownership or role failures use 403/404, and duplicate records use 409. Errors return an `{ "error": "…" }` message. Private endpoints require `Authorization: Bearer <token>`.

| Method and route | Access | Purpose |
| --- | --- | --- |
| `GET /api/health` | Public | API and database readiness |
| `POST /api/auth/register` | Public, rate limited | Create traveler account |
| `POST /api/auth/login` | Public, rate limited | Sign in and receive a JWT |
| `GET /api/auth/me`, `PUT /api/auth/me` | User | Read or update own profile |
| `GET /api/destinations` | Public | Search, category filter, sort, and paginate catalog |
| `GET /api/destinations/:id` | Public | Destination details |
| `POST /api/destinations` | Admin | Add destination |
| `PUT /api/destinations/:id`, `DELETE /api/destinations/:id` | Admin | Update or remove destination |
| `GET /api/trips`, `POST /api/trips` | User | List or create own trips |
| `GET /api/trips/:id`, `PUT /api/trips/:id`, `DELETE /api/trips/:id` | Owner | Read, update, or delete a trip |
| `GET /api/trips/:tripId/activities`, `POST /api/trips/:tripId/activities` | Trip owner | List or create activities inside the trip date range |
| `PUT /api/trips/:tripId/activities/reorder` | Trip owner | Persist activity order |
| `PUT /api/activities/:id`, `DELETE /api/activities/:id` | Activity owner | Update or remove activity |
| `GET /api/expenses`, `POST /api/expenses` | User | Search/filter or create own expense |
| `GET /api/expenses/:id`, `PUT /api/expenses/:id`, `DELETE /api/expenses/:id` | Owner | Read, update, or delete own expense |
| `GET /api/favorites`, `POST /api/favorites`, `DELETE /api/favorites/:id` | User | Manage destination wishlist |
| `GET /api/trips/:tripId/packing`, `POST /api/trips/:tripId/packing` | Trip owner | List or add packing items |
| `PUT /api/packing/:id`, `DELETE /api/packing/:id` | Item owner | Update or remove packing item |
| `GET /api/trips/:tripId/journal`, `POST /api/trips/:tripId/journal` | Trip owner | List or create journal entries |
| `PUT /api/journal/:id`, `DELETE /api/journal/:id` | Entry owner | Update or remove journal entry |
| `GET /api/notifications`, `PUT /api/notifications/:id/read` | User | Read reminders and mark them read |
| `POST /api/trips/:tripId/share`, `DELETE /api/share/:id` | Trip owner | Create or revoke a read-only share link |
| `GET /api/shared/:token` | Public token | View a valid shared trip read-only |
| `GET /api/admin/overview` | Admin | Aggregate platform counts and safe account fields |

Activities are stored in a separate `Activity` collection. Trips, activities, expenses, packing items, journals, favorites, notifications, and share records are associated with an authenticated owner. Removing a trip deletes its activities and trip-specific packing/journal entries, revokes its share links, and preserves its expenses as unlinked transaction records.

## Data and integrations

- `npm run seed` upserts sample destinations for Bali, Kyoto, Paris, Swiss Alps, Goa, Manali, Jaipur, and Singapore. Re-run it to refresh the catalog.
- Daily destination costs and best-season labels are sample estimates, not live prices, weather, hotel availability, or travel advice.
- Expense amounts retain their original currency. Charts compare category shares only after selecting one currency; totals never add unlike currencies.
- Leaflet maps use OpenStreetMap tiles. Markers appear only where the catalog or activity has coordinates; no live GPS tracking is provided.
- Share links are read-only and can be revoked by the trip owner.

## Manual journey checks

With MongoDB configured, verify account registration and sign-in, then create a trip, add an in-range activity, reorder it, and try an overlapping time. Add, edit, filter, export, and remove expenses; confirm dashboard and trip budget figures update in the selected currency. Check packing item completion, a journal entry, favorites, read-only sharing and revocation, and deletion of a trip with its related records. Verify that changing a trip ID to another user's record does not expose or modify it. The local demo supports the same main UI actions without persistent accounts.

The production client build is checked with `npm run build`. There is no automated test suite included yet.
