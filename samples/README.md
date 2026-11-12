# Engineering portfolio samples
Independent portfolio exercises, not previous client engagements. These files are newly written and do not contain the client's private project code.

## Sample 1: React + wallet transaction flow
DonationForm.jsx, wallet-flow.mjs, amount.mjs
- Exact decimal-to-wei conversion, input validation, network/account rechecks.
- Pending states, a synchronous duplicate-submit guard and rejected-transaction handling.
- Injected wallet and contract adapter; no secrets or real transaction UI in the published gallery.
- Integration snippet: sendDonation: async ({account,campaignId,value}) => new ethers.Contract(address,abi,provider.getSigner(account)).donateToCampaign(campaignId,{value})
- Contract rules, gas estimation, wallet disconnect subscriptions and concurrent chain changes during the wallet prompt require application-specific integration. This is not a smart contract audit or a complete payment system.

## Sample 2: Node.js API + retryable connection
api-server.mjs, retryable-connection.mjs
- Run with Node.js 20+: node samples/api-server.mjs
- GET /api/health
- POST /api/contributions/preview with application/json: {"campaignId":"4","amount":"0.1"}
- Validates and converts only. No donations are sent or persisted.
- The connection manager is adapter-based. No MongoDB credentials are included; real database integration is not claimed.
- API runs locally, not on the static portfolio host. Production auth, rate limiting and payment verification are outside this sample.

## Verification
Run: node --test tests/samples.test.mjs
Six automated checks cover precision/validation, network switching, account changes, rejected wallet requests, failed receipts, connection retries and HTTP responses. Wallet tests use mocks. No live blockchain or MongoDB verification has been performed. DonationForm.jsx is provided as reviewable React source; the standalone API and wallet logic run without third-party dependencies.

## Existing RaiseFlow interface
The archive also includes the existing React fundraising UI source and standalone HTML. It uses browser-local storage, sample campaign figures and no live payments. Its optional Express/Mongoose starter is separate from these focused examples.
