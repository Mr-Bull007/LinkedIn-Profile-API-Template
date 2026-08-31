# Reverse-Engineering Investigation — Findings & Approach Decision

## What was investigated

As part of this challenge, I investigated how LinkedIn's public profile pages
(`https://www.linkedin.com/in/<vanity-name>/`) resolve a human-readable vanity
name into LinkedIn's internal opaque profile identifier (a value with the
`ACoAA...` prefix used throughout LinkedIn's internal APIs, messaging URNs,
and rendered markup).

Using browser DevTools against two profiles, I traced the following:

1. **The opaque ID is present in the initial server-rendered HTML document**,
   before any client-side JavaScript executes and before any subsequent
   Fetch/XHR request is made. This means LinkedIn resolves `vanity name →
   internal profile identity` entirely server-side, ahead of the browser
   making any further request.
2. **The ID is reused pervasively** throughout the page — in navigation
   links (`profileId=...`), messaging compose links (`profileUrn=...`,
   `recipient=...`), and internally generated component keys — appearing
   dozens of times in a single page render.
3. **Later Fetch/XHR requests (e.g. `profileCardsActivity`) consume this
   identity rather than originate it** — they run after the ID already
   exists in the initial document, so they cannot be the source of the
   mapping.
4. Three distinct identity representations coexist for the same profile on
   one page: the public **vanity name**, an internal **member URN**
   (`urn:li:member:<numeric-id>`), and the **opaque profile ID**.

**What remains unknown:** the exact backend mechanism LinkedIn uses to
generate or store the `vanityName → opaque ID` mapping, and whether/how that
mapping could be retrieved reliably outside of an authenticated browser
session.

## Why this project does not ship a live scraper

Retrieving that server-rendered document programmatically requires either:

- an authenticated LinkedIn session (cookies from a logged-in account), or
- directly querying LinkedIn's internal endpoints outside of a browser context.

Both approaches fall outside LinkedIn's User Agreement, which prohibits
automated scraping and reproducing platform functionality via unauthorized
access to non-public interfaces. LinkedIn has also actively litigated against
scraping services built on this pattern (e.g. *hiQ Labs v. LinkedIn*, and
subsequent suits against scraping-as-a-service vendors). Publishing a public,
hosted API that performs this against arbitrary third parties' profiles —
and distributing a public GitHub repo containing the implementation — would
create real exposure: LinkedIn account termination, DMCA/takedown activity
against the hosted service, and potential legal correspondence, borne
personally by whoever owns the repo and the deployed service.

Given that, I made a deliberate architectural decision: **build the full
production system with a clean seam between "serving normalized profile
data" and "obtaining profile data,"** and implement the latter with a
compliant mock data source rather than a live scraper. See
[`src/services/profileSource.ts`](../src/services/profileSource.ts) for the
interface and reasoning in code, and the main [README](../README.md) for the
"Approach & Known Limitations" section.

A compliant live implementation of `ProfileSource` — e.g. against LinkedIn's
official Partner/Marketing Developer Platform APIs under a proper OAuth
scope and user consent — could be dropped in without touching any other part
of the codebase.
