# EcoBin: Smart Waste Management

Segregate waste, use smart bins, earn EcoPoints, redeem rewards, climb the leaderboard.

**Stack:** Next.js 14 · TypeScript · Tailwind CSS · NestJS · GraphQL (Apollo, code-first) · PostgreSQL (Neon or any Postgres via `DATABASE_URL`) · SQLite fallback for local dev · TypeORM · JWT auth

**Demo accounts** (seeded on first start):

- User portal (`/login`): `demo@ecobin.com / demo123`
- Admin portal (`/admin/login`): `admin@ecobin.com / admin123` — separate, secure login for administrators; admin accounts cannot sign in through the user portal and vice versa.

## Features

| Area | What it does |
|---|---|
| Auth | Register / login with JWT, bcrypt passwords, USER and ADMIN roles |
| Waste segregation | Item classifier (“banana peel” → Organic / Green bin) plus per-type guide |
| Smart bins | Live fill levels, bin turns FULL at 85% and notifies admins |
| EcoPoints | Points per kg for correct bin (5–20 pts/kg by type); wrong bin earns 0 |
| Rewards | Redeem points for vouchers (stock-limited, unique code) |
| Leaderboard | Top 10 users by points |
| History | Point transactions and disposal log |
| Notifications | Points earned, wrong bin, voucher codes, full-bin alerts for admins |
| Admin dashboard | Tabbed hub: stats + waste chart, full CRUD for bins, users and rewards, waste-record management |
| Bin placement | Register bins at homes, shops or public locations with location, type, capacity and assigned household/area |
| Collections | Admins record collected waste (household, type, weight, bin, date); awards EcoPoints, updates bin fill, FULL at 85% |
| Household participation | Per-household collection counts, total weight and points, ranked |

## Run locally (dev)

Requires Node 20+.

```bash
# 1. point the backend at PostgreSQL — copy backend/.env.example to backend/.env and set:
#    DATABASE_URL=postgresql://user:password@host/database?sslmode=require
#    (free tier: https://console.neon.tech → Project → Connection Details → copy the string)
#    Leave DATABASE_URL empty to fall back to the local SQLite file.

# terminal 1: API on http://localhost:4000/graphql
cd backend && npm install && npm run start:dev

# terminal 2: UI on http://localhost:3000
cd frontend && npm install && npm run dev
```

The UI proxies GraphQL through `/api/graphql` to `BACKEND_URL` (default `http://localhost:4000/graphql`).

## Docker

Requires Docker. Compose bundles **PostgreSQL 16** as a service, so this runs the complete
stack — app, API, database and Prometheus:

```bash
docker compose up --build
```

- App: http://localhost:3000
- GraphQL playground: http://localhost:4000/graphql
- Prometheus: http://localhost:9090 (try `ecobin_waste_disposals_total`)
- Postgres: `localhost:5432` (user/pass/db `ecobin`, data in the `pg-data` volume)

Database data lives in Docker volumes; the SQLite fallback is only used if you explicitly empty
`DATABASE_URL`. To run the stack against a hosted database (e.g. Neon) instead of the bundled one,
export `DATABASE_URL` in your shell (or a `.env` next to docker-compose.yml) before `docker compose up`.

## Kubernetes (Minikube)

```bash
minikube start
eval $(minikube docker-env)                 # build images straight into Minikube
docker build -t ecobin-backend:latest ./backend
docker build -t ecobin-frontend:latest ./frontend
kubectl apply -f k8s/
kubectl get pods -n ecobin -w               # wait until Running

minikube service ecobin-frontend -n ecobin  # opens the app
minikube service prometheus -n ecobin       # opens Prometheus
```

Edit `JWT_SECRET` in `k8s/10-backend.yaml` before any real deployment, and set the `DATABASE_URL`
key in the `ecobin-secret` Secret to use hosted PostgreSQL (leave it empty to keep the PVC-backed
SQLite fallback). Without `DATABASE_URL` the backend runs one replica because SQLite sits on a
single persistent volume.

## CI/CD (GitHub Actions)

`.github/workflows/ci.yml` runs on every push and pull request to `main`:
1. Backend: install, build, unit tests
2. Frontend: install, production build
3. Docker: builds both images; on push to `main` pushes to `ghcr.io/<owner>/ecobin-{backend,frontend}:latest`

## Monitoring

- `GET /health` for liveness and readiness probes (used by Docker and Kubernetes)
- `GET /metrics` for Prometheus metrics: default Node metrics, HTTP request count and latency, and custom `ecobin_waste_disposals_total{waste_type,correct}`
- Prometheus is included in both `docker-compose.yml` and `k8s/30-monitoring.yaml`

## Project layout

```
backend/    NestJS + GraphQL + TypeORM (src/auth, src/ecobin, src/entities.ts)
frontend/   Next.js app router (app/(app)/* pages, components, lib)
k8s/        Minikube manifests
monitoring/ Prometheus config for Docker Compose
.github/    CI/CD workflow
```

## Quick API test

```bash
curl -s localhost:4000/graphql -H 'content-type: application/json' \
  -d '{"query":"mutation{login(email:\"demo@ecobin.com\",password:\"demo123\"){token user{name points}}}"}'
```
