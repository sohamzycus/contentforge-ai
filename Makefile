.PHONY: help build up down restart logs clean clean-all setup migrate backup restore

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

setup: ## Initial setup - copy .env file
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✅ .env file created. Please edit it with your API keys!"; \
		echo "   - Generate SECRET_KEY: openssl rand -hex 32"; \
		echo "   - Get ANTHROPIC_API_KEY from: https://console.anthropic.com/"; \
	else \
		echo "⚠️  .env file already exists"; \
	fi
	@mkdir -p data/postgres backups

build: ## Build all containers
	docker-compose build

up: ## Start all services
	@mkdir -p data/postgres backups
	docker-compose up

up-d: ## Start all services in detached mode
	@mkdir -p data/postgres backups
	docker-compose up -d

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## View logs from all services
	docker-compose logs -f

logs-backend: ## View backend logs
	docker-compose logs -f backend

logs-frontend: ## View frontend logs
	docker-compose logs -f frontend

logs-db: ## View database logs
	docker-compose logs -f db

migrate: ## Run database migrations
	docker-compose exec backend alembic upgrade head

migrate-create: ## Create a new migration (usage: make migrate-create MSG="description")
	docker-compose exec backend alembic revision --autogenerate -m "$(MSG)"

create-admin: ## Create admin user in the database
	docker-compose exec backend python create_admin_direct.py

shell-backend: ## Open shell in backend container
	docker-compose exec backend bash

shell-frontend: ## Open shell in frontend container
	docker-compose exec frontend sh

shell-db: ## Open PostgreSQL shell
	docker-compose exec db psql -U postgres -d contentforge

backup: ## Backup database to backups/ directory
	@mkdir -p backups
	@echo "Backing up database..."
	@docker-compose exec -T db pg_dump -U postgres contentforge > backups/contentforge_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✅ Backup saved to backups/"
	@ls -lh backups/*.sql | tail -1

restore: ## Restore database from backup (usage: make restore FILE=backups/xxx.sql)
	@if [ -z "$(FILE)" ]; then \
		echo "Usage: make restore FILE=backups/contentforge_YYYYMMDD_HHMMSS.sql"; \
		echo "Available backups:"; \
		ls -lh backups/*.sql 2>/dev/null || echo "  No backups found."; \
		exit 1; \
	fi
	@echo "⚠️  This will REPLACE the current database with $(FILE)"
	@read -p "Continue? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	@docker-compose exec -T db psql -U postgres -d contentforge < $(FILE)
	@echo "✅ Database restored from $(FILE)"

backup-auto: ## Automated backup with 7-day retention (cron-friendly)
	@mkdir -p backups
	@docker-compose exec -T db pg_dump -U postgres contentforge > backups/contentforge_$$(date +%Y%m%d_%H%M%S).sql
	@find backups/ -name "contentforge_*.sql" -mtime +7 -delete 2>/dev/null || true

clean: ## Remove containers and images (DATA PRESERVED in ./data/)
	@echo "WARNING: This removes containers and images. Database data in ./data/ is preserved."
	@read -p "Continue? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	docker-compose down --rmi all

clean-all: ## DANGEROUS: Remove everything including database data
	@echo "🚨 DANGER: This will DELETE ALL DATABASE DATA permanently."
	@read -p "Type 'DELETE' to confirm: " confirm && [ "$$confirm" = "DELETE" ] || exit 1
	docker-compose down --rmi all
	rm -rf ./data/postgres

dev: setup build up-d ## Complete development setup
	@echo ""
	@echo "🚀 Development environment is starting..."
	@echo ""
	@echo "Services will be available at:"
	@echo "  Frontend: http://localhost:3001"
	@echo "  Backend:  http://localhost:8002"
	@echo "  API Docs: http://localhost:8002/docs"
	@echo ""
	@echo "View logs with: make logs"
	@echo ""
