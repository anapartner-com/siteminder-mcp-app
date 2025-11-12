#!/bin/bash

echo "🚀 SiteMinder MCP Application - Starting All Services"
echo "========================================================"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load .env file if it exists
if [ -f "backend/.env" ]; then
    echo "📄 Loading environment from backend/.env"
    export $(cat backend/.env | grep -v '^#' | xargs)
elif [ -f ".env" ]; then
    echo "📄 Loading environment from .env"
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if ANTHROPIC_API_KEY is set
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ Error: ANTHROPIC_API_KEY not set"
    echo ""
    echo "Please create a .env file with:"
    echo "  ANTHROPIC_API_KEY=your-api-key-here"
    echo ""
    echo "Copy from .env.example and edit it"
    exit 1
fi

echo "✅ ANTHROPIC_API_KEY is configured"
echo ""

# Create logs directory
mkdir -p logs

# Install dependencies if needed
if [ ! -d "mcp-server/node_modules" ]; then
    echo "📦 Installing MCP Server dependencies..."
    cd mcp-server
    npm install
    cd ..
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing Backend dependencies..."
    cd backend
    npm install
    cd ..
fi

echo ""
echo "✅ All dependencies ready"
echo ""

# Kill any existing processes
echo "🧹 Cleaning up any existing processes..."
pkill -f "node.*mcp-server/index.js" 2>/dev/null
pkill -f "node.*backend/server.js" 2>/dev/null
pkill -f "python.*http.server.*8080" 2>/dev/null
sleep 2

# Start backend (which starts MCP server)
echo "🚀 Starting Backend Server (on port 3000)..."
cd backend
nohup node server.js > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid
cd ..
echo "   PID: $BACKEND_PID"
echo "   Logs: logs/backend.log"
echo ""

# Wait for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 3

# Start frontend web server
echo "🌐 Starting Frontend Server (on port 8080)..."
cd frontend
nohup python3 -m http.server 8080 > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../logs/frontend.pid
cd ..
echo "   PID: $FRONTEND_PID"
echo "   Logs: logs/frontend.log"
echo ""

# Check if services are running
sleep 2
if ps -p $BACKEND_PID > /dev/null 2>&1; then
    echo "✅ Backend is running"
else
    echo "❌ Backend failed to start. Check logs/backend.log"
    exit 1
fi

if ps -p $FRONTEND_PID > /dev/null 2>&1; then
    echo "✅ Frontend is running"
else
    echo "❌ Frontend failed to start. Check logs/frontend.log"
fi

echo ""
echo "=========================================="
echo "🎉 All services started successfully!"
echo "=========================================="
echo ""
echo "📊 Service URLs:"
echo "   Frontend: http://localhost:8080"
echo "   Backend:  http://localhost:3000"
echo ""
echo "📝 View logs:"
echo "   Backend:  tail -f logs/backend.log"
echo "   Frontend: tail -f logs/frontend.log"
echo ""
echo "🛑 To stop all services:"
echo "   ./stop-all.sh"
echo ""
echo "🌐 Open your browser to: http://localhost:8080"
echo ""
