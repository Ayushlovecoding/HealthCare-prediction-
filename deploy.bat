@echo off
REM Healthcare Platform - Production Deployment Script (Windows)
REM This script automates the deployment process

echo ======================================
echo Healthcare Platform - Deployment
echo ======================================
echo.

REM Check for Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo Error: Docker is not installed
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo Error: Docker Compose is not installed
    exit /b 1
)

echo [OK] Docker and Docker Compose are installed
echo.

REM Check for .env file
if not exist .env (
    echo Error: .env file not found
    echo Please copy .env.production to .env and configure it
    exit /b 1
)

echo [OK] Environment file found
echo.

REM Check for model files
echo Checking for ML model files...
set MISSING_MODELS=0

if not exist xgboost_icu_model.pkl (
    echo Warning: xgboost_icu_model.pkl not found
    set MISSING_MODELS=1
)

if not exist scaler.pkl (
    echo Warning: scaler.pkl not found
    set MISSING_MODELS=1
)

if not exist label_encoders.pkl (
    echo Warning: label_encoders.pkl not found
    set MISSING_MODELS=1
)

if %MISSING_MODELS%==1 (
    echo Warning: Some model files are missing
    echo ML service may not function properly
    set /p continue="Continue anyway? (y/N): "
    if /i not "%continue%"=="y" exit /b 1
) else (
    echo [OK] All model files present
)
echo.

REM Create backup directory
set BACKUP_DIR=backups\%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set BACKUP_DIR=%BACKUP_DIR: =0%
mkdir %BACKUP_DIR% 2>nul

echo Creating backup...
copy .env %BACKUP_DIR%\.env.backup >nul
echo [OK] Backup created at %BACKUP_DIR%
echo.

REM Build images
echo Building Docker images...
docker-compose -f docker-compose.prod.yml build --no-cache

if errorlevel 1 (
    echo Error: Build failed
    exit /b 1
)

echo [OK] Images built successfully
echo.

REM Stop old containers
echo Stopping old containers...
docker-compose -f docker-compose.prod.yml down

REM Start new containers
echo Starting new containers...
docker-compose -f docker-compose.prod.yml up -d

if errorlevel 1 (
    echo Error: Failed to start containers
    exit /b 1
)

echo [OK] Containers started
echo.

REM Wait for services
echo Waiting for services to initialize...
timeout /t 10 /nobreak >nul

REM Check service health
echo Checking service health...
docker-compose -f docker-compose.prod.yml ps
echo.

REM Show recent logs
echo Recent logs:
docker-compose -f docker-compose.prod.yml logs --tail=20
echo.

REM Cleanup
echo Cleaning up old images...
docker image prune -f
echo.

echo ======================================
echo Deployment Complete!
echo ======================================
echo.
echo Access your application:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:5000/api
echo   ML API:   http://localhost:8000
echo.
echo Useful commands:
echo   View logs:    docker-compose -f docker-compose.prod.yml logs -f
echo   Stop:         docker-compose -f docker-compose.prod.yml down
echo   Restart:      docker-compose -f docker-compose.prod.yml restart
echo   Status:       docker-compose -f docker-compose.prod.yml ps
echo.
echo Backup location: %BACKUP_DIR%
echo.
pause
