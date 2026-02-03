#!/bin/bash

# Healthcare Platform - Production Deployment Script
# This script automates the deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="healthcare"
COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}Healthcare Platform - Deployment${NC}"
echo -e "${GREEN}======================================${NC}"

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose are installed${NC}"

# Check for .env file
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    echo -e "${YELLOW}Please copy .env.production to .env and configure it${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Environment file found${NC}"

# Check for required model files
echo -e "\n${YELLOW}Checking for ML model files...${NC}"
REQUIRED_MODELS=("xgboost_icu_model.pkl" "scaler.pkl" "label_encoders.pkl")
MISSING_MODELS=()

for model in "${REQUIRED_MODELS[@]}"; do
    if [ ! -f "$model" ]; then
        MISSING_MODELS+=("$model")
    fi
done

if [ ${#MISSING_MODELS[@]} -ne 0 ]; then
    echo -e "${YELLOW}Warning: Missing model files:${NC}"
    for model in "${MISSING_MODELS[@]}"; do
        echo -e "  - $model"
    done
    echo -e "${YELLOW}ML service may not function properly${NC}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✓ All model files present${NC}"
fi

# Create backup
echo -e "\n${YELLOW}Creating backup...${NC}"
mkdir -p "$BACKUP_DIR"
cp .env "$BACKUP_DIR/.env.backup"

# Backup volumes if they exist
if docker volume ls | grep -q "${PROJECT_NAME}_ml-logs"; then
    docker run --rm \
        -v ${PROJECT_NAME}_ml-logs:/data \
        -v "$(pwd)/$BACKUP_DIR":/backup \
        alpine tar czf /backup/ml-logs.tar.gz -C /data . 2>/dev/null || true
fi

echo -e "${GREEN}✓ Backup created at $BACKUP_DIR${NC}"

# Pull latest code (if in git repo)
if [ -d .git ]; then
    echo -e "\n${YELLOW}Pulling latest code...${NC}"
    git pull
    echo -e "${GREEN}✓ Code updated${NC}"
fi

# Build images
echo -e "\n${YELLOW}Building Docker images...${NC}"
docker-compose -f "$COMPOSE_FILE" build --no-cache

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Images built successfully${NC}"
else
    echo -e "${RED}Error: Build failed${NC}"
    exit 1
fi

# Stop old containers
echo -e "\n${YELLOW}Stopping old containers...${NC}"
docker-compose -f "$COMPOSE_FILE" down

# Start new containers
echo -e "\n${YELLOW}Starting new containers...${NC}"
docker-compose -f "$COMPOSE_FILE" up -d

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Containers started${NC}"
else
    echo -e "${RED}Error: Failed to start containers${NC}"
    echo -e "${YELLOW}Rolling back...${NC}"
    
    # Restore from backup if available
    if [ -f "$BACKUP_DIR/.env.backup" ]; then
        cp "$BACKUP_DIR/.env.backup" .env
    fi
    
    exit 1
fi

# Wait for services to be healthy
echo -e "\n${YELLOW}Waiting for services to be healthy...${NC}"
sleep 10

# Check service health
echo -e "\n${YELLOW}Checking service health...${NC}"
SERVICES=("${PROJECT_NAME}-ml-service-prod" "${PROJECT_NAME}-server-prod" "${PROJECT_NAME}-client-prod")

for service in "${SERVICES[@]}"; do
    HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$service" 2>/dev/null || echo "no health check")
    
    if [ "$HEALTH" = "healthy" ] || [ "$HEALTH" = "no health check" ]; then
        STATUS=$(docker inspect --format='{{.State.Status}}' "$service")
        if [ "$STATUS" = "running" ]; then
            echo -e "${GREEN}✓ $service is running${NC}"
        else
            echo -e "${RED}✗ $service is not running (status: $STATUS)${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ $service health: $HEALTH${NC}"
    fi
done

# Display running containers
echo -e "\n${YELLOW}Running containers:${NC}"
docker-compose -f "$COMPOSE_FILE" ps

# Show logs
echo -e "\n${YELLOW}Recent logs (last 20 lines):${NC}"
docker-compose -f "$COMPOSE_FILE" logs --tail=20

# Cleanup old images
echo -e "\n${YELLOW}Cleaning up old images...${NC}"
docker image prune -f

# Final status
echo -e "\n${GREEN}======================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}======================================${NC}"
echo -e "\n${YELLOW}Access your application:${NC}"
echo -e "  Frontend: http://localhost:3000"
echo -e "  Backend:  http://localhost:5000/api"
echo -e "  ML API:   http://localhost:8000"
echo -e "\n${YELLOW}Useful commands:${NC}"
echo -e "  View logs:    docker-compose -f $COMPOSE_FILE logs -f"
echo -e "  Stop:         docker-compose -f $COMPOSE_FILE down"
echo -e "  Restart:      docker-compose -f $COMPOSE_FILE restart"
echo -e "  Status:       docker-compose -f $COMPOSE_FILE ps"
echo -e "\n${YELLOW}Backup location:${NC} $BACKUP_DIR"
