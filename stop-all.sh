#!/bin/bash

echo "🛑 SiteMinder MCP Application - Stopping All Services"
echo "======================================================"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Stop backend
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "🛑 Stopping Backend Server (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        sleep 1
    fi
    rm logs/backend.pid
fi

# Stop frontend
if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "🛑 Stopping Frontend Server (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        sleep 1
    fi
    rm logs/frontend.pid
fi

# Kill any remaining processes
pkill -f "node.*mcp-server/index.js" 2>/dev/null
pkill -f "node.*backend/server.js" 2>/dev/null
pkill -f "python.*http.server.*8080" 2>/dev/null

echo ""
echo "✅ All services stopped"
echo ""
