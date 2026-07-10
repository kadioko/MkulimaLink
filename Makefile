.PHONY: help install dev backend frontend test lint seed docker-up docker-down docker-logs deploy

help:
	@echo "MkulimaLink development commands:"
	@echo "  make install      Install all dependencies (root, backend, frontend)"
	@echo "  make dev          Start backend and frontend dev servers"
	@echo "  make backend      Start backend dev server"
	@echo "  make frontend     Start frontend dev server"
	@echo "  make test         Run all tests"
	@echo "  make test-backend Run backend tests"
	@echo "  make lint         Run linters"
	@echo "  make seed         Seed local database"
	@echo "  make docker-up    Start local MongoDB and Redis via Docker"
	@echo "  make docker-down  Stop local Docker services"
	@echo "  make deploy       Deploy backend and frontend (requires setup)"

install:
	npm install
	cd backend && npm install
	cd frontend && npm install

dev: docker-up
	@echo "Starting backend and frontend..."
	cd backend && npm run dev &
	cd frontend && npm start

backend: docker-up
	cd backend && npm run dev

frontend:
	cd frontend && npm start

test:
	cd backend && npm test
	cd frontend && npm test

test-backend:
	cd backend && npm test

lint:
	cd backend && npm run lint || true
	cd frontend && npm run lint || true

seed:
	curl -X POST http://localhost:5000/api/seed/run \
		-H "Content-Type: application/json" \
		-d '{"secret": "mkulima-seed-2024"}'

docker-up:
	docker compose -f docker-compose.dev.yml up -d

docker-down:
	docker compose -f docker-compose.dev.yml down

docker-logs:
	docker compose -f docker-compose.dev.yml logs -f

deploy:
	@echo "Deploying backend and frontend..."
	cd backend && npm run deploy || true
	cd frontend && npm run deploy || true
