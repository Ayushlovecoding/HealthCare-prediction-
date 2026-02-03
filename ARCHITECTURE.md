# 🏗️ Healthcare Platform - Docker Architecture

## Complete System Architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│                         Production Deployment                          │
└───────────────────────────────────────────────────────────────────────┘

                              Internet
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   Load Balancer /      │
                    │   Reverse Proxy        │
                    │   (Nginx / Traefik)    │
                    │   :80 / :443 (HTTPS)   │
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │    Docker Network       │
                    │  healthcare-network     │
                    │   (172.20.0.0/16)       │
                    └────────────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│  Client       │      │  Server       │      │  ML Service   │
│  Container    │◀────▶│  Container    │◀────▶│  Container    │
│  (Nginx)      │      │  (Node.js)    │      │  (Python)     │
│               │      │               │      │               │
│  Port: 3000   │      │  Port: 5000   │      │  Port: 8000   │
│  (external)   │      │  (external)   │      │  (internal)   │
│               │      │               │      │               │
│  Resources:   │      │  Resources:   │      │  Resources:   │
│  CPU: 0.5     │      │  CPU: 1       │      │  CPU: 2       │
│  RAM: 256M    │      │  RAM: 1G      │      │  RAM: 3G      │
│               │      │               │      │               │
│  Replicas: 2  │      │  Replicas: 2  │      │  Replicas: 2  │
└───────────────┘      └───────────────┘      └───────────────┘
        │                      │                      │
        │                      ▼                      │
        │              ┌───────────────┐              │
        │              │   MongoDB     │              │
        │              │   (Atlas)     │              │
        │              │   External    │              │
        │              └───────────────┘              │
        │                                             │
        └─────────────────────────────────────────────┘
                    WebSocket (Socket.IO)

┌───────────────────────────────────────────────────────────────────────┐
│                            Data Flow                                   │
└───────────────────────────────────────────────────────────────────────┘

User Request Flow:
1. User → Load Balancer (HTTPS)
2. Load Balancer → Client Container (Port 3000)
3. Client → API Gateway → Server Container (Port 5000)
4. Server → Database (MongoDB Atlas)
5. Server → ML Service (Port 8000) for predictions
6. Response flows back through chain

Real-time Updates:
1. Server ↔ Client (Socket.IO WebSocket)
2. Instant notifications on patient updates

ML Prediction Flow:
1. Server receives patient data
2. Server sends to ML Service (HTTP/REST)
3. ML Service loads models from volumes
4. ML Service returns prediction
5. Server stores and sends to Client

┌───────────────────────────────────────────────────────────────────────┐
│                         Storage & Volumes                              │
└───────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐
│   Host File System      │
├─────────────────────────┤
│                         │
│  Model Files (RO):      │
│  ├─ xgboost_model.pkl   │◀─── Mounted to ML Container
│  ├─ scaler.pkl          │     (Read-Only)
│  └─ label_encoders.pkl  │
│                         │
│  Docker Volumes:        │
│  ├─ ml-logs/            │◀─── ML Service logs
│  └─ nginx-logs/         │◀─── Nginx access logs
│                         │
└─────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│                      Health Check System                               │
└───────────────────────────────────────────────────────────────────────┘

Every 30 seconds:
┌─────────────────┐
│  Docker Engine  │
└────────┬────────┘
         │
         ├──▶ Client:    wget http://localhost:80/health
         ├──▶ Server:    node healthcheck script
         └──▶ ML Service: curl http://localhost:8000/health

If unhealthy for 3 consecutive checks:
  └──▶ Container marked unhealthy
       └──▶ Docker can auto-restart (restart: always)

┌───────────────────────────────────────────────────────────────────────┐
│                      Deployment Workflow                               │
└───────────────────────────────────────────────────────────────────────┘

Development:
    ./start.sh
       │
       ├──▶ Check prerequisites
       ├──▶ Create .env if needed
       ├──▶ docker-compose up -d
       └──▶ Show access URLs

Production:
    ./deploy.sh
       │
       ├──▶ Backup current state
       ├──▶ Pull latest code (if git)
       ├──▶ Build images (--no-cache)
       ├──▶ Stop old containers
       ├──▶ Start new containers
       ├──▶ Health check verification
       └──▶ Cleanup old images

CI/CD Pipeline (GitHub Actions):
    git push → main
       │
       ├──▶ Run tests (Server, Client, ML)
       ├──▶ Build Docker images
       ├──▶ Push to Docker Registry
       ├──▶ SSH to production server
       ├──▶ Pull and deploy
       ├──▶ Health check
       └──▶ Send notifications (Slack)

┌───────────────────────────────────────────────────────────────────────┐
│                      Scaling Strategy                                  │
└───────────────────────────────────────────────────────────────────────┘

Docker Swarm (Recommended):

    docker swarm init
       │
       └──▶ docker stack deploy -c docker-compose.prod.yml healthcare
              │
              ├──▶ Server:     2 replicas (can scale to 10+)
              ├──▶ ML Service: 2 replicas (CPU intensive)
              └──▶ Client:     2 replicas (static content)

Load Distribution:
    Request → Swarm Load Balancer
       │
       ├──▶ Server Replica 1 ─┐
       ├──▶ Server Replica 2 ─┤
       └──▶ Server Replica N ─┴──▶ Shared MongoDB

┌───────────────────────────────────────────────────────────────────────┐
│                      Monitoring Stack (Optional)                       │
└───────────────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  Prometheus  │─────▶│   Grafana    │◀────▶│   Alerts     │
│  (Metrics)   │      │ (Dashboard)  │      │  (Slack)     │
└──────────────┘      └──────────────┘      └──────────────┘
       │
       ├──▶ Node Exporter (System metrics)
       ├──▶ Container metrics (Docker)
       └──▶ Application metrics (Custom)

┌───────────────────────────────────────────────────────────────────────┐
│                      Security Layers                                   │
└───────────────────────────────────────────────────────────────────────┘

1. Network Level:
   ├─ Private Docker network (172.20.0.0/16)
   ├─ ML Service not exposed externally
   └─ Firewall rules on host

2. Container Level:
   ├─ Non-root users in all containers
   ├─ Read-only file systems where possible
   ├─ Resource limits (CPU/Memory)
   └─ Minimal base images (Alpine)

3. Application Level:
   ├─ JWT authentication
   ├─ CORS protection
   ├─ Input validation
   └─ HTTPS/SSL (Let's Encrypt)

4. Data Level:
   ├─ MongoDB Atlas encryption at rest
   ├─ TLS for database connections
   └─ Encrypted environment variables

┌───────────────────────────────────────────────────────────────────────┐
│                      Backup & Recovery                                 │
└───────────────────────────────────────────────────────────────────────┘

Automated Daily Backups:
┌─────────────────┐
│  Cron Job       │
└────────┬────────┘
         │
         ├──▶ Backup .env file
         ├──▶ Backup Docker volumes
         ├──▶ Backup MongoDB (Atlas automated)
         └──▶ Upload to S3/Cloud Storage

Recovery Process:
    Disaster occurs
       │
       ├──▶ Pull latest code from git
       ├──▶ Restore .env from backup
       ├──▶ Restore volumes from backup
       ├──▶ Run: docker-compose up -d
       └──▶ Verify with health-check.sh

┌───────────────────────────────────────────────────────────────────────┐
│                      Performance Optimization                          │
└───────────────────────────────────────────────────────────────────────┘

1. Build Optimization:
   ├─ Multi-stage Docker builds
   ├─ Layer caching
   ├─ .dockerignore files
   └─ Minimal dependencies

2. Runtime Optimization:
   ├─ Nginx gzip compression
   ├─ Static asset caching
   ├─ Connection pooling (MongoDB)
   └─ Model caching (ML Service)

3. Network Optimization:
   ├─ HTTP/2 (Nginx)
   ├─ CDN for static assets (optional)
   └─ WebSocket for real-time updates

┌───────────────────────────────────────────────────────────────────────┐
│                      Resource Planning                                 │
└───────────────────────────────────────────────────────────────────────┘

Small Deployment (< 100 users):
├─ Server:     1 vCPU,  1GB RAM
├─ ML Service: 2 vCPU,  2GB RAM
├─ Client:     0.5 vCPU, 256MB RAM
└─ Total:      3.5 vCPU, 3.25GB RAM

Medium Deployment (100-1000 users):
├─ Server:     2 vCPU × 2 replicas = 4 vCPU,  4GB RAM
├─ ML Service: 2 vCPU × 2 replicas = 4 vCPU,  6GB RAM
├─ Client:     1 vCPU × 2 replicas = 2 vCPU,  512MB RAM
└─ Total:      10 vCPU, 10.5GB RAM

Large Deployment (1000+ users):
├─ Server:     2 vCPU × 5 replicas = 10 vCPU, 10GB RAM
├─ ML Service: 4 vCPU × 3 replicas = 12 vCPU, 18GB RAM
├─ Client:     1 vCPU × 3 replicas = 3 vCPU,  1.5GB RAM
└─ Total:      25 vCPU, 29.5GB RAM
```

---

## Quick Reference

### Container Names (Production)
- `healthcare-client-prod` - Frontend
- `healthcare-server-prod` - Backend
- `healthcare-ml-service-prod` - ML API

### Docker Network
- Name: `healthcare-network`
- Subnet: `172.20.0.0/16`
- Driver: `bridge`

### Ports (External → Internal)
- `3000:80` - Client (HTTP)
- `5000:5000` - Server (API)
- `8000:8000` - ML Service (Internal only in production)

### Volumes
- `ml-logs:/app/logs` - ML service logs
- `nginx-logs:/var/log/nginx` - Nginx logs
- Model files (read-only mounts)

### Health Check Endpoints
- Client: `http://localhost:3000/health`
- Server: `http://localhost:5000/api/health`
- ML Service: `http://localhost:8000/health`

---

**For detailed deployment instructions, see [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)**
