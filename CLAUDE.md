# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A wine cellar inventory PWA. Users scan barcodes to add/remove bottles. No authentication — single-user.

## Commands

### Client (Yarn 4 with PnP — run from `client/`)
```bash
yarn dev        # Vite dev server on :5173, proxies /api → localhost:5000
yarn build      # TypeScript check + Vite build → dist/
yarn preview    # Preview production build
```

### Server (.NET 9 — run from `server/`)
```bash
dotnet run      # Kestrel on :8080; auto-creates DB schema via EnsureCreated()
dotnet build
```

### Full stack
```bash
docker-compose up    # PostgreSQL :5432, server :5000, Nginx :3000
docker-compose down
```

Copy `.env.example` → `.env` before first run. Default DB password is `wineapp`.

## Architecture

```
Nginx (:3000)
  ├── serves /dist (React SPA, built by client/Dockerfile)
  └── proxies /api/* → server:8080

React SPA (client/src/)
  └── TanStack Query → GET/POST /api/cellar

ASP.NET Core (.NET 9, server/)
  └── EF Core → PostgreSQL (CellarEntries table)
```

**No migrations** — EF Core `EnsureCreated()` runs on startup. Schema changes require manual table drops in dev.

## API

```
GET  /api/cellar                     → CellarEntry[]  (qty > 0, ordered by barcode)
POST /api/cellar/adjust  { barcode, delta }  → CellarEntry | 400
```

`delta` is signed: positive adds bottles, negative removes. Quantity is floored at 0. Swagger available at `/swagger` in Development mode.

## Key Files

| Path | Role |
|------|------|
| `server/Endpoints/CellarEndpoints.cs` | All API logic |
| `server/Models/CellarEntry.cs` | Entity: `Barcode` (PK, string) + `Quantity` (int) |
| `server/Data/AppDbContext.cs` | EF Core DbContext |
| `client/src/pages/CellarPage.tsx` | Main UI — inventory table with scan/adjust buttons |
| `client/src/components/ScanModal.tsx` | Modal wrapping scanner; posts adjust mutations |
| `client/src/components/BarcodeScanner.tsx` | Camera + ZXing decode, 2 s debounce between scans |
| `client/src/api/client.ts` | Thin fetch wrapper (GET/POST helpers) |
| `client/src/api/types.ts` | Shared TS types (`CellarEntry`) |
| `client/vite.config.ts` | PWA manifest, Workbox (1-hour API cache), dev proxy |

## Conventions

- React components use TanStack Query (`useQuery` / `useMutation`) for all server state — no local state for server data.
- The scanner's `useEffect` handles React Strict Mode double-mount via an `active` flag and `reader.reset()` cleanup.
- CSS variables for the design system live in `client/src/index.css` (primary wine color `#722F37`).
- CORS allows `:3000` (Nginx) and `:5173` (Vite) — add new origins in both `server/appsettings.json` and `server/Program.cs`.
