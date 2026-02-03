# 🐳 Docker Quick Reference

## Quick Commands

### Development
```bash
# Quick start (recommended for first time)
./start.sh          # Linux/Mac
start.bat           # Windows

# Or use Make
make up             # Start services
make logs           # View logs
make down           # Stop services

# Or use Docker Compose directly
docker-compose up -d
docker-compose logs -f
docker-compose down
```

### Production
```bash
# Deploy to production
./deploy.sh         # Linux/Mac
deploy.bat          # Windows

# Or use Make
make prod-deploy

# Or use Docker Compose directly
docker-compose -f docker-compose.prod.yml up -d
```

## Service URLs

| Service | Development | Production |
|---------|-------------|------------|
| Frontend | http://localhost:3000 | http://yourdomain.com |
| Backend API | http://localhost:5000/api | https://yourdomain.com/api |
| ML Service | http://localhost:8000 | Internal only |
| API Docs | http://localhost:8000/docs | Internal only |

## Container Architecture

```
┌─────────────────────────────────────────────┐
│           Healthcare Platform               │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  Client  │  │  Server  │  │    ML    │ │
│  │  (React) │◄─┤ (Express)│◄─┤ Service  │ │
│  │  :3000   │  │  :5000   │  │  :8000   │ │
│  └──────────┘  └──────────┘  └──────────┘ │
│       │             │              │       │
│       └─────────────┴──────────────┘       │
│                     │                      │
│            healthcare-network             │
│                     │                      │
│              ┌──────────────┐             │
│              │   MongoDB    │             │
│              │  (Atlas/DB)  │             │
│              └──────────────┘             │
└─────────────────────────────────────────────┘
```

## Files Overview

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Development configuration |
| `docker-compose.prod.yml` | Production configuration |
| `client/Dockerfile` | Frontend container build |
| `server/Dockerfile` | Backend container build |
| `ml-service/Dockerfile` | ML service container build |
| `.dockerignore` | Files to exclude from build |
| `deploy.sh/bat` | Automated deployment script |
| `start.sh/bat` | Quick start script |
| `Makefile` | Simplified commands |

## Environment Setup

1. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your values:**
   ```bash
   # Required
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   
   # Optional (has defaults)
   CORS_ORIGIN=http://localhost:3000
   VITE_API_URL=http://localhost:5000/api
   ```

3. **Place ML model files in root:**
   - `xgboost_icu_model.pkl`
   - `scaler.pkl`
   - `label_encoders.pkl`

## Common Operations

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f server
docker-compose logs -f client
docker-compose logs -f ml-service

# Last 100 lines
docker-compose logs --tail=100 server
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart one service
docker-compose restart server
```

### Execute Commands in Container
```bash
# Server shell
docker-compose exec server sh

# ML service shell
docker-compose exec ml-service sh

# Run Node command
docker-compose exec server node -e "console.log('Hello')"

# Run Python command
docker-compose exec ml-service python -c "print('Hello')"
```

### Check Service Health
```bash
# Container status
docker-compose ps

# Health check status
docker inspect --format='{{.State.Health.Status}}' healthcare-server

# Test endpoints
curl http://localhost:5000/api/health
curl http://localhost:8000/health
```

### Resource Monitoring
```bash
# Real-time stats
docker stats

# Specific containers
docker stats healthcare-server healthcare-ml-service

# Disk usage
docker system df
```

### Rebuild After Code Changes
```bash
# Rebuild and restart specific service
docker-compose up -d --no-deps --build server

# Rebuild all
docker-compose build --no-cache
docker-compose up -d
```

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker-compose logs service-name

# Check configuration
docker-compose config

# Validate compose file
docker-compose -f docker-compose.yml config
```

### Port Already in Use
```bash
# Find process (Linux/Mac)
lsof -i :5000

# Find process (Windows)
netstat -ano | findstr :5000

# Change port in docker-compose.yml
ports:
  - "5001:5000"  # Use different external port
```

### Database Connection Issues
```bash
# Check environment variables
docker-compose exec server env | grep MONGODB

# Test network connectivity
docker-compose exec server ping ml-service

# Check MongoDB connection
docker-compose exec server node -e "console.log(process.env.MONGODB_URI)"
```

### Model Files Not Found
```bash
# Verify files exist
ls -la *.pkl

# Check volume mounts
docker-compose config | grep volumes -A 5

# Copy files to container
docker cp xgboost_icu_model.pkl healthcare-ml-service:/app/models/
```

### Out of Space
```bash
# Clean up
docker system prune -a --volumes

# Remove specific images
docker rmi $(docker images -f "dangling=true" -q)

# Remove stopped containers
docker container prune
```

### Permission Issues (Linux)
```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# Run Docker without sudo (add user to docker group)
sudo usermod -aG docker $USER
newgrp docker
```

## Production Checklist

- [ ] Configure `.env` with production values
- [ ] Set strong `JWT_SECRET` (min 32 chars)
- [ ] Use MongoDB Atlas or secure MongoDB instance
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure firewall rules
- [ ] Set up domain and DNS
- [ ] Enable monitoring (Prometheus/Grafana)
- [ ] Configure backup strategy
- [ ] Set resource limits appropriately
- [ ] Review security settings
- [ ] Enable logging aggregation
- [ ] Test health check endpoints
- [ ] Configure CI/CD pipeline
- [ ] Document deployment procedures

## Resource Limits

### Development (docker-compose.yml)
- **Server**: 512MB RAM, 1 CPU
- **ML Service**: 2GB RAM, 2 CPUs
- **Client**: 128MB RAM, 0.5 CPU

### Production (docker-compose.prod.yml)
- **Server**: 1GB RAM, 1 CPU (scalable to 2 replicas)
- **ML Service**: 3GB RAM, 2 CPUs (scalable to 2 replicas)
- **Client**: 256MB RAM, 0.5 CPU (scalable to 2 replicas)

Adjust in `docker-compose*.yml`:
```yaml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 512M
```

## Scaling Services

### Docker Compose (limited scaling)
```bash
# Scale to 3 instances
docker-compose up -d --scale server=3
```

### Docker Swarm (recommended for production)
```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.prod.yml healthcare

# Scale services
docker service scale healthcare_server=3
docker service scale healthcare_ml-service=2

# Check status
docker stack services healthcare
docker service ls
docker service ps healthcare_server
```

## Backup & Recovery

### Backup
```bash
# Environment
cp .env backups/.env.$(date +%Y%m%d)

# Volumes
docker run --rm -v healthcare_ml-logs:/data -v $(pwd):/backup \
  alpine tar czf /backup/ml-logs-backup.tar.gz -C /data .

# Database (if local MongoDB)
docker-compose exec -T mongodb mongodump --archive > backup.archive
```

### Restore
```bash
# Environment
cp backups/.env.20260203 .env

# Volumes
tar xzf ml-logs-backup.tar.gz -C /var/lib/docker/volumes/healthcare_ml-logs/_data/

# Database
docker-compose exec -T mongodb mongorestore --archive < backup.archive
```

## Security Best Practices

1. **Never commit `.env` files** - Use `.env.example` as template
2. **Use secrets management** - Consider Docker Secrets or HashiCorp Vault
3. **Regular updates** - Keep base images updated
4. **Scan for vulnerabilities** - Use `docker scan` or Trivy
5. **Minimal base images** - Use Alpine Linux variants
6. **Non-root users** - Containers run as non-root users
7. **Network isolation** - Services on private network
8. **Resource limits** - Prevent resource exhaustion
9. **Read-only filesystems** - Where possible
10. **Regular backups** - Automate backup procedures

## Additional Resources

- 📖 [Full Deployment Guide](DOCKER_DEPLOYMENT.md)
- 📚 [Docker Documentation](https://docs.docker.com/)
- 🐙 [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- 🔒 [Docker Security](https://docs.docker.com/engine/security/)

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Verify environment: `docker-compose config`
3. Review documentation: `DOCKER_DEPLOYMENT.md`
4. Check service health: `docker-compose ps`
