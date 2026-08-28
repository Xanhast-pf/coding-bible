# ADR-003: Static hosting and deep links

- Status: Accepted
- Date: 2026-08-28

## Context

The public site is expected to live at:

```text
https://xanhast-pf.github.io/coding-bible/
```

GitHub Pages serves static assets under the repository subpath and does not
provide a general SPA rewrite to `index.html`.

## Decision

- Vite uses `/coding-bible/` as its production base path.
- The initial site remains a single static application.
- Rule deep links use URL fragments (`#RULE-ID`) rather than path-based client
  routes.
- We do not add a routing dependency until real multi-page navigation requires it.

## Consequences

- Refreshing a rule deep link works naturally on GitHub Pages.
- The site stays dependency-light.
- Migrating to path routing later remains possible if hosting requirements change.
