# 📋 Docker Deployment Checklist

Use this checklist to ensure a smooth deployment of your healthcare platform.

## ✅ Pre-Deployment Setup

### 1. Environment Configuration
- [ ] Copy `.env.production` to `.env`
- [ ] Set `MONGODB_URI` with your MongoDB Atlas connection string
- [ ] Generate and set strong `JWT_SECRET` (min 32 characters)
  ```bash
  # Generate a secure secret:
  openssl rand -base64 64
  ```
- [ ] Configure `CORS_ORIGIN` with your domain
- [ ] Set `VITE_API_URL` and `VITE_SOCKET_URL` for production

### 2. ML Model Files
- [ ] Place `xgboost_icu_model.pkl` in root directory
- [ ] Place `scaler.pkl` in root directory
- [ ] Place `label_encoders.pkl` in root directory
- [ ] Verify files exist: `ls -la *.pkl`

### 3. Prerequisites Check
- [ ] Docker installed (v24.0+)
  ```bash
  docker --version
  ```
- [ ] Docker Compose installed (v2.20+)
  ```bash
  docker-compose --version
  ```
- [ ] MongoDB Atlas account created (or local MongoDB)
- [ ] Domain name configured (production only)

## ✅ Local Development Testing

### 4. Start Development Environment
- [ ] Run quick start script
  ```bash
  ./start.sh      # Linux/Mac
  start.bat       # Windows
  ```
- [ ] Verify all containers are running
  ```bash
  docker-compose ps
  ```
- [ ] Check logs for errors
  ```bash
  docker-compose logs -f
  ```

### 5. Test Application Access
- [ ] Frontend accessible: http://localhost:3000
- [ ] Backend API responding: http://localhost:5000/api/health
- [ ] ML Service responding: http://localhost:8000/health
- [ ] WebSocket connection working
- [ ] Can register and login
- [ ] Can submit patient data
- [ ] Predictions working

## ✅ Production Preparation

### 6. Security Configuration
- [ ] Change default JWT_SECRET to unique value
- [ ] Use strong MongoDB password
- [ ] MongoDB Atlas IP whitelist configured
- [ ] Review and update CORS settings
- [ ] Disable debug logging (set `LOG_LEVEL=INFO`)
- [ ] Review exposed ports

### 7. SSL/HTTPS Setup (Production)
- [ ] Domain name pointing to server
- [ ] DNS A record configured
- [ ] Install Certbot for Let's Encrypt
  ```bash
  sudo apt-get install certbot python3-certbot-nginx
  ```
- [ ] Generate SSL certificate
  ```bash
  sudo certbot --nginx -d yourdomain.com
  ```
- [ ] Configure auto-renewal
- [ ] Update docker-compose to use port 443

### 8. Server Configuration
- [ ] Sufficient resources available
  - [ ] 4+ CPU cores
  - [ ] 8GB+ RAM
  - [ ] 50GB+ storage
- [ ] Firewall configured
  - [ ] Port 80 open (HTTP)
  - [ ] Port 443 open (HTTPS)
  - [ ] Port 22 open (SSH)
- [ ] SSH access configured
- [ ] Backup directory created

## ✅ Deployment

### 9. Build Production Images
- [ ] Run production build
  ```bash
  docker-compose -f docker-compose.prod.yml build --no-cache
  ```
- [ ] No build errors
- [ ] Images created successfully
  ```bash
  docker images | grep healthcare
  ```

### 10. Deploy to Production
- [ ] Run deployment script
  ```bash
  ./deploy.sh      # Linux/Mac
  deploy.bat       # Windows
  ```
  OR
  ```bash
  docker-compose -f docker-compose.prod.yml up -d
  ```
- [ ] Backup created
- [ ] Containers started
- [ ] No errors in deployment output

### 11. Post-Deployment Verification
- [ ] Run health check
  ```bash
  ./health-check.sh      # Linux/Mac
  health-check.bat       # Windows
  ```
- [ ] All containers running
  ```bash
  docker-compose -f docker-compose.prod.yml ps
  ```
- [ ] Check container health status
  ```bash
  docker inspect --format='{{.State.Health.Status}}' healthcare-server-prod
  ```
- [ ] Review logs for errors
  ```bash
  docker-compose -f docker-compose.prod.yml logs --tail=100
  ```

### 12. Application Testing
- [ ] Frontend loads correctly
- [ ] Can login with test account
- [ ] Dashboard displays correctly
- [ ] Can submit patient data
- [ ] Predictions return successfully
- [ ] Real-time updates working
- [ ] All API endpoints responding
- [ ] Error handling working

## ✅ Production Operations

### 13. Monitoring Setup
- [ ] Enable application monitoring
- [ ] Configure log aggregation
- [ ] Set up resource monitoring
  ```bash
  docker stats
  ```
- [ ] Configure alerts (optional: Slack/Email)
- [ ] Set up uptime monitoring

### 14. Backup Configuration
- [ ] Automated backup script configured
- [ ] Backup schedule set up (cron/Task Scheduler)
  ```bash
  # Example cron: Daily at 2 AM
  0 2 * * * /path/to/backup.sh
  ```
- [ ] Backup storage configured
- [ ] Test backup restoration
- [ ] MongoDB Atlas backups enabled

### 15. CI/CD Pipeline (Optional)
- [ ] GitHub repository configured
- [ ] GitHub Actions workflow enabled
- [ ] Docker Hub credentials set
  - [ ] `DOCKER_USERNAME`
  - [ ] `DOCKER_PASSWORD`
- [ ] Server SSH credentials set
  - [ ] `PRODUCTION_HOST`
  - [ ] `PRODUCTION_USERNAME`
  - [ ] `SSH_PRIVATE_KEY`
- [ ] Slack webhook configured (optional)
  - [ ] `SLACK_WEBHOOK`

## ✅ Documentation

### 16. Team Onboarding
- [ ] Team has access to repository
- [ ] Team reviewed [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)
- [ ] Team reviewed [DOCKER.md](DOCKER.md)
- [ ] Team knows how to check logs
- [ ] Team knows how to restart services
- [ ] Emergency contacts documented

### 17. Maintenance Procedures
- [ ] Update procedure documented
- [ ] Rollback procedure documented
- [ ] Scaling procedure documented
- [ ] Troubleshooting guide accessible
- [ ] Contact information for support

## ✅ Final Verification

### 18. Production Readiness
- [ ] All tests passing
- [ ] Performance acceptable
- [ ] Security scan completed
  ```bash
  docker scan healthcare-server:latest
  docker scan healthcare-ml-service:latest
  docker scan healthcare-client:latest
  ```
- [ ] Load testing completed (optional)
- [ ] Disaster recovery plan in place
- [ ] Monitoring dashboards set up
- [ ] Team trained on operations

### 19. Go-Live
- [ ] Maintenance window scheduled
- [ ] Stakeholders notified
- [ ] Rollback plan ready
- [ ] Support team standing by
- [ ] Production deployment completed
- [ ] Post-deployment verification passed
- [ ] Go-live announcement sent

## ✅ Post-Deployment

### 20. Ongoing Maintenance
- [ ] Monitor logs daily
  ```bash
  docker-compose -f docker-compose.prod.yml logs --tail=100
  ```
- [ ] Check resource usage weekly
  ```bash
  docker stats
  ```
- [ ] Review security updates monthly
- [ ] Update dependencies quarterly
- [ ] Review and optimize performance
- [ ] Maintain backup retention policy

---

## Common Commands Quick Reference

```bash
# Check status
docker-compose -f docker-compose.prod.yml ps
./health-check.sh

# View logs
docker-compose -f docker-compose.prod.yml logs -f
docker-compose -f docker-compose.prod.yml logs -f server

# Restart service
docker-compose -f docker-compose.prod.yml restart server

# Scale service
docker service scale healthcare_server=3

# Backup
cp .env backups/.env.$(date +%Y%m%d)

# Stop all
docker-compose -f docker-compose.prod.yml down

# Clean up
docker system prune -af
```

---

## Emergency Procedures

### Application Down
1. Check container status: `docker-compose ps`
2. Check logs: `docker-compose logs -f`
3. Restart services: `docker-compose restart`
4. If still down, redeploy: `./deploy.sh`

### Database Connection Issues
1. Verify MongoDB URI in `.env`
2. Check MongoDB Atlas IP whitelist
3. Test connection from container
4. Check network: `docker network inspect healthcare-network`

### Out of Resources
1. Check disk space: `df -h`
2. Clean up Docker: `docker system prune -af`
3. Check memory: `free -h`
4. Scale down services if needed

### Need to Rollback
1. Stop current deployment: `docker-compose down`
2. Restore backup: `cp backups/.env.DATE .env`
3. Checkout previous version: `git checkout <commit>`
4. Redeploy: `./deploy.sh`

---

## Support Resources

- 📖 [Docker Deployment Guide](DOCKER_DEPLOYMENT.md)
- 📋 [Docker Quick Reference](DOCKER.md)
- 🏗️ [Architecture Diagram](ARCHITECTURE.md)
- ✅ [Setup Summary](DOCKER_SETUP_SUMMARY.md)
- 📚 [Project README](README.md)

---

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Production URL:** _______________  
**Notes:** _______________
