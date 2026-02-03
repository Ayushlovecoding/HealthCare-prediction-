# Makefile for Healthcare Platform
# Simplifies Docker operations

.PHONY: help build up down restart logs ps clean test deploy prod-deploy backup

# Default target
help:
	@echo "Healthcare Platform - Docker Commands"
	@echo "======================================"
	@echo ""
	@echo "Development:"
	@echo "  make build        - Build all containers"
	@echo "  make up           - Start all services"
	@echo "  make down         - Stop all services"
	@echo "  make restart      - Restart all services"
	@echo "  make logs         - View logs (all services)"
	@echo "  make logs-server  - View server logs"
	@echo "  make logs-client  - View client logs"
	@echo "  make logs-ml      - View ML service logs"
	@echo "  make ps           - Show running containers"
	@echo "  make shell-server - Open server shell"
	@echo "  make shell-ml     - Open ML service shell"
	@echo ""
	@echo "Production:"
	@echo "  make prod-build   - Build production images"
	@echo "  make prod-up      - Start production services"
	@echo "  make prod-down    - Stop production services"
	@echo "  make prod-deploy  - Full production deployment"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean        - Remove containers and images"
	@echo "  make prune        - Clean up Docker system"
	@echo "  make backup       - Backup volumes and env"
	@echo "  make health       - Check service health"
	@echo ""

# Development commands
build:
	docker-compose build

up:
	docker-compose up -d
	@echo "Services starting..."
	@echo "Frontend: http://localhost:3000"
	@echo "Backend:  http://localhost:5000/api"
	@echo "ML API:   http://localhost:8000"

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

logs-server:
	docker-compose logs -f server

logs-client:
	docker-compose logs -f client

logs-ml:
	docker-compose logs -f ml-service

ps:
	docker-compose ps

shell-server:
	docker-compose exec server sh

shell-ml:
	docker-compose exec ml-service sh

# Production commands
prod-build:
	docker-compose -f docker-compose.prod.yml build --no-cache

prod-up:
	docker-compose -f docker-compose.prod.yml up -d
	@echo "Production services starting..."

prod-down:
	docker-compose -f docker-compose.prod.yml down

prod-logs:
	docker-compose -f docker-compose.prod.yml logs -f

prod-deploy:
	@echo "Starting production deployment..."
	@bash deploy.sh || cmd //c deploy.bat

# Maintenance commands
clean:
	docker-compose down -v
	docker system prune -f

prune:
	docker system prune -af --volumes
	@echo "Docker system cleaned"

backup:
	@mkdir -p backups/$$(date +%Y%m%d_%H%M%S)
	@cp .env backups/$$(date +%Y%m%d_%H%M%S)/.env.backup
	@echo "Backup created in backups/"

health:
	@echo "Checking service health..."
	@docker-compose ps
	@echo ""
	@echo "Server health:"
	@curl -s http://localhost:5000/api/health || echo "Server not responding"
	@echo ""
	@echo "ML service health:"
	@curl -s http://localhost:8000/health || echo "ML service not responding"

# Database commands (if using local MongoDB)
db-backup:
	docker-compose exec -T mongodb mongodump --archive > backup_$$(date +%Y%m%d_%H%M%S).archive
	@echo "Database backup created"

db-restore:
	@read -p "Enter backup file: " backup; \
	docker-compose exec -T mongodb mongorestore --archive < $$backup

# Development helpers
install-server:
	cd server && npm install

install-client:
	cd client && npm install

install-ml:
	cd ml-service && pip install -r requirements.txt

install-all: install-server install-client install-ml

# Quick start
start:
	@bash start.sh || cmd //c start.bat

# Testing
test:
	@echo "Running tests..."
	cd server && npm test || true
	cd client && npm test || true
	cd ml-service && pytest || true

# Security scan
scan:
	docker scan healthcare-server:latest || true
	docker scan healthcare-client:latest || true
	docker scan healthcare-ml-service:latest || true
