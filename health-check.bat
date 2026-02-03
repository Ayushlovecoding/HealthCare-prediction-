@echo off
REM Healthcare Platform - Health Monitoring Script (Windows)
REM Checks the health of all services

echo ========================================
echo   Healthcare Platform Health Check
echo ========================================
echo.

set FAILED=0

REM Check Docker is running
docker ps >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running
    exit /b 1
)

echo Checking Docker containers...
echo.

REM Check server
docker inspect healthcare-server-prod >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Server container not found
    set FAILED=1
) else (
    for /f "tokens=*" %%i in ('docker inspect --format="{{.State.Status}}" healthcare-server-prod') do set STATUS=%%i
    if "!STATUS!"=="running" (
        echo [OK] Server: Running
    ) else (
        echo [ERROR] Server: !STATUS!
        set FAILED=1
    )
)

REM Check ML service
docker inspect healthcare-ml-service-prod >nul 2>&1
if errorlevel 1 (
    echo [ERROR] ML Service container not found
    set FAILED=1
) else (
    for /f "tokens=*" %%i in ('docker inspect --format="{{.State.Status}}" healthcare-ml-service-prod') do set STATUS=%%i
    if "!STATUS!"=="running" (
        echo [OK] ML Service: Running
    ) else (
        echo [ERROR] ML Service: !STATUS!
        set FAILED=1
    )
)

REM Check client
docker inspect healthcare-client-prod >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Client container not found
    set FAILED=1
) else (
    for /f "tokens=*" %%i in ('docker inspect --format="{{.State.Status}}" healthcare-client-prod') do set STATUS=%%i
    if "!STATUS!"=="running" (
        echo [OK] Client: Running
    ) else (
        echo [ERROR] Client: !STATUS!
        set FAILED=1
    )
)

echo.
echo Checking HTTP endpoints...
echo.

REM Check server endpoint
curl -s -o nul -w "%%{http_code}" http://localhost:5000/api/health | findstr "200" >nul
if errorlevel 1 (
    echo [ERROR] Server endpoint not responding
    set FAILED=1
) else (
    echo [OK] Server API: Responding
)

REM Check ML service endpoint
curl -s -o nul -w "%%{http_code}" http://localhost:8000/health | findstr "200" >nul
if errorlevel 1 (
    echo [ERROR] ML service endpoint not responding
    set FAILED=1
) else (
    echo [OK] ML Service: Responding
)

REM Check client endpoint
curl -s -o nul -w "%%{http_code}" http://localhost:3000/health | findstr "200" >nul
if errorlevel 1 (
    echo [ERROR] Client endpoint not responding
    set FAILED=1
) else (
    echo [OK] Client: Responding
)

echo.
echo Resource Usage:
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" healthcare-server-prod healthcare-ml-service-prod healthcare-client-prod 2>nul

echo.
echo ========================================

if %FAILED%==0 (
    echo [OK] All services are healthy!
    exit /b 0
) else (
    echo [ERROR] Some services are unhealthy
    echo.
    echo Suggested actions:
    echo   1. Check logs: docker-compose logs -f
    echo   2. Restart services: docker-compose restart
    echo   3. Check .env configuration
    exit /b 1
)
