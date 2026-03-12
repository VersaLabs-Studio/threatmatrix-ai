# ═══════════════════════════════════════════════════════════════
# ThreatMatrix AI — Development Commands
# ═══════════════════════════════════════════════════════════════

.PHONY: dev-backend dev-frontend docker-up docker-down docker-logs test lint clean help

# ── Development ──────────────────────────────────────────────
dev-backend: ## Start FastAPI backend with hot reload
	cd backend && uvicorn app.main:app --reload --port 8000

dev-frontend: ## Start Next.js frontend dev server
	cd frontend && pnpm dev

# ── Docker ───────────────────────────────────────────────────
docker-up: ## Start PostgreSQL + Redis containers
	docker compose up -d postgres redis

docker-up-all: ## Start entire stack (PG + Redis + Backend + ML Worker)
	docker compose up -d --build

docker-down: ## Stop all containers
	docker compose down

docker-logs: ## Follow container logs
	docker compose logs -f

docker-ps: ## Show running containers
	docker compose ps

# ── Database ─────────────────────────────────────────────────
db-migrate: ## Run Alembic migrations
	cd backend && alembic upgrade head

db-revision: ## Create new Alembic migration (usage: make db-revision msg="description")
	cd backend && alembic revision --autogenerate -m "$(msg)"

db-reset: ## Drop and recreate database (DESTRUCTIVE)
	docker compose down -v postgres
	docker compose up -d postgres
	sleep 3
	cd backend && alembic upgrade head

# ── Testing ──────────────────────────────────────────────────
test: ## Run all backend tests
	cd backend && pytest tests/ -v

test-ml: ## Run ML model tests
	cd backend && pytest tests/ml/ -v

# ── Linting ──────────────────────────────────────────────────
lint: ## Lint both backend and frontend
	cd backend && ruff check .
	cd frontend && pnpm lint

lint-fix: ## Auto-fix lint issues
	cd backend && ruff check --fix .
	cd frontend && pnpm lint --fix

# ── ML ───────────────────────────────────────────────────────
train: ## Train all ML models
	cd backend && python -m ml.training.train_all

evaluate: ## Evaluate trained models
	cd backend && python -m ml.training.evaluate

# ── Utilities ────────────────────────────────────────────────
clean: ## Remove Python cache files
	find backend -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find backend -type f -name "*.pyc" -delete 2>/dev/null || true

# ── Help ─────────────────────────────────────────────────────
help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-18s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
