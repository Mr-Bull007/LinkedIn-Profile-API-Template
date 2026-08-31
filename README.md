# TROSS LinkedIn Profile API

A hosted API that accepts a LinkedIn profile URL and returns normalized
profile data (name, headline, location, about, experience, education,
skills, certifications, languages, images) as structured JSON.

**Live URL:** `<fill in after deploying — see Deployment below>`

## Table of contents

- [Approach & known limitations](#approach--known-limitations)
- [Architecture](#architecture)
- [Setup](#setup)
- [API documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)

## Approach & known limitations

The challenge asked for a purely reverse-engineered solution hitting
LinkedIn's internal endpoints directly, without a browser, hosted publicly.

I did the reverse-engineering investigation — full findings are in
[`docs/reverse-engineering.md`](docs/reverse-engineering.md). Summary: the
opaque internal profile ID LinkedIn uses (`ACoAA...`) is already present in
LinkedIn's initial server-rendered HTML document for a profile page, before
any client-side JavaScript runs, meaning the `vanity name → internal
identity` resolution happens server-side on LinkedIn's end. The exact backend
generation mechanism for that mapping was not fully determined; what's clear
is that obtaining it programmatically requires either an authenticated
LinkedIn session or direct queries against LinkedIn's non-public endpoints.

**I chose not to ship that as a live, publicly hosted service**, because:

- It violates LinkedIn's User Agreement (automated access, scraping, and
  reproducing platform functionality via non-public interfaces are
  explicitly prohibited).
- LinkedIn has pursued legal action against companies built on this exact
  pattern (*hiQ Labs v. LinkedIn* and others).
- A public GitHub repo plus a live public endpoint doing this creates real,
  personal exposure — account termination, takedown requests, and potential
  legal correspondence — for whoever owns the repo/service.

Instead, this repo ships the **complete production system** — API layer,
input validation, normalized schema, error handling, tests, and deployment
config — with a `ProfileSource` abstraction (see
[`src/services/profileSource.ts`](src/services/profileSource.ts)) that
cleanly separates "how the API serves profile data" from "how profile data
is obtained." The shipped implementation, `MockProfileSource`, resolves
profiles from local fixture data in the exact same normalized shape a live
source would return. A compliant live data source (LinkedIn's official
Partner API under proper OAuth consent, for example) can be substituted in
without changing anything else in the codebase.

I also flagged this directly to Tross's team before submitting — see the
note in [`docs/tross-correspondence.md`](docs/tross-correspondence.md).

**Note on fixture data:** The `rushabh-sagara-8b0b16160` fixture contains
my own real, self-reported profile details (entered manually, not scraped)
to demonstrate the schema against real-world data. It is not the output of
any LinkedIn scraping — no request was made to LinkedIn to produce it.

**Known limitations of the current implementation:**

- Only profiles present in `src/data/fixtures/*.json` are resolvable
  (currently 2 sample profiles). Unknown vanity names return `404`.
- No live LinkedIn connectivity exists in this build — `meta.source` in
  every response is `"mock"`.
- No authentication/rate limiting is implemented on the public endpoint,
  since it serves only fixture data; a live version would need both.

## Architecture

```
src/
├── server.ts                    # Fastify app + entrypoint
├── routes/
│   └── profile.ts               # GET /api/profile route, validation, error mapping
├── services/
│   ├── profileSource.ts         # ProfileSource interface (the swappable seam)
│   └── mockProfileSource.ts     # Fixture-backed implementation
├── schema/
│   └── profile.ts               # NormalizedProfile TypeScript types
├── utils/
│   └── parseVanityName.ts       # LinkedIn URL -> vanity name parsing/validation
└── data/fixtures/*.json         # Sample profile data
```

## Setup

Requires Node.js 20+ (developed against Node 22/24).

```bash
npm install
npm run dev        # starts the API on http://localhost:3000 with hot reload
```

Other scripts:

```bash
npm run build       # compile TypeScript to dist/ (and copy fixtures)
npm start           # run the compiled server (after npm run build)
npm test            # run the test suite once
npm run test:watch  # run tests in watch mode
npm run typecheck   # tsc --noEmit
```

No environment variables or secrets are required to run this build — there
are none to keep out of the repo, since it doesn't call LinkedIn.

## API documentation

### `GET /api/profile?url=<linkedin-profile-url>`

Returns a normalized profile for the given LinkedIn profile URL.

**Query parameters**

| Param | Required | Description |
|---|---|---|
| `url` | yes | A LinkedIn profile URL, e.g. `https://www.linkedin.com/in/nisarg-sagara-916030169/`. With or without protocol/`www`/trailing slash/query params. |

**Success response — `200 OK`**

```json
{
  "vanityName": "nisarg-sagara-916030169",
  "profileUrl": "https://www.linkedin.com/in/nisarg-sagara-916030169/",
  "name": "Nisarg Sagara",
  "headline": "Student at L. D. Arts College",
  "location": "Ahmedabad, Gujarat, India",
  "about": "Aspiring software engineer...",
  "experience": [ { "title": "...", "company": "...", "current": true, "...": "..." } ],
  "education": [ { "school": "...", "degree": "...", "...": "..." } ],
  "skills": ["TypeScript", "Node.js", "..."],
  "certifications": [ { "name": "...", "...": "..." } ],
  "languages": [ { "name": "English", "proficiency": "..." } ],
  "images": { "profilePictureUrl": null, "backgroundImageUrl": null },
  "meta": { "source": "mock", "fetchedAt": "2026-08-29T12:00:00.000Z" }
}
```

**Error responses**

| Status | Body `error` | Cause |
|---|---|---|
| 400 | `invalid_url` | `url` isn't a parseable LinkedIn profile URL |
| 400 | `invalid_request` | `url` query param missing entirely |
| 404 | `profile_not_found` | No profile exists for that vanity name in the current data source |
| 500 | `internal_error` | Unexpected server error |

### `GET /api/profile/_available`

Dev/demo convenience route — lists vanity names currently resolvable
(i.e. what's in the fixture dataset). Only present when running with
`MockProfileSource`.

### `GET /health`

Basic health check, returns `{ "status": "ok" }`.

**Try it against the sample data:**

```bash
curl "http://localhost:3000/api/profile?url=https://www.linkedin.com/in/nisarg-sagara-916030169/"
curl "http://localhost:3000/api/profile?url=https://www.linkedin.com/in/jane-doe-example/"
curl "http://localhost:3000/api/profile/_available"
```

## Testing

```bash
npm test
```

Covers: URL parsing/validation edge cases, the mock data source (found/not
found), and the full route including status codes and error shapes.

## Deployment

This repo includes a `Dockerfile` and `render.yaml`, and deploys cleanly to
Render (or any Docker-friendly host — Fly.io, Railway, etc.) with no
required environment variables.

**Render (recommended, free tier):**

1. Push this repo to GitHub.
2. On [render.com](https://render.com), New → Blueprint → connect the repo.
   Render will read `render.yaml` and provision the service automatically.
3. Once deployed, the service is reachable over HTTPS at the URL Render
   assigns (e.g. `https://tross-linkedin-profile-api.onrender.com`).

**Manual Docker run (any host):**

```bash
docker build -t tross-linkedin-profile-api .
docker run -p 3000:3000 tross-linkedin-profile-api
```
