# v0.23.0 Windows validation status

| Gate | Status |
|---|---|
| Implemented and unit-tested | Yes (Linux CI/development environment) |
| Desktop Vite build | Passed on Linux |
| Electron TypeScript build | Passed on Linux |
| Built on Windows | Pending user run |
| Official Overwolf SDK installed/configured | No independently verified SDK package |
| Application whitelisting | Not configured in this environment |
| Tested with Overwolf runtime | Pending |
| Tested with Dota 2 | Pending |
| Tested with real GEP | Pending |
| Real capture created | No; synthetic fixture only |
| Tested with production overlay | Pending |

No Windows, Dota 2, approved runtime, credentials or real GEP recording were available. LIVE_GEP therefore fails closed. Supported/unavailable features for a real session remain unknown until capability negotiation on Windows; the synthetic fixture supports game/match/me/roster and marks items unavailable.
