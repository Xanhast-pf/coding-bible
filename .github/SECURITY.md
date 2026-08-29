# Security Policy

## Supported versions

Coding Bible is currently pre-1.0. Security fixes are made on the latest `main`
branch and are included in the next release/deployment. Older snapshots and
historical patch files are not maintained as supported release lines.

## Reporting a vulnerability

Please do **not** report suspected security vulnerabilities in a public GitHub
issue, discussion, or pull request.

Use GitHub's **Private vulnerability reporting** for this repository instead:
open the repository's **Security** tab, choose **Advisories**, then select
**Report a vulnerability**.

Please include, when applicable:

- the affected component, package, workflow, or rule;
- reproduction steps or a minimal proof of concept;
- the expected and observed behavior;
- the potential impact;
- any suggested mitigation or fix you have already identified.

Reports will be reviewed on a best-effort basis. Please allow reasonable time
for investigation and remediation before publicly disclosing a vulnerability.

## Scope

Security reports are especially useful for issues involving:

- the analyzer or CLI processing untrusted source code;
- generated patch/report output that could modify unintended files;
- GitHub Actions or deployment permissions;
- dependency/supply-chain behavior;
- secret or credential exposure;
- the public website in ways that could affect users or repository integrity.

General bugs, false positives, rule requests, and feature proposals should use
normal GitHub issues instead.
