# 🚀 Docker Deployment Guide - Healthcare Platform

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Production Deployment](#production-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Deployment Strategies](#deployment-strategies)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Docker**: v24.0+ ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose**: v2.20+ (included with Docker Desktop)
- **Git**: For cloning the repository

### System Requirements (Production)
- **CPU**: 4+ cores recommended
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 20GB+ free space
- **OS**: Linux (Ubuntu 22.04 LTS recommended), macOS, or Windows with WSL2

### Cloud Platform Support
- AWS EC2, ECS, or EKS
- Google Cloud Platform (Compute Engine, GKE)
- Microsoft Azure (VM, AKS)
- DigitalOcean Droplets/Kubernetes
- Any VPS with Docker support

---

## Quick Start (Development)

### 1. Clone & Setup
```bash
git clone <repository-url>
cd healthcare-project
```

### 2. Create Environment File
```bash
# Copy the example environment file
cp .env.example .env

# Edit with your values
nano .env  # or use your preferred editor
```

### 3. Build & Run
```bash
# Build all containers
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **ML Service**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### 5. Stop Services
```bash
# Stop all containers
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

---

## Production Deployment

### Step 1: Prepare Environment

Create a production `.env` file:

```bash
# Production MongoDB (MongoDB Atlas recommended)
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/healthcare_prod?retryWrites=true&w=majority

# Strong JWT Secret (generate with: openssl rand -base64 64)
JWT_SECRET=your-production-jwt-secret-min-32-chars

# JWT Expiration
JWT_EXPIRES_IN=7d

# CORS - Your production domain
CORS_ORIGIN=https://yourdomain.com

# Frontend URLs - Your production domain
VITE_API_URL=https://yourdomain.com/api
VITE_SOCKET_URL=https://yourdomain.com
```

### Step 2: Build Production Images

```bash
# Build with production configuration
docker-compose -f docker-compose.prod.yml build --no-cache

# Tag images for registry (optional)
docker tag healthcare-client:latest your-registry/healthcare-client:v1.0.0
docker tag healthcare-server:latest your-registry/healthcare-server:v1.0.0
docker tag healthcare-ml-service:latest your-registry/healthcare-ml-service:v1.0.0
```

### Step 3: Deploy

#### Option A: Single Server Deployment
```bash
# Start production services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

#### Option B: Docker Swarm (Scalable)
```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.prod.yml healthcare

# Check services
docker stack services healthcare

# Scale services
docker service scale healthcare_server=3 healthcare_ml-service=2
```

#### Option C: Kubernetes
```bash
# Convert to Kubernetes manifests
kompose convert -f docker-compose.prod.yml

# Apply to cluster
kubectl apply -f .

# Check status
kubectl get pods -n healthcare
```

### Step 4: Setup Reverse Proxy (Nginx/Traefik)

#### Nginx Configuration Example
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/ssl/certs/yourdomain.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 5: SSL Certificate Setup

#### Using Let's Encrypt (Certbot)
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal (add to crontab)
0 0 * * * certbot renew --quiet
```

---

## Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secret-min-32-chars` |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `CORS_ORIGIN` | Allowed frontend origin | `https://yourdomain.com` |
| `VITE_API_URL` | Backend API URL | `https://yourdomain.com/api` |
| `VITE_SOCKET_URL` | WebSocket URL | `https://yourdomain.com` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Node environment | `production` |
| `LOG_LEVEL` | Logging level | `INFO` |
| `WORKERS` | ML service workers | `4` |

---

## Deployment Strategies

### Rolling Updates

```bash
# Update single service
docker-compose -f docker-compose.prod.yml up -d --no-deps --build server

# Zero-downtime update with Docker Swarm
docker service update --image healthcare-server:v2.0.0 healthcare_server
```

### Blue-Green Deployment

```bash
# Deploy green environment
docker-compose -f docker-compose.prod.yml -p healthcare-green up -d

# Test green environment
# Switch traffic (update reverse proxy)

# Remove blue environment
docker-compose -p healthcare-blue down
```

### Backup Before Deployment

```bash
# Backup database (MongoDB Atlas auto-backups recommended)
# Backup environment files
cp .env .env.backup.$(date +%Y%m%d)

# Backup volumes
docker run --rm -v healthcare_ml-logs:/data -v $(pwd):/backup \
  alpine tar czf /backup/ml-logs-backup.tar.gz -C /data .
```

---

## Monitoring & Maintenance

### Health Checks

```bash
# Check all services
docker-compose -f docker-compose.prod.yml ps

# Check individual service health
docker inspect --format='{{.State.Health.Status}}' healthcare-server-prod

# View health check logs
docker inspect --format='{{json .State.Health}}' healthcare-server-prod | jq
```

### Log Management

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f server

# View last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100 server

# Export logs
docker-compose -f docker-compose.prod.yml logs --no-color > logs_$(date +%Y%m%d).txt
```

### Resource Monitoring

```bash
# Monitor resource usage
docker stats

# Check disk usage
docker system df

# Clean up unused resources
docker system prune -a --volumes
```

### Automated Monitoring Setup

Use **Prometheus + Grafana** for comprehensive monitoring:

```yaml
# Add to docker-compose.prod.yml
prometheus:
  image: prom/prometheus:latest
  ports:
    - "9090:9090"
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
    
grafana:
  image: grafana/grafana:latest
  ports:
    - "3001:3000"
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=admin
```

---

## Troubleshooting

### Common Issues

#### 1. Container Won't Start
```bash
# Check logs
docker-compose logs service-name

# Check container status
docker-compose ps

# Restart service
docker-compose restart service-name
```

#### 2. Port Already in Use
```bash
# Find process using port
lsof -i :5000  # Linux/Mac
netstat -ano | findstr :5000  # Windows

# Kill process or change port in docker-compose.yml
```

#### 3. Database Connection Issues
```bash
# Verify MONGODB_URI in .env
# Check network connectivity
docker-compose exec server ping ml-service

# Test MongoDB connection
docker-compose exec server node -e "console.log(process.env.MONGODB_URI)"
```

#### 4. Model Files Not Found
```bash
# Verify model files exist
ls -la *.pkl

# Check volume mounts
docker-compose config | grep volumes -A 5

# Copy models if needed
docker cp xgboost_icu_model.pkl healthcare-ml-service-prod:/app/models/
```

#### 5. Build Failures
```bash
# Clean build cache
docker-compose build --no-cache

# Remove old images
docker rmi $(docker images -f "dangling=true" -q)

# Check disk space
df -h
```

### Debug Mode

Enable debug logging:

```bash
# Set in .env
LOG_LEVEL=DEBUG

# Restart services
docker-compose restart
```

---

## Security Best Practices

1. **Never commit .env files** - Use `.env.example` as template
2. **Use strong JWT secrets** - Generate with `openssl rand -base64 64`
3. **Enable HTTPS** - Use Let's Encrypt certificates
4. **Regular updates** - Keep Docker images updated
5. **Network isolation** - Use Docker networks
6. **Resource limits** - Set CPU/memory limits
7. **Security scanning** - Use `docker scan` or Trivy
8. **Secrets management** - Consider Docker Secrets or HashiCorp Vault
9. **Firewall rules** - Only expose necessary ports
10. **Regular backups** - Automate database and volume backups

### Security Scanning

```bash
# Scan images for vulnerabilities
docker scan healthcare-server:latest
docker scan healthcare-ml-service:latest
docker scan healthcare-client:latest
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build images
        run: docker-compose -f docker-compose.prod.yml build
      
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker-compose -f docker-compose.prod.yml push
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /opt/healthcare
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml up -d
```

---

## Backup & Recovery

### Automated Backup Script

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/healthcare/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup environment
cp .env $BACKUP_DIR/

# Backup volumes
docker run --rm -v healthcare_ml-logs:/data -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/ml-logs.tar.gz -C /data .

# Backup database (if using local MongoDB)
# docker-compose exec -T mongodb mongodump --archive > $BACKUP_DIR/mongodb.archive

echo "Backup completed: $BACKUP_DIR"
```

### Recovery

```bash
# Restore environment
cp /backups/healthcare/DATE/.env .env

# Restore volumes
tar xzf /backups/healthcare/DATE/ml-logs.tar.gz -C /var/lib/docker/volumes/healthcare_ml-logs/_data/

# Restart services
docker-compose -f docker-compose.prod.yml up -d
```

---

## Support & Resources

- **Documentation**: [Project README](../README.md)
- **Docker Docs**: https://docs.docker.com/
- **Docker Compose**: https://docs.docker.com/compose/
- **Best Practices**: https://docs.docker.com/develop/dev-best-practices/

---

## Quick Reference Commands

```bash
# Start all services
docker-compose up -d

# Start production
docker-compose -f docker-compose.prod.yml up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild specific service
docker-compose up -d --no-deps --build server

# Execute command in container
docker-compose exec server sh

# Check service health
docker-compose ps

# Monitor resources
docker stats

# Clean up
docker system prune -a --volumes
```

---

**Last Updated**: February 2026
**Version**: 1.0.0
