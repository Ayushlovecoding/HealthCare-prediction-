#!/bin/bash

# Healthcare Platform - Quick Start Script
# Quickly spin up the development environment

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Healthcare Platform - Quick Start    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}⚠ Please edit .env with your configuration${NC}"
    echo
fi

# Check for model files
echo -e "${YELLOW}Checking for ML model files...${NC}"
if [ ! -f "xgboost_icu_model.pkl" ]; then
    echo -e "${YELLOW}⚠ Warning: Model files not found${NC}"
    echo -e "${YELLOW}  The application will run, but ML predictions may not work${NC}"
    echo -e "${YELLOW}  Place your model files (.pkl) in the root directory${NC}"
    echo
fi

# Start services
echo -e "${YELLOW}Starting services...${NC}"
docker-compose up -d

echo
echo -e "${GREEN}✓ Services starting...${NC}"
echo

# Wait for services
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 15

# Check status
echo
echo -e "${YELLOW}Service Status:${NC}"
docker-compose ps

echo
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         🎉 Ready to Go! 🎉            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo
echo -e "${YELLOW}Access your application:${NC}"
echo -e "  🌐 Frontend:  http://localhost:3000"
echo -e "  🔌 Backend:   http://localhost:5000/api"
echo -e "  🤖 ML API:    http://localhost:8000"
echo -e "  📚 API Docs:  http://localhost:8000/docs"
echo
echo -e "${YELLOW}Useful commands:${NC}"
echo -e "  📋 View logs:     docker-compose logs -f"
echo -e "  🔄 Restart:       docker-compose restart"
echo -e "  🛑 Stop:          docker-compose down"
echo -e "  📊 Status:        docker-compose ps"
echo
echo -e "${GREEN}Happy coding! 🚀${NC}"
