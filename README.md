# RaiseFlow — independent portfolio project
A responsive React fundraising interface. This project was created as portfolio work, not a commissioned client product. Campaign names and figures are illustrative.

## Quick view
Open `dist/index.html` directly in a browser. The HTML includes the React bundle and styles. Upload this file as `index.html` to a static hosting service such as GitHub Pages to share it with a client. Fonts are optional external Google Fonts, with system fallbacks.

## Features
- Search and category filters, project detail views and milestones.
- Create a campaign, saved projects and creator dashboard.
- Browser-local persistence. Sample contributions only; no real transfers.
- Optional injected Ethereum wallet connection (public account request only).
- Responsive mobile layouts.

## Development
Node.js 20 or later. Run `npm install`, then `npm run build`.

## Optional backend starter
`server/index.js` provides an Express + Mongoose campaign API. Set MONGODB_URI and run `npm run server`. `/api/health` and `/api/campaigns` support GET. POST campaign creation is disabled unless ENABLE_LOCAL_AUTHORING=true, for local development only.
The portfolio frontend currently uses localStorage and is NOT wired to this API. A MongoDB database has not been provisioned or tested in this deliverable. Authentication, authorization, API integration, smart contracts, transaction verification and production payment processing are not implemented. Do not describe this project as a deployed MERN backend or production Web3 payment platform.

## Client walkthrough
1. Explore and filter the sample campaigns.
2. Open a project and inspect milestones.
3. Record a sample contribution and check the updated total.
4. Create a new campaign and open the dashboard.
5. Save a project and revisit the saved collection.

## Suggested positioning
“A React fundraising portfolio project showing campaign discovery, campaign creation and dashboard interactions.”
No claims of previous clients, real fundraising, audited smart contracts or production delivery.
