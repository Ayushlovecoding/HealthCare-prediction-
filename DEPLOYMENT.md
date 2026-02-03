# 🚀 Deployment Guide - Healthcare Emergency Response System

## Prerequisites Checklist

- [ ] Docker Desktop installed and running
- [ ] Docker Hub account (free) - [hub.docker.com](https://hub.docker.com)
- [ ] MongoDB Atlas cluster - [cloud.mongodb.com](https://cloud.mongodb.com)
- [ ] GitHub account (for CI/CD)
- [ ] Render account (free tier available) - [render.com](https://render.com)

---

## Step 1: Test Locally with Docker

### 1.1 Stop Local Dev Servers
```powershell
# Stop any running Node.js processes on port 5000
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Stop Python/uvicorn if running
Get-Process python -ErrorAction SilentlyContinue | Where-Object {$_.CommandLine -like "*uvicorn*"} | Stop-Process -Force
```

### 1.2 Build and Test with Docker Compose
```powershell
cd "E:\update project\healthcare project"

# Build all services
docker-compose build

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Verify services are running
docker-compose ps
```

### 1.3 Test the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001/api/health
- ML Service: http://localhost:8001/health

```powershell
# Test endpoints
Invoke-RestMethod http://localhost:5001/api/health
Invoke-RestMethod http://localhost:8001/health
```

### 1.4 Stop Services
```powershell
docker-compose down
```

---

## Step 2: Prepare for Deployment

### 2.1 Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a **free M0 cluster**
3. Create a database user:
   - Username: `healthcareUser`
   - Password: (generate strong password)
4. **Network Access** → Add IP: `0.0.0.0/0` (allow all - for dev/testing)
5. Get connection string:
   ```
   mongodb+srv://healthcareUser:<password>@cluster0.xxxxx.mongodb.net/healthcare?retryWrites=true&w=majority
   ```

### 2.2 Create Docker Hub Repository

1. Login to [Docker Hub](https://hub.docker.com)
2. Create 3 repositories (public or private):
   - `yourusername/healthcare-server`
   - `yourusername/healthcare-ml-service`
   - `yourusername/healthcare-client`

### 2.3 Login to Docker Hub
```powershell
docker login
# Enter your Docker Hub username and password
```

---

## Step 3: Build and Push Docker Images

### 3.1 Tag and Push Images
```powershell
# Set your Docker Hub username
$DOCKER_USER = "yourusername"

# Build and push Server
cd server
docker build -t ${DOCKER_USER}/healthcare-server:latest .
docker push ${DOCKER_USER}/healthcare-server:latest

# Build and push ML Service
cd ../ml-service
docker build -t ${DOCKER_USER}/healthcare-ml-service:latest .
docker push ${DOCKER_USER}/healthcare-ml-service:latest

# Build and push Client
cd ../client
docker build --build-arg VITE_API_URL=https://your-api.onrender.com/api --build-arg VITE_SOCKET_URL=https://your-api.onrender.com -t ${DOCKER_USER}/healthcare-client:latest .
docker push ${DOCKER_USER}/healthcare-client:latest

cd ..
```

**Note:** Replace `yourusername` with your actual Docker Hub username.

---

## Step 4: Deploy to Render (Recommended)

### 4.1 Create Web Services

Go to [Render Dashboard](https://dashboard.render.com) and create **3 Web Services**:

#### Service 1: Backend (Node.js Server)
- **Name:** `healthcare-server`
- **Runtime:** Docker
- **Repo:** Connect your GitHub repo or use Docker image
- **Docker Image URL:** `yourusername/healthcare-server:latest`
- **Instance Type:** Free or Starter ($7/mo)
- **Environment Variables:**
  ```
  NODE_ENV=production
  PORT=5000
  MONGODB_URI=mongodb+srv://healthcareUser:<password>@cluster0.xxxxx.mongodb.net/healthcare
  JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long-production
  JWT_EXPIRES_IN=7d
  ML_SERVICE_URL=https://healthcare-ml-service.onrender.com
  CORS_ORIGINS=https://healthcare-client.onrender.com
  ```

#### Service 2: ML Service (Python FastAPI)
- **Name:** `healthcare-ml-service`
- **Runtime:** Docker
- **Docker Image URL:** `yourusername/healthcare-ml-service:latest`
- **Instance Type:** Free or Starter
- **Environment Variables:**
  ```
  ENVIRONMENT=production
  HOST=0.0.0.0
  PORT=8000
  LOG_LEVEL=INFO
  ```

#### Service 3: Frontend (React/Nginx)
- **Name:** `healthcare-client`
- **Runtime:** Static Site or Docker
- **Docker Image URL:** `yourusername/healthcare-client:latest`
- **Instance Type:** Free

**OR** for Static Site:
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Environment Variables:
  ```
  VITE_API_URL=https://healthcare-server.onrender.com/api
  VITE_SOCKET_URL=https://healthcare-server.onrender.com
  ```

### 4.2 Update Environment Variables

After services are created, update the URLs:

**Server (.env):**
```env
ML_SERVICE_URL=https://healthcare-ml-service.onrender.com
CORS_ORIGINS=https://healthcare-client.onrender.com
```

**Client (rebuild with correct URLs):**
```powershell
docker build --build-arg VITE_API_URL=https://healthcare-server.onrender.com/api --build-arg VITE_SOCKET_URL=https://healthcare-server.onrender.com -t ${DOCKER_USER}/healthcare-client:latest .
docker push ${DOCKER_USER}/healthcare-client:latest
```

---

## Step 5: Set Up CI/CD with GitHub Actions

### 5.1 Add GitHub Secrets

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**

Add these secrets:
```
DOCKER_USERNAME=yourdockerhubusername
DOCKER_PASSWORD=yourdockerhubtoken
RENDER_DEPLOY_HOOK_SERVER=https://api.render.com/deploy/srv-xxxxx?key=xxxxx
RENDER_DEPLOY_HOOK_ML_SERVICE=https://api.render.com/deploy/srv-xxxxx?key=xxxxx
RENDER_DEPLOY_HOOK_CLIENT=https://api.render.com/deploy/srv-xxxxx?key=xxxxx
```

Add these variables:
```
VITE_API_URL=https://healthcare-server.onrender.com/api
VITE_SOCKET_URL=https://healthcare-server.onrender.com
PRODUCTION_API_URL=https://healthcare-server.onrender.com
PRODUCTION_ML_URL=https://healthcare-ml-service.onrender.com
PRODUCTION_CLIENT_URL=https://healthcare-client.onrender.com
```

### 5.2 Get Render Deploy Hooks

For each service on Render:
1. Go to service → **Settings**
2. Scroll to **Deploy Hook**
3. Copy the webhook URL
4. Add to GitHub secrets

### 5.3 Push to GitHub

```powershell
git add .
git commit -m "Add deployment configuration"
git push origin main
```

The GitHub Actions workflow will automatically:
- Run tests
- Build Docker images
- Push to Docker Hub
- Deploy to Render

---

## Step 6: Verify Deployment

### 6.1 Check Service Health
```powershell
# Backend
Invoke-RestMethod https://healthcare-server.onrender.com/api/health

# ML Service
Invoke-RestMethod https://healthcare-ml-service.onrender.com/health

# Frontend
Start-Process https://healthcare-client.onrender.com
```

### 6.2 Create Initial Admin User
```powershell
$body = @{
  name = "Admin User"
  email = "admin@hospital.com"
  password = "SecurePassword123!"
  role = "ADMIN"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "https://healthcare-server.onrender.com/api/auth/register" -Body $body -ContentType "application/json"
```

---

## Alternative Deployment Options

### Option 2: Deploy to AWS ECS (Advanced)

1. **Create ECR Repositories**
2. **Push images to ECR**
3. **Create ECS Cluster**
4. **Define Task Definitions**
5. **Create Services**
6. **Configure Load Balancer**

### Option 3: Deploy to Azure Container Instances

```powershell
# Login to Azure
az login

# Create resource group
az group create --name healthcare-rg --location eastus

# Deploy containers
az container create --resource-group healthcare-rg --name healthcare-server --image yourusername/healthcare-server:latest --ports 5000 --environment-variables MONGODB_URI="..." JWT_SECRET="..."
```

### Option 4: Deploy to DigitalOcean App Platform

1. Connect GitHub repo
2. Configure services (detects Dockerfile automatically)
3. Set environment variables
4. Deploy

---

## Deployment Checklist

- [ ] MongoDB Atlas cluster created and configured
- [ ] Docker images built and pushed to registry
- [ ] Render services created (server, ml-service, client)
- [ ] Environment variables configured on Render
- [ ] GitHub secrets added for CI/CD
- [ ] Deploy hooks configured
- [ ] Services deployed and running
- [ ] Health checks passing
- [ ] Admin user created
- [ ] Test complete workflow (register, login, submit patient, predict)

---

## Monitoring and Maintenance

### Check Logs
```powershell
# Render Dashboard → Select service → Logs tab
```

### Update Deployment
```powershell
# Method 1: Push to GitHub (triggers CI/CD)
git add .
git commit -m "Update feature"
git push origin main

# Method 2: Manual Docker push
docker build -t yourusername/healthcare-server:latest .
docker push yourusername/healthcare-server:latest
# Trigger Render deploy hook or manual deploy
```

### Rollback
```powershell
# Render Dashboard → Select service → Manual Deploy → Previous version
```

---

## Cost Estimate

### Free Tier (Render)
- Server: Free (spins down after inactivity)
- ML Service: Free (spins down after inactivity)
- Client: Free
- MongoDB Atlas: Free (M0 cluster, 512MB)
- **Total: $0/month** (with limitations)

### Production Tier (Render)
- Server: Starter ($7/mo)
- ML Service: Starter ($7/mo)
- Client: Free (static site)
- MongoDB Atlas: M2 ($9/mo)
- **Total: ~$23/month**

---

## Troubleshooting

### Service won't start
- Check environment variables
- Review logs in Render dashboard
- Verify MongoDB connection string
- Ensure all required env vars are set

### CORS errors
- Update `CORS_ORIGINS` in server env
- Rebuild and redeploy server

### ML predictions failing
- Check ML service logs
- Verify model files are included in Docker image
- Test ML service endpoint directly

### Database connection fails
- Check MongoDB Atlas IP whitelist (`0.0.0.0/0`)
- Verify connection string format
- Check database user permissions

---

## Support Resources

- Render Docs: https://render.com/docs
- Docker Docs: https://docs.docker.com
- MongoDB Atlas: https://www.mongodb.com/docs/atlas
- GitHub Actions: https://docs.github.com/actions

---

**Ready to deploy?** Start with Step 1 and work through each step carefully. Good luck! 🚀
