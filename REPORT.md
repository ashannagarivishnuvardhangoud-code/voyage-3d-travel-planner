# VOYAGE 3D Project Report

**Project:** VOYAGE 3D — Explore More, Plan Smarter  
**Live website:** https://voyage-3d-travel-planner.onrender.com/  
**Source repository:** https://github.com/ashannagarivishnuvardhangoud-code/voyage-3d-travel-planner  
**Deployment:** Render web service, free instance

## Project overview

VOYAGE 3D is a responsive travel planning website for discovering destinations, organizing trips, building day-by-day itineraries, and tracking travel budgets. The landing page uses travel photography, a rotating globe treatment, destination cards, and responsive navigation. Visitors can explore destination information and open the demo workspace.

## Main capabilities

- Destination discovery with sample cost estimates and destination categories.
- Trip planning with dates, travelers, preferences, and budget details.
- Daily activity planning, itinerary organization, and trip maps.
- Expense records with categories, currencies, filtering, charts, and CSV export.
- Packing checklists, travel journal entries, destination favorites, and read-only trip sharing.
- User registration, sign-in, profile support, and administrator destination management when MongoDB is configured.
- A local demo workspace that stores clearly labeled sample records in the browser.

## Technical design

The client uses React and Vite, styled with Tailwind CSS. Framer Motion and Three.js/React Three Fiber provide motion and the decorative globe. Recharts renders expense charts, Leaflet displays maps, and Lucide React supplies interface icons.

The Node.js and Express server serves both the production client and JSON API. Mongoose models define users, destinations, trips, activities, expenses, packing items, favorites, journal entries, notifications, and shared trips. Private API routes use JWT authentication, password hashing, validation, and ownership checks. Activities are stored in a separate collection.

## Deployment and current status

The site is deployed at the live website link above. The Render service is on its free plan and builds the client with `npm ci --include=dev && npm run build`, then starts the Express server with `npm start`. This build setting includes Vite and other development dependencies required during compilation.

The deployed homepage loads, the Render deployment reports **Live**, and `GET /api/health` responds successfully. At the time of this report, the health response reports `database: "disconnected"` because no `MONGODB_URI` has been configured in Render.

## Data and current limitations

The MongoDB integration is implemented, but persistent accounts and private records are unavailable in the live deployment until a MongoDB connection string is configured. Without it, visitors can use the browser-based demo workspace; demo records stay in that browser and are not persisted to the server.

Destination daily costs and best-time information are sample estimates, not verified live prices, weather, or availability. Map markers are shown only when coordinates exist, and the site does not provide live GPS tracking. Expense totals retain currency and do not combine unlike currencies without conversion data.

No automated test suite is included. The project README documents setup, configuration, API routes, and manual journey checks.

## Run locally

Requirements: Node.js 20 or newer and MongoDB 6 or newer for persistent records.

1. Copy `.env.example` to `.env` and configure `MONGODB_URI` and a private `JWT_SECRET`.
2. Install packages and seed the destination catalog with `npm install` and `npm run seed`.
3. Start the client and API together with `npm run dev`.
4. Open http://localhost:5173.

See [README.md](README.md) for additional deployment guidance and the API overview.
