# Released Action compatibility fixture

This fixture is intentionally small and stable. Coding Bible's CI runs the most
recently published Action against it to prove that the immutable release artifact
still starts, analyzes source files, and exercises automated rules.

The published Action must not analyze Coding Bible's evolving current source tree:
the checked-out Action (`uses: ./`) is the authoritative dogfood validator for the
current branch.

Only change this fixture when the published Action compatibility contract itself
needs to change.
