# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A wine cellar inventory PWA. Users scan barcodes to add/remove bottles, capture label photos for identification, and manage multiple shared cellars. Authentication is username/password with JWT HttpOnly cookies and refresh token rotation.

## Commands

### Client (Yarn 4 with PnP — run from `client/`)
```bash
yarn dev        # Vite dev server on :5173, proxies /api → localhost:5000
yarn build      # TypeScript check + Vite build → dist/
yarn preview    # Preview production build
```

### Server (.NET 9 — run from `server/`)
```bash
dotnet run      # Kestrel on :8080; runs EF Core migrations on startup
dotnet build
```

### Full stack
```bash
docker-compose up    # PostgreSQL :5432, server :5000, Nginx :3000
docker-compose down
docker-compose down -v   # also removes DB volume (full reset)
```

Copy `.env.example` → `.env` before first run. `JwtSecret` must be set — use `dotnet user-secrets` when running from Rider/CLI outside Docker.

## Architecture

```
Nginx (:3000)
  ├── serves /dist (React SPA, built by client/Dockerfile)
  └── proxies /api/* → server:8080

React SPA (client/src/)
  ├── React Router v6 (createBrowserRouter)
  ├── TanStack Query (useQuery / useMutation) for all server state
  ├── AuthContext — JWT session, refresh token rotation
  └── CellarContext — active cellar + cellar list

ASP.NET Core (.NET 9, server/)
  ├── EF Core migrations → PostgreSQL
  └── JWT HttpOnly cookies + refresh token rotation
```

## API

### Auth (`/api/auth`)
```
POST /login                   → { username, isAdmin }
POST /logout
POST /register                { inviteToken, username, password }
GET  /me                      → { username, isAdmin }
POST /refresh                 → rotates refresh token cookie
PATCH /me/password            { currentPassword, newPassword } → 204
GET  /invites?key=<adminKey>  → { url }   (admin only)
```

### Cellars (`/api/cellars`)
```
GET    /                      → CellarSummary[]
POST   /                      { name } → Cellar
PATCH  /{id}                  { name } → 204
DELETE /{id}                  → 204  (409 if non-empty or last cellar)
GET    /{id}/entries          → CellarEntry[]
POST   /{id}/entries/adjust   { barcode, delta } → CellarEntry | 400
GET    /{id}/members          → CellarMember[]
DELETE /{id}/members/{userId} → 204
POST   /{id}/share            → { url }
GET    /join/{token}          → { cellarName }  (preview)
POST   /join/{token}          → 204  (409 if already member)
```

### Wines (`/api/wines`)
```
GET  /{barcode}               → WineData | 404
POST /identify                multipart: barcode + image → IdentifyResponse
POST /link                    { barcode, productCode } → WineData
```

### Admin (`/api/admin`)
```
GET   /users                        → AdminUser[]
PATCH /users/{id}/password          { newPassword } → 204
```

Swagger available at `/swagger` in Development mode.

## Key Files

### Server
| Path | Role |
|------|------|
| `server/Endpoints/CellarEndpoints.cs` | Cellar + entry API logic |
| `server/Endpoints/AuthEndpoints.cs` | Auth, registration, password, invites |
| `server/Endpoints/AdminEndpoints.cs` | Admin user management |
| `server/Models/` | `AppUser`, `Cellar`, `CellarMember`, `CellarShareToken`, `CellarEntry` |
| `server/Data/AppDbContext.cs` | EF Core DbContext; composite PKs, unique indexes |
| `server/Migrations/` | EF Core migrations (do not edit manually) |
| `server/Program.cs` | DI setup, JWT config, CORS, middleware order |

### Client
| Path | Role |
|------|------|
| `client/src/App.tsx` | Router config, auth/admin guards, providers |
| `client/src/components/Layout.tsx` | App shell — header, nav, main outlet |
| `client/src/context/AuthContext.tsx` | Auth state, login/logout, 401 handler |
| `client/src/context/CellarContext.tsx` | Active cellar (localStorage), cellar list query |
| `client/src/pages/CellarPage.tsx` | Main inventory view — multi-cellar queries, filters, modals |
| `client/src/pages/ProfilePage.tsx` | User profile, password modal, cellar management |
| `client/src/pages/AdminPage.tsx` | Admin user list + invite generation |
| `client/src/pages/JoinCellarPage.tsx` | Accept cellar share token |
| `client/src/components/ScanModal.tsx` | Barcode scan → adjust flow (9-state machine) |
| `client/src/components/WineDetailModal.tsx` | Wine info + per-cellar stock editing |
| `client/src/components/CellarRow.tsx` | Cellar card with rename/delete/share/leave |
| `client/src/components/BarcodeScanner.tsx` | Camera + ZXing decode, 2s debounce |
| `client/src/components/FilterBar.tsx` | Collapsible filter UI (cellar, type, grape, pairing, storage) |
| `client/src/api/client.ts` | Fetch wrapper: 401 → refresh → retry; GET/POST/PATCH/DELETE/postForm |
| `client/src/api/types.ts` | Shared TS types |
| `client/vite.config.ts` | PWA manifest, Workbox, dev proxy |

## Data Model

- **Cellar**: owned by one user; members join via share tokens
- **CellarMember**: composite PK `(CellarId, UserId)`, role = owner | member
- **CellarEntry**: composite PK `(CellarId, Barcode)` — quantity per cellar
- On registration: a default "Min kjeller" cellar is auto-created for the user

## Conventions

- All server state via TanStack Query — no manual fetch outside of `api/client.ts`
- `api/client.ts` handles 401 → token refresh → retry automatically; all API calls must go through it (not raw `fetch`)
- `204 No Content` responses are handled in the client — `res.json()` is skipped
- EF Core uses **migrations** (not `EnsureCreated`) — run `dotnet ef migrations add <Name>` for schema changes
- CSS design tokens live in `client/src/index.css` (primary wine color `#722F37`)
- Icons: Lucide React (`lucide-react`) — `size={14}` for small buttons, `size={18}` for normal
- CORS allows `:3000` (Nginx) and `:5173` (Vite) — add new origins in both `server/appsettings.json` and `server/Program.cs`
- `JwtSecret` is not in `appsettings.json` — set via environment variable (Docker) or `dotnet user-secrets` (local)
