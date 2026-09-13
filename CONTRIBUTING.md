# Contributing to Brandex Ledger

Thank you for helping improve Brandex Ledger.

## Development principles

- Keep changes focused and reviewable.
- Do not mix unrelated features in one change.
- Preserve existing data compatibility unless a migration is explicitly planned.
- Avoid destructive changes to user ledger data.
- Follow the existing UI design system.
- Test changes in a desktop browser and a mobile-sized viewport when UI is affected.

## Pull requests

A pull request should include:

1. A clear description of the problem and solution.
2. The exact files changed.
3. Manual test steps.
4. Any compatibility or data-storage impact.
5. Screenshots for significant UI changes.

## Commit messages

Prefer short, descriptive messages such as:

- `feat: add configurable stages`
- `fix: preserve client account number`
- `style: apply neo-brutalism theme`
- `docs: update setup instructions`

## Scope control

Brandex Ledger feature work is intentionally incremental. If a change request covers several independent features, split them into separate changes whenever practical.
