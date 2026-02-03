# 🚀 QUICK START - Get Running in 5 Minutes!

## Step 1: Configure Environment (2 min)

```bash
# Copy the environment template
cp .env.production .env
```

**Edit `.env` file with your values:**
```bash
# REQUIRED - Get from MongoDB Atlas (https://cloud.mongodb.com)
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/healthcare?retryWrites=true&w=majority

# REQUIRED - Generate a secret (run this command):
# openssl rand -base64 64
JWT_SECRET=paste-your-generated-secret-here

# These have defaults, but update for production:
CORS_ORIGIN=http://localhost:3000
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Step 2: Start the Application (1 min)

**Windows:**
```cmd
start.bat
```

**Linux/Mac:**
```bash
chmod +x *.sh
./start.sh
```

**OR using Make:**
```bash
make up
```

## Step 3: Wait for Services to Start (2 min)

The scripts will automatically:
- ✅ Check Docker is installed
- ✅ Create containers
- ✅ Start all services
- ✅ Display access URLs

## Step 4: Access Your Application

Open your browser:

- 🌐 **Frontend:** http://localhost:3000
- 🔌 **Backend API:** http://localhost:5000/api
- 🤖 **ML Service:** http://localhost:8000
- 📚 **API Documentation:** http://localhost:8000/docs

## Step 5: Test the Application

1. **Register** a new account (Paramedic or Doctor role)
2. **Login** with your credentials
3. **Submit** a patient for prediction
4. **View** the ICU admission prediction

---

## ⚠️ Troubleshooting

### If containers won't start:

```bash
# Check what went wrong
docker-compose logs -f

# Common fixes:
docker-compose down
docker-compose up -d
```

### If you see "Model files not found":

The app will run, but predictions won't work. Place these files in the root directory:
- `xgboost_icu_model.pkl`
- `scaler.pkl`
- `label_encoders.pkl`

### If ports are already in use:

Edit `docker-compose.yml` and change the external ports:
```yaml
ports:
  - "3001:80"   # Changed from 3000:80
  - "5001:5000" # Changed from 5000:5000
  - "8001:8000" # Changed from 8000:8000
```

---

## 🎯 Common Commands

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Check status
docker-compose ps

# Run health check
./health-check.sh      # Linux/Mac
health-check.bat       # Windows
```

---

## 📖 Need More Help?

- **Full Deployment Guide:** [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)
- **Quick Reference:** [DOCKER.md](DOCKER.md)
- **Deployment Checklist:** [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
- **Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md)

---

## 🎉 That's It!

Your healthcare platform is now running in Docker containers!

**Default Test Account:**
- Email: admin@healthcare.com
- Password: admin123
- Role: Doctor

⚠️ **Remember to change default credentials in production!**

---

**Questions?** Check the documentation files or run `make help` for available commands.
