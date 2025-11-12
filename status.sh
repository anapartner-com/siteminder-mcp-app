#!/bin/bash

echo "📊 SiteMinder MCP Application - Service Status"
echo "=============================================="
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check backend
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "✅ Backend Server: RUNNING (PID: $BACKEND_PID)"
    else
        echo "❌ Backend Server: NOT RUNNING (stale PID file)"
    fi
else
    echo "❌ Backend Server: NOT RUNNING"
fi

# Check frontend
if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "✅ Frontend Server: RUNNING (PID: $FRONTEND_PID)"
    else
        echo "❌ Frontend Server: NOT RUNNING (stale PID file)"
    fi
else
    echo "❌ Frontend Server: NOT RUNNING"
fi

echo ""
echo "🔗 URLs:"
echo "   Frontend: http://localhost:8080"
echo "   Backend:  http://localhost:3000"
echo ""

# Check if ports are in use
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "✅ Port 3000 (Backend): IN USE"
else
    echo "❌ Port 3000 (Backend): FREE"
fi

if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "✅ Port 8080 (Frontend): IN USE"
else
    echo "❌ Port 8080 (Frontend): FREE"
fi

echo ""
