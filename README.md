# Brandex Ledger

A lightweight, browser-based ledger for managing client accounts, case entries, stages, payments, balances, and print-ready records for Brandex.

## Current Status

**Base release:** Neo-Brutalism Theme v1

This repository starts from the working Brandex Ledger base and applies the approved Neo-Brutalism visual system. Feature work will be added incrementally.

## Features in the current base

- Client account management
- Case/ledger entries
- Stage and amount workflow
- Payment records
- Balance calculation
- CSV import/export
- Print-friendly output
- Browser localStorage persistence
- Responsive layout
- Neo-Brutalism visual theme

## Design System

The current UI follows the Brandex Neo-Brutalism reference:

- Near-black `#0C0C0C`
- Warm cream `#F0E8D0`
- Deep cream `#E8DFC7`
- Off-white surfaces `#FAF6EE`
- Burnt orange `#C94A00`
- Dark/bright teal `#0A6B52` / `#0D9970`
- Bold yellow `#D4A800`
- Hard borders and offset shadows
- No gradients, glassmorphism, or blurred shadows

## Running locally

No build step is required for the current base.

1. Clone/download the repository.
2. Open `index.html` in a modern browser.

For more reliable browser behavior, serve the folder with any simple local HTTP server.

## Data

The current base uses browser `localStorage`. Data is stored locally in the browser and is not a server database.

## Roadmap

Feature changes are being implemented one point at a time. Planned work includes configurable stages, A/X account series, editable account prefixes, branding settings, case-specific payment allocation, improved printing/export, signature support, selected-row printing, and desktop layout improvements.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

See [SECURITY.md](SECURITY.md).

## Code of Conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Support

See [SUPPORT.md](SUPPORT.md).

## License

Released under the MIT License. See [LICENSE](LICENSE).
