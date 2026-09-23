# CampusBite

**Smart College Canteen Ordering, Billing & Payment System**
_Order Smart. Pay Easy. Pick Up Fast._

A full-stack MERN application: React + Vite + Tailwind frontend, Node/Express + MongoDB backend, JWT auth, UPI (sandbox) + internal wallet payments, secure QR-code counter pickup, Socket.IO real-time order tracking, and role-based dashboards for students, staff, managers, and admins.

---

## 1. Prerequisites

- Node.js 18+
- MongoDB **running as a replica set** (even a single-node one). This is required because
  wallet payments and order finalization use multi-document ACID transactions
  (`session.withTransaction`), which MongoDB only supports on a replica set.
  - Easiest option: a free **MongoDB Atlas** cluster (Atlas clusters are replica sets by default).
  - Local option: `mongod --replSet rs0`, then run `mongosh --eval "rs.initiate()"` once.

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env        # then edit .env: set MONGO_URI, JWT_SECRET
npm run seed                 # creates demo accounts + starter menu + inventory
npm run dev                  # starts the API on http://localhost:5000
```

Demo accounts created by the seed script (password shown is plaintext, seed-only — never do this in production):

| Role     | Email                     | Password      |
|----------|----------------------------|---------------|
| Admin    | admin@campusbite.edu       | Admin@123     |
| Manager  | manager@campusbite.edu     | Manager@123   |
| Staff    | staff@campusbite.edu       | Staff@123     |
| Student  | student@campusbite.edu     | Student@123   |
| Lecturer | lecturer@campusbite.edu    | Lecturer@123  |

## 3. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env        # defaults already point at localhost:5000
npm run dev                  # starts the app on http://localhost:5173
```

Open http://localhost:5173, log in with any demo account above, or use **Continue as Guest**.

## 4. Trying the full order flow

1. Log in as `student@campusbite.edu`.
2. Browse **Menu**, add items to cart, check out.
3. Choose **Wallet** (seeded with ₹500) or **UPI** (sandbox — click "I've Completed Payment" to simulate the gateway callback).
4. You'll land on the **QR code** screen — this is the student's proof of payment for counter pickup.
5. Open a second browser (or incognito window), log in as `staff@campusbite.edu`.
6. On the **Staff Dashboard**, advance the order: Confirmed → Preparing → Ready.
7. Go to **QR Scanner**, paste the QR token shown on the student's screen (or use the order number + PIN shown under the QR), verify, then **Confirm Handover**.
8. Back on the student's screen, **Order Tracking** updates to `DELIVERED` in real time via Socket.IO.
9. Log in as `manager@campusbite.edu` to see the sale reflected on the **Manager Dashboard** and **Reports**.

## 5. Project structure

```
campusbite/
├── backend/
│   ├── src/
│   │   ├── config/       # MongoDB connection
│   │   ├── models/       # Mongoose schemas (8 collections)
│   │   ├── middleware/   # JWT auth, role guard, error handler
│   │   ├── controllers/  # Route handlers, grouped by feature
│   │   ├── routes/       # Express routers
│   │   ├── services/     # Shared transactional logic (order finalization, wallet ledger)
│   │   ├── sockets/      # Authenticated Socket.IO setup + emit helpers
│   │   └── utils/        # Token/QR generation, seed script
│   ├── server.js         # Entry point (HTTP + Socket.IO)
│   └── .env.example
└── frontend/
    └── src/
        ├── api/           # Axios instance with JWT interceptor
        ├── context/       # Auth, Socket, Cart React contexts
        ├── components/    # Navbar, ProtectedRoute
        └── pages/
            ├── student/   # Menu, cart, checkout, payment, QR, tracking, wallet, spending, history, profile
            ├── staff/     # Dashboard, QR scanner, history
            └── manager/   # Dashboard, menu mgmt, orders, inventory, reports, staff mgmt
```

## 6. Security notes (already implemented)

- Passwords hashed with bcrypt; JWTs signed server-side; **role checks always happen on the backend** — the frontend's role-based nav/routes are UX only, never the actual authorization boundary.
- QR codes: only a SHA-256 **hash** of the token is stored in MongoDB; the raw token is shown to the student once. Tokens are single-use (`qrIsActive` flips to `false` on delivery) and expire after 6 hours.
- An order can only be marked `DELIVERED` through the explicit staff "Confirm Handover" action — never automatically from a QR scan alone.
- Wallet debits/credits and order-payment finalization run inside MongoDB transactions with idempotency keys, so a retried request or a network hiccup can't double-charge a wallet.
- Rate limiting, Helmet security headers, and CORS are enabled on the API.

## 7. Known simplifications / what to harden before going live

- **UPI integration is a sandbox mock** — `paymentController.js` creates a fake "intent" and a client-triggered `/verify` call simulates the gateway webhook. Swap in a real provider (Razorpay, Cashfree, PhonePe, etc.) and switch `/verify` to a **server-side signature-verified webhook**, not a client-triggered call.
- **QR camera scanning**: the Staff QR Scanner currently accepts pasted/typed tokens (which also works out-of-the-box with any USB/Bluetooth barcode-scanner "keyboard wedge" device — common in real canteens). To scan with a phone/tablet camera, drop in a client-side decoding library (e.g. `html5-qrcode`) that feeds the decoded string into the same `qrToken` field — the backend endpoint doesn't need to change.
- **Wallet top-up** is a self-service demo endpoint for testing. Before enabling real stored-value wallets, confirm applicable regulatory requirements (e.g., RBI PPI rules in India) and route top-ups through the same verified-payment flow as orders.
- Discounts, PDF receipt downloads/printing, and ingredient-level automatic stock deduction are modeled in the schema (`Order.discount`, `Inventory.linkedMenuItem`) but not wired into the UI — natural next additions.
