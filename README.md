# Project T01

> **Starting small. Building meaningful solutions.**
> A career-products platform for students and young graduates in India - roadmaps, learning guides and interview resources, sold (or given free) as digital products.

This is **Phase 1** of the vision in `docs/Clarification_Project-T01.pdf`: a small, low-budget website that validates what people need, with real online payments and instant product access.

| Layer | Tech |
|---|---|
| Client | React 18, Vite, Tailwind CSS, React Router (design tokens from `docs/design-reference`) |
| Server | Node.js 18+, Express, Mongoose (MongoDB), JWT (httpOnly cookie) |
| Payments | Cashfree Payment Gateway (UPI / Card / Net Banking) + a built-in **mock mode** for local testing |

---

## 0. What this version does

| Area | Behaviour |
|---|---|
| **Public (no login)** | Landing/Home page, About page, and the policy pages (Contact, Terms, Refunds, Privacy - Cashfree needs these public). Nothing else. |
| **Landing button** | **Register / Login for Free** (one screen with *Login* and *Register free* tabs). |
| **Explore** | `/explore` and `/explore/:slug` need an account. A logged-out click on any link is sent to Login, and **after login or registration the visitor is taken to the page they clicked** (`?next=` is validated - only same-site paths are accepted). |
| **Product = web e-book** | Wikipedia-style reader at `/learn/:slug`: chapters -> topics, long explanations, activities, **tick-box tasks**, **quick tests** (checked on the server), and **explanation videos** (YouTube / Vimeo / direct .mp4). Progress is saved per user. No PDF is handed out. |
| **Admin** | *Admin -> Products*: create products; **E-book content** builder for chapters, topics, text, videos, tasks, activities, tests and **links** (external or to another product page). *Preview as reader* button. |
| **Payments** | Cashfree: Explore -> Product Details -> Buy Now -> Checkout -> Cashfree -> server verification -> access -> My Learning -> Open e-book. |

Text blocks support: `## Heading`, `### Sub-heading`, `- bullets`, `1. numbered`, `> note`, `**bold**`, `*italic*`, `[link text](https://... or /explore/other-product)`.

## 1. Run it locally (step by step)

**Prerequisites:** Node.js 18 or newer, and MongoDB (local install, or a free MongoDB Atlas connection string).

```bash
# 1) Install everything (server + client)
npm run install:all

# 2) Configure the server
cd server
cp .env.example .env          # Windows: copy .env.example .env
#   -> open .env and set MONGO_URI and JWT_SECRET (a long random string)
#   -> leave PAYMENT_MODE=mock for now
cd ..

# 3) Create the admin account, sample products and landing content
npm run seed

# 4) Start the API (terminal 1)         -> http://localhost:5000
npm run dev:server

# 5) Start the website (terminal 2)     -> http://localhost:5173
npm run dev:client
```

Open **http://localhost:5173**.

**Admin login** (from `.env`): `admin@t01.local` / `ChangeMe@123` -> change these in `.env` before seeding on any real server.

### Try the full purchase flow (mock payments)
1. Open the site -> **Register / Login for Free** (or click *Explore* and you will be asked to log in first). Create an account - you land on **Explore**.
2. Pick **Career Roadmap Starter Pack (₹199)** -> **Buy Now**.
3. *Checkout* -> **Pay ₹199** -> the mock gateway page appears -> **Simulate successful payment**.
4. The status page verifies the order on the server, then **Open my e-book** takes you into the reader. Choose *Simulate failed payment* to test **Retry**.
5. Log in as admin -> `/admin` to manage products, orders, users and landing-page text.

> Seeded products come with a tiny sample e-book. Write the real chapters in **Admin -> Products -> E-book content**.

---

## 2. Go live with real Cashfree payments

1. Create a Cashfree account and copy your **App ID** and **Secret Key** (start with the *Sandbox* keys).
2. In `server/.env`:
   ```
   PAYMENT_MODE=cashfree
   CASHFREE_ENV=sandbox            # change to production after Cashfree approves your account
   CASHFREE_APP_ID=...
   CASHFREE_SECRET_KEY=...
   ```
3. Restart the server and run a sandbox payment (Cashfree provides test UPI/cards in their docs).
4. **Webhook (recommended):** expose the API over **https** (ngrok locally, your domain in production), set `SERVER_PUBLIC_URL`, and in the Cashfree dashboard add the webhook URL
   `https://YOUR-API/api/payments/webhook`. Even without the webhook, the app verifies payment on return.
5. For production also set `NODE_ENV=production`, `CASHFREE_ENV=production`, `CLIENT_URL=https://yourdomain.com`.

`PAYMENT_MODE=mock` is **blocked in production** by design, so you cannot accidentally ship free access.

### Deploy as one app
```bash
npm run build            # builds client/dist
NODE_ENV=production npm start   # Express serves the API and the built site on one origin
```
Works on any Node host (Render, Railway, VPS). Put Nginx/Caddy in front for HTTPS. Persist `server/storage` and `server/uploads` on a disk/volume.

---

## 3. Project structure

```
T01/
├── client/   React + Vite + Tailwind  (pages/Learn.jsx = e-book reader, pages/admin/AdminEbook.jsx = builder)
├── server/   Express + MongoDB        (controllers/ebookController.js, utils/ebook.js, models/Ebook.js, Progress.js)
├── render.yaml                         one-file deploy config for Render (see docs/HOSTING.md)
└── docs/     HOSTING.md  SECURITY.md  SANDBOX-TESTING.md  PAYMENT-FLOW.md  API.md  ARCHITECTURE.md
```

## 4. Before going live - read these
1. `docs/SANDBOX-TESTING.md` - test every payment case in Cashfree **sandbox** first.
2. `docs/HOSTING.md` - which hosting plan to buy and how to deploy securely.
3. `docs/SECURITY.md` - the checklist (rotate keys, strong admin password, webhook, backups).
4. Edit the contact details in `client/src/pages/Legal.jsx` (or set the `VITE_*` variables) and have the Terms / Refund wording checked - Cashfree reviews these pages.

## 5. Security notes
- Prices are always read from the database; the browser never sends an amount.
- Access is granted **only** after the server confirms payment with Cashfree (amount re-checked). Fulfilment is atomic and idempotent, so the webhook and the return page can both run safely; a second checkout first re-checks any unfinished earlier order so nobody is charged twice.
- Webhooks are authenticated with Cashfree's HMAC signature over the raw body, then re-verified with Cashfree.
- The Cashfree secret key exists only in the server environment - never in React.
- E-book content lives in its own collection and is only returned to buyers/admins; quiz answers are checked on the server and never sent with the page.
- Product APIs, reader, library and admin all require login; admin routes also require the `admin` role.
- Passwords hashed with bcrypt (cost 12), httpOnly SameSite cookie, Helmet + CSP, rate limiting (auth, payments, API), input validation; the role is never accepted from the client.
- In production the server **refuses to start** with a placeholder JWT secret, the default admin password, `http://` URLs, or mock payments.
- **Never commit `.env`.** This zip intentionally contains only `.env.example`.
