# 🏥 Emergency Response Prediction System

A production-grade healthcare application for predicting ICU admission needs using machine learning. Built with modern MERN stack architecture and Python ML microservices.

![CI/CD](https://github.com/yourusername/healthcare-project/workflows/CI%2FCD%20Pipeline/badge.svg)

## 🐳 Docker Deployment Ready!

This application is **fully containerized** and ready for production deployment!

**Quick Start:**
```bash
# Development
./start.sh          # Linux/Mac
start.bat           # Windows

# Production
./deploy.sh         # Linux/Mac
deploy.bat          # Windows
```

📖 **[Complete Docker Deployment Guide →](DOCKER_DEPLOYMENT.md)**  
📋 **[Docker Quick Reference →](DOCKER.md)**  
✅ **[Setup Summary →](DOCKER_SETUP_SUMMARY.md)**

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React Client  │────▶│  Express Server │────▶│   ML Service    │
│   (Vite + TW)   │◀────│   (Node.js)     │◀────│   (FastAPI)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       ▼                       │
        │               ┌─────────────────┐             │
        │               │  MongoDB Atlas  │             │
        │               └─────────────────┘             │
        │                                               │
        └──────────── Socket.IO (Real-time) ───────────┘
```

## ✨ Features

- **🔐 Role-Based Access Control**: Paramedic, Doctor, and Admin dashboards
- **🤖 ML-Powered Predictions**: XGBoost + LSTM ensemble for ICU admission prediction
- **⚡ Real-Time Updates**: Socket.IO for instant patient status notifications
- **📊 Interactive Dashboards**: Risk assessment visualization and statistics
- **🐳 Containerized**: Docker and Docker Compose for easy deployment
- **🚀 CI/CD Pipeline**: GitHub Actions for automated testing and deployment

## 🛠️ Tech Stack

### Frontend
- React 18 with Vite
- Tailwind CSS
- Zustand (State Management)
- Socket.IO Client
- React Router v6

### Backend
- Node.js & Express
- MongoDB with Mongoose
- JWT Authentication
- Socket.IO

### ML Microservice
- Python FastAPI
- XGBoost
- TensorFlow/Keras (LSTM)
- scikit-learn

### DevOps
- Docker & Docker Compose
- GitHub Actions CI/CD
- Render (Deployment)
- Nginx (Production)

## 📁 Project Structure

```
healthcare-project/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── api/           # API clients
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Route pages
│   │   └── store/         # Zustand stores
│   ├── Dockerfile
│   └── nginx.conf
├── server/                 # Express Backend
│   ├── src/
│   │   ├── config/        # Configuration
│   │   ├── middleware/    # Auth, RBAC, validation
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # API routes
│   │   └── utils/         # Utilities
│   └── Dockerfile
├── ml-service/             # Python ML Service
│   ├── models/            # ML model classes
│   ├── main.py            # FastAPI app
│   └── Dockerfile
├── docker-compose.yml
└── .github/workflows/     # CI/CD
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- Docker & Docker Compose
- MongoDB Atlas account (or local MongoDB)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/healthcare-project.git
cd healthcare-project
```

### 2. Environment Setup

```bash
# Copy environment files
cp .env.example .env
cp server/.env.example server/.env
cp client/.env.example client/.env
cp ml-service/.env.example ml-service/.env

# Edit .env files with your configuration
```

### 3. Run with Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

Services will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **ML Service**: http://localhost:8000

### 4. Local Development (Without Docker)

#### Backend
```bash
cd server
npm install
npm run dev
```

#### ML Service
```bash
cd ml-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

#### Frontend
```bash
cd client
npm install
npm run dev
```

## ⚙️ Configuration

### Environment Variables

#### Root `.env` (Docker Compose)
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/healthcare
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

#### Server `.env`
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/healthcare
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
ML_SERVICE_URL=http://localhost:8000
CORS_ORIGIN=http://localhost:3000
```

#### ML Service `.env`
```env
ENVIRONMENT=development
HOST=0.0.0.0
PORT=8000
MODEL_PATH=./models
LOG_LEVEL=DEBUG
```

#### Client `.env`
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## 🧪 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |

### Patients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/patients` | List all patients |
| POST | `/api/patients` | Create patient |
| GET | `/api/patients/:id` | Get patient details |
| PUT | `/api/patients/:id` | Update patient |
| DELETE | `/api/patients/:id` | Delete patient |
| POST | `/api/patients/:id/predict` | Get ML prediction |

### ML Service
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/predict` | Get ICU prediction |
| GET | `/health` | Health check |
| GET | `/model/info` | Model information |

## 👥 User Roles

| Role | Permissions |
|------|-------------|
| **PARAMEDIC** | Submit patients, view own patients, view predictions |
| **DOCTOR** | All paramedic permissions + update status, view all patients |
| **ADMIN** | Full access including user management |

## 🚢 Deployment to Render

### 1. Create Render Services

Create three web services on Render:

1. **healthcare-server** (Docker, from `./server`)
2. **healthcare-ml-service** (Docker, from `./ml-service`)
3. **healthcare-client** (Static Site or Docker)

### 2. Configure Environment Variables

Set the following in Render dashboard:

**Server:**
- `NODE_ENV=production`
- `MONGODB_URI=<your-mongodb-atlas-uri>`
- `JWT_SECRET=<secure-random-string>`
- `ML_SERVICE_URL=<ml-service-url>`
- `CORS_ORIGIN=<client-url>`

**ML Service:**
- `ENVIRONMENT=production`
- `LOG_LEVEL=INFO`

**Client (Build Args):**
- `VITE_API_URL=<server-url>/api`
- `VITE_SOCKET_URL=<server-url>`

### 3. Set Up Deploy Hooks

Get deploy hooks from Render and add them as GitHub secrets:
- `RENDER_DEPLOY_HOOK_SERVER`
- `RENDER_DEPLOY_HOOK_ML_SERVICE`
- `RENDER_DEPLOY_HOOK_CLIENT`

### 4. GitHub Secrets for CI/CD

Add the following secrets to your GitHub repository:

```
DOCKER_USERNAME=<your-docker-hub-username>
DOCKER_PASSWORD=<your-docker-hub-token>
RENDER_DEPLOY_HOOK_SERVER=<render-deploy-hook-url>
RENDER_DEPLOY_HOOK_ML_SERVICE=<render-deploy-hook-url>
RENDER_DEPLOY_HOOK_CLIENT=<render-deploy-hook-url>
```

Add the following variables:

```
VITE_API_URL=https://your-server.onrender.com/api
VITE_SOCKET_URL=https://your-server.onrender.com
PRODUCTION_API_URL=https://your-server.onrender.com
PRODUCTION_ML_URL=https://your-ml-service.onrender.com
PRODUCTION_CLIENT_URL=https://your-client.onrender.com
```

## 🧪 Testing

```bash
# Backend tests
cd server && npm test

# ML Service tests
cd ml-service && pytest

# Frontend tests
cd client && npm test
```

## 📊 ML Model

The system uses an ensemble of XGBoost and LSTM models:

### Features Used
- Age, Gender, Heart Rate, Respiratory Rate
- Oxygen Saturation, Blood Pressure (Systolic/Diastolic)
- Temperature, Consciousness Level
- Injury Type, Response Time, Time of Day

### Output
- ICU Admission Probability (0-1)
- Risk Level (CRITICAL, HIGH, MEDIUM, LOW)
- Clinical Summary

## 🔧 Troubleshooting

### Docker Issues
```bash
# Reset Docker environment
docker-compose down -v
docker system prune -f
docker-compose up --build
```

### MongoDB Connection
- Ensure IP whitelist includes `0.0.0.0/0` for Atlas
- Check connection string format

### ML Model Not Loading
- Verify `.pkl` files exist in project root or `ml-service/models/`
- Check file permissions

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

Built with ❤️ for better emergency healthcare response

---

## 📜 Legacy Documentation

<details>
<summary>Click to expand original Flask-based documentation</summary>

### 🚑 Phase 2: Core Web Application (Weeks 2–4)

- **Paramedic Data Entry**:
  - HTML form at `/report` with patient input fields.
  - Flask route: display + receive + save to DB.

- **Hospital Dashboard**:
  - Route `/dashboard` to fetch all patient records.
  - HTML dashboard displays records in table/cards.
  - Add `View Details` button → `/patient/<int:id>`.

- ✅ **Outcome**: End-to-end data flow from paramedic form → database → dashboard.

### 🧠 Phase 3: Machine Learning Model (Weeks 5–6)

- **Create Sample Dataset**:
  - CSV with 100+ rows, fields matching DB, `needs_icu` column as target.

- **Train Model (train_model.py)**:
  - Use `pandas` to load data
  - Train/test split
  - Train using XGBoost
  - Save model

- ✅ **Outcome**: Trained model saved as `emergency_predictor.pkl`.

### 🔗 Phase 4: Integration (Week 7)

- **Load Model in Flask**: Integrated prediction into dashboard views

</details>
