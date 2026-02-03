#!/bin/bash

# Healthcare Platform - Health Monitoring Script
# Checks the health of all services and sends alerts if needed

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SERVICES=("healthcare-server-prod" "healthcare-ml-service-prod" "healthcare-client-prod")
ENDPOINTS=("http://localhost:5000/api/health" "http://localhost:8000/health" "http://localhost:3000/health")
MAX_RETRIES=3
RETRY_DELAY=5

# Alert configuration (optional)
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"
EMAIL="${ALERT_EMAIL:-}"

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}   Healthcare Platform Health Check     ${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo

# Function to check container health
check_container_health() {
    local container=$1
    local status=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null || echo "not found")
    local health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "no healthcheck")
    
    echo -ne "  ${YELLOW}Container${NC} $container: "
    
    if [ "$status" = "running" ]; then
        if [ "$health" = "healthy" ] || [ "$health" = "no healthcheck" ]; then
            echo -e "${GREEN}✓ Running${NC}"
            return 0
        elif [ "$health" = "starting" ]; then
            echo -e "${YELLOW}⏳ Starting${NC}"
            return 1
        else
            echo -e "${RED}✗ Unhealthy${NC}"
            return 1
        fi
    else
        echo -e "${RED}✗ $status${NC}"
        return 1
    fi
}

# Function to check HTTP endpoint
check_endpoint() {
    local url=$1
    local name=$2
    
    echo -ne "  ${YELLOW}Endpoint${NC} $name: "
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✓ Responding (200)${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed (HTTP $response)${NC}"
        return 1
    fi
}

# Function to send Slack notification
send_slack_alert() {
    local message=$1
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"⚠️ Healthcare Platform Alert: $message\"}" \
            "$SLACK_WEBHOOK" 2>/dev/null || true
    fi
}

# Function to send email alert
send_email_alert() {
    local message=$1
    if [ -n "$EMAIL" ]; then
        echo "$message" | mail -s "Healthcare Platform Alert" "$EMAIL" 2>/dev/null || true
    fi
}

# Main health check
echo -e "${YELLOW}Checking Docker containers...${NC}"
echo

ALL_HEALTHY=true
FAILED_SERVICES=()

# Check each container
for service in "${SERVICES[@]}"; do
    if ! check_container_health "$service"; then
        ALL_HEALTHY=false
        FAILED_SERVICES+=("$service")
    fi
done

echo
echo -e "${YELLOW}Checking HTTP endpoints...${NC}"
echo

# Check endpoints
ENDPOINT_NAMES=("Server API" "ML Service" "Client")
for i in "${!ENDPOINTS[@]}"; do
    if ! check_endpoint "${ENDPOINTS[$i]}" "${ENDPOINT_NAMES[$i]}"; then
        ALL_HEALTHY=false
        FAILED_SERVICES+=("${ENDPOINT_NAMES[$i]}")
    fi
done

# Check resource usage
echo
echo -e "${YELLOW}Resource Usage:${NC}"
echo

for service in "${SERVICES[@]}"; do
    if [ "$(docker inspect --format='{{.State.Status}}' "$service" 2>/dev/null)" = "running" ]; then
        STATS=$(docker stats "$service" --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | tail -n 1)
        echo "  $STATS"
    fi
done

# Check Docker system
echo
echo -e "${YELLOW}Docker System:${NC}"
DISK_USAGE=$(docker system df --format "table {{.Type}}\t{{.TotalCount}}\t{{.Size}}\t{{.Reclaimable}}" | tail -n +2)
echo "$DISK_USAGE" | while read line; do
    echo "  $line"
done

# Network connectivity check
echo
echo -e "${YELLOW}Network Connectivity:${NC}"
echo

if docker network inspect healthcare-network &>/dev/null; then
    echo -e "  ${GREEN}✓ healthcare-network exists${NC}"
    CONTAINERS=$(docker network inspect healthcare-network --format '{{range .Containers}}{{.Name}} {{end}}')
    echo "  Connected containers: $CONTAINERS"
else
    echo -e "  ${RED}✗ healthcare-network not found${NC}"
    ALL_HEALTHY=false
fi

# Final status
echo
echo -e "${BLUE}════════════════════════════════════════${NC}"

if [ "$ALL_HEALTHY" = true ]; then
    echo -e "${GREEN}✓ All services are healthy!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some services are unhealthy${NC}"
    echo
    echo -e "${YELLOW}Failed services:${NC}"
    for service in "${FAILED_SERVICES[@]}"; do
        echo -e "  - $service"
    done
    
    # Send alerts
    ALERT_MSG="Healthcare Platform: Failed services - ${FAILED_SERVICES[*]}"
    send_slack_alert "$ALERT_MSG"
    send_email_alert "$ALERT_MSG"
    
    echo
    echo -e "${YELLOW}Suggested actions:${NC}"
    echo "  1. Check logs: docker-compose logs -f"
    echo "  2. Restart services: docker-compose restart"
    echo "  3. Check .env configuration"
    echo "  4. Verify database connectivity"
    
    exit 1
fi
