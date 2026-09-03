# Rule Inventory

Total rules: **128**

Stable rules with paired **DON'T / DO** examples: **128 / 128**

| Pack | Rules |
| --- | ---: |
| `accessibility` | 6 |
| `ai` | 7 |
| `apollo` | 6 |
| `architecture` | 7 |
| `core` | 11 |
| `css` | 4 |
| `dependencies` | 4 |
| `feature-flags` | 4 |
| `graphql` | 6 |
| `internationalization` | 4 |
| `javascript` | 7 |
| `legend-state` | 6 |
| `nextjs` | 6 |
| `performance` | 4 |
| `react` | 13 |
| `redux` | 11 |
| `tanstack-query` | 5 |
| `testing` | 6 |
| `typescript` | 7 |
| `workflow` | 4 |

## Analyzer automation

The analyzer intentionally automates only the subset that static evidence can
defend. The reviewed 128-rule classification and prioritized detector backlog
are generated in [`analyzer-automation-matrix.md`](./analyzer-automation-matrix.md).

The current classification is:

- **27** automated rules;
- **12** high-confidence automation candidates;
- **42** contextual candidates;
- **43** human / agent review rules;
- **4** rules primarily owned by external tooling.

These classifications are a trust boundary, not a completeness score. New
detectors are promoted Canary-first and must survive positive, negative,
adversarial, mutation, and consumer-parity contracts before they count as
automated.
