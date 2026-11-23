# Workfora

Modern, enterprise-grade Human Resource Management System (HRMS).

**Stack:** React + TypeScript + Vite + Mantine + TanStack Query/Table/Form · Java 21 + Spring Boot + Security + JPA + Flyway · PostgreSQL (Docker) or H2 for local profile.

## Quick start

### Prerequisites

- Java 21+
- Node.js 20+
- Maven 3.9+ (or use `backend/mvnw`)
- Optional: Docker for PostgreSQL

### 1. Backend

```bash
cd backend
# Local profile uses embedded H2 (no Docker required)
./mvnw spring-boot:run
# Windows: mvnw.cmd spring-boot:run
```

API: `http://localhost:8080`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173` (proxies `/api` → backend)

### Demo users

| Email | Password | Role |
|-------|----------|------|
| `admin@workfora.com` | `Admin123!` | Super Administrator |
| `manager@workfora.com` | `Admin123!` | Department Manager |
| `employee@workfora.com` | `Admin123!` | Employee |

## PostgreSQL (optional)

```bash
docker compose up -d
```

Then run the backend with:

```bash
# Windows PowerShell
$env:SPRING_PROFILES_ACTIVE="postgres"
./mvnw spring-boot:run
```

Credentials default to `workfora` / `workfora` on database `workfora` (see `docker-compose.yml` and `application-postgres.yml`).

## Architecture

```
workfora/
  backend/     Spring Boot modular monolith (package-by-domain)
  frontend/    Feature-based React SPA
  docker-compose.yml
```

- REST API under `/api/v1`
- JWT access token (Bearer) + httpOnly refresh cookie
- RBAC enforced on the backend (`@PreAuthorize` + permission codes)
- Flyway migrations in `backend/src/main/resources/db/migration`
- Frontend feature modules own pages, hooks, schemas, and API calls

## Main modules

Dashboard · Employees · Organization · Attendance · Leave · Recruitment · Onboarding · Payroll · Performance · Assets · Notifications · Reports

## Scripts

| Area | Command | Purpose |
|------|---------|---------|
| Backend | `./mvnw test` | Integration tests |
| Backend | `./mvnw -DskipTests package` | Build JAR |
| Frontend | `npm run build` | Typecheck + production build |
| Frontend | `npm run lint` | ESLint |

## Configuration

Secrets and environment (never commit real secrets):

- `JWT_SECRET`
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `CORS_ORIGINS`
- `DOCUMENTS_PATH`

Local defaults live in `application-local.yml` (H2 file DB under `backend/data/`).

## Security notes

- Passwords hashed with BCrypt
- Refresh tokens stored as SHA-256 hashes and rotated
- Employee lists are always server-paginated
- Method-level authorization on mutating and sensitive endpoints
