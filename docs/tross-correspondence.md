# Note to Tross re: approach

Before submitting, I sent Tross's careers team a short note flagging that
building and publicly hosting a live scraper against LinkedIn's internal,
authenticated endpoints (as specified in the challenge/clarification email)
creates real ToS and legal exposure for whoever owns the public repo and
deployed service, given LinkedIn's User Agreement and prior litigation
against similar scraping-as-a-service patterns (e.g. *hiQ Labs v.
LinkedIn*).

I explained that I completed the reverse-engineering investigation itself
(see [`reverse-engineering.md`](./reverse-engineering.md)) and offered to
walk through those findings directly, but that for the public submission I
was shipping the full production system — identical architecture, schema,
validation, and tests — backed by a compliant mock data source instead of a
live scraper, via a swappable `ProfileSource` interface.

This is a summary for reviewers; the original email thread is available on
request.
