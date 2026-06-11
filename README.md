# Docu Create

**State-informed lease agreements** for U.S. landlords — [docu-create.com](https://docu-create.com)

Docu Create is a self-service web app that walks you through a lease wizard, applies state-level reference rules (deposits, notice periods, disclosures, and more), and produces a printable PDF with optional tenant e-signature. It is operated by Execute & Engrave LLC and is **not a law firm**; generated documents are starting points, not legal advice.

## Features

- **Multi-step lease wizard** — room, apartment, house, condo, and commercial property types
- **State reference data** — all 50 states + DC (deposits, late fees, notice to enter, notice to vacate, deposit return, disclosures)
- **Structured addresses & US phone formatting** — `+1 (XXX) XXX-XXXX` with validation
- **Live preview** — review the full agreement before download
- **Edit & update** — return from preview to the wizard with fields pre-filled; updates the same document
- **PDF export** — via `@react-pdf/renderer`
- **E-signature flow** — email tenant a signing link (when email is configured)
- **Blog** — landlord/tenant guides for SEO and education
- **Payments (optional)** — Stripe checkout is **off by default** until you enable it

## Tech stack

| Layer | Stack |
|-------|--------|
| Frontend | React 18, Vite, Tailwind CSS, React Router, React Hook Form |
| API | Express (Node), encrypted document storage on disk |
| PDF | `@react-pdf/renderer` |
| Payments | Stripe (opt-in via `PAYMENTS_ENABLED`) |
| Email | Nodemailer (Gmail OAuth or mock mode) |

## Prerequisites

- Node.js 18+
- npm

## Local development

```bash
git clone https://github.com/ericbowser/DocuCreate.git
cd DocuCreate
npm install
cp .env.example .env
# Edit .env as needed (see below)
npm run dev
```

- **Web app:** http://localhost:5173  
- **API:** http://localhost:8787 (default; override with `API_PORT`)  
- Vite proxies `/api` to the API server in dev — no `VITE_API_URL` needed locally.

Run the API alone:

```bash
npm run server
```

Production build (static frontend):

```bash
npm run build
npm run preview   # serves dist/ — still needs API for document routes
```

## Environment variables

Copy `.env.example` to `.env` in the **project root** (not `src/.env`). Never commit `.env`.

| Variable | Purpose |
|----------|---------|
| `API_PORT` | Express port (default `8787`) |
| `APP_URL` | Public site URL (Stripe redirects, signing links) |
| `DOCUMENT_ENCRYPTION_KEY` | Encrypts stored leases (`openssl rand -hex 32`) |
| `EMAIL_*` / Google OAuth | Outbound email; omit for mock mode |
| `PAYMENTS_ENABLED` | Set to `true` only when Stripe is ready |
| `STRIPE_*` | Required when payments are enabled |
| `VITE_API_URL` | Production frontend → API URL (e.g. `https://api.docu-create.com`) |

**Launch / indexing mode:** leave `PAYMENTS_ENABLED` unset. Downloads, print, and e-signature unlock for free.

**Monetization mode:** set `PAYMENTS_ENABLED=true`, configure Stripe keys and webhook, set `APP_URL` to your live domain.

## npm scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite + API together |
| `npm run server` | API only |
| `npm run build` | Production frontend build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run tail:watch` | Optional Tailwind watch (app uses `src/index.css`) |

## Project structure

```
DocuCreate/
├── public/              # robots.txt, sitemap.xml (static assets)
├── server/              # Express API
│   ├── data/            # Runtime JSON (gitignored): documents, comments
│   ├── documentStore.js # Encrypted lease persistence
│   ├── leaseStore.js    # E-sign tokens (in-memory)
│   └── server.js        # Routes
├── src/
│   ├── components/      # Wizard, preview, PDF, UI
│   ├── content/         # Blog posts, legal copy
│   ├── data/            # State laws, vacate notice rules
│   ├── pages/           # Routes: Home, Preview, Sign, Blog, Legal, About
│   └── utils/           # Lease content, state law service, storage
├── .env.example
└── vite.config.js
```

## API overview

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/documents/create` | Create encrypted lease |
| `GET` | `/api/documents/:id` | Preview (masked if unpaid) |
| `GET` | `/api/documents/:id/edit` | Full data for wizard edit |
| `PATCH` | `/api/documents/:id` | Update lease |
| `DELETE` | `/api/documents/:id` | Delete lease |
| `POST` | `/api/lease/send` | Email signing link |
| `GET` | `/api/health` | Status, payments mode |

## Deployment notes

1. Build the frontend: `npm run build` — serve `dist/` from your static host (e.g. docu-create.com).
2. Run the API as a Node process (e.g. `node server/server.js`) behind a reverse proxy.
3. Set `APP_URL` to your public URL and `DOCUMENT_ENCRYPTION_KEY` in production.
4. Set `VITE_API_URL` at **build time** if the API is on a different origin.
5. Submit `https://docu-create.com/sitemap.xml` in Google Search Console.
6. `server/data/` is created at runtime and should live on persistent disk.

## Legal

Generated leases include disclaimers that Docu Create is not a law firm. Users should consult a licensed attorney before executing any agreement. See `/legal` in the app for full terms.

## License

ISC — Execute & Engrave LLC
