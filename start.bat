@echo off
REM Healthcare Platform - Quick Start Script (Windows)
REM Quickly spin up the development environment

echo ========================================
echo   Healthcare Platform - Quick Start
echo ========================================
echo.

REM Check if .env exists
if not exist .env (
    echo Creating .env file from template...
    copy .env.example .env >nul
    echo [OK] .env file created
    echo [WARNING] Please edit .env with your configuration
    echo.
)

REM Check for model files
echo Checking for ML model files...
if not exist xgboost_icu_model.pkl (
    echo [WARNING] Model files not found
    echo   The application will run, but ML predictions may not work
    echo   Place your model files (.pkl) in the root directory
    echo.
)

REM Start services
echo Starting services...
docker-compose up -d

echo.
echo [OK] Services starting...
echo.

REM Wait for services
echo Waiting for services to be ready...
timeout /t 15 /nobreak >nul

REM Check status
echo.
echo Service Status:
docker-compose ps

echo.
echo ========================================
echo          Ready to Go!
echo ========================================
echo.
echo Access your application:
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:5000/api
echo   ML API:    http://localhost:8000
echo   API Docs:  http://localhost:8000/docs
echo.
echo Useful commands:
echo   View logs:     docker-compose logs -f
echo   Restart:       docker-compose restart
echo   Stop:          docker-compose down
echo   Status:        docker-compose ps
echo.
echo Happy coding!
echo.
pause
