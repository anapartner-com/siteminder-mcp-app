# SiteMinder AI Assistant - MCP Integration

Complete end-to-end application demonstrating MCP (Model Context Protocol) integration with SiteMinder Policy Server using Claude AI.

## 🌐 Quick Access

**Application is running at:**
- **Public Internet**: http://34.122.218.6:8080
- **Private Network**: http://10.128.0.56:8080
- **Local Server**: http://localhost:8080

📖 See [QUICKSTART.md](QUICKSTART.md) for detailed access instructions.

## Architecture

```
User → Web UI (Frontend) → Backend API Server → Claude API
                                    ↓
                              MCP Client
                                    ↓
                              MCP Server → SiteMinder Policy Server (REST API)
```

## Components

### 1. MCP Server (`mcp-server/`)
- Exposes SiteMinder capabilities as MCP tools
- Provides 12 tools:
  - `list_user_directories` - List all user directories
  - `get_user_directory` - Get specific user directory details
  - `list_domains` - List all domains
  - `get_domain` - Get specific domain details
  - `list_agents` - List all policy server agents
  - `get_agent` - Get specific agent details
  - `list_realms` - List all realms
  - `get_realm` - Get specific realm details
  - `get_system_health` - Check system health
  - `get_audit_logs` - Get audit logs
  - `get_active_sessions` - Get active sessions
  - `terminate_session` - Terminate a user session

### 2. Backend Server (`backend/`)
- Express.js API server
- Connects to Claude API
- Spawns MCP server as subprocess
- Handles chat requests from frontend

### 3. Frontend UI (`frontend/`)
- Simple HTML/CSS/JS interface
- Chat-like interface
- Real-time communication with backend

## Installation

### Prerequisites
- Node.js 18+
- SiteMinder Policy Server running (accessible at https://casso.cx.anapartner.net)
- Anthropic API key

### Quick Start

1. **Environment is already configured** in `.env` file

2. **Start all services**:
```bash
./start-all.sh
```

This will:
- Install dependencies (if needed)
- Start Backend server (port 3000)
- Start MCP server (automatically)
- Start Frontend server (port 8080)
- Run everything in background with logs

3. **Open browser**: http://localhost:8080 or http://10.128.0.56:8080

### Management Scripts

**Check service status**:
```bash
./status.sh
```

**Stop all services**:
```bash
./stop-all.sh
```

**View logs**:
```bash
tail -f logs/backend.log   # Backend + MCP server logs
tail -f logs/frontend.log  # Frontend server logs
```

## How It Works

1. **User asks a question** in the web UI:
   - "List all user directories"

2. **Frontend** sends request to backend:
   ```javascript
   POST /api/chat
   { "message": "List all user directories" }
   ```

3. **Backend** forwards to Claude with available MCP tools:
   - Claude understands the request
   - Decides to call `list_user_directories` tool

4. **Backend** calls MCP Server via stdio:
   - MCP server executes SiteMinder REST API call
   - Returns results

5. **Claude** processes the results and generates response

6. **Backend** returns formatted response to frontend

7. **Frontend** displays the response to user

## Example Interactions

### Example 1: List User Directories
**User:** "List all user directories"

**Flow:**
1. Claude calls `list_user_directories` tool
2. MCP server calls SiteMinder REST API `/ca/api/sso/services/policy/v1/userdirectories`
3. Claude formats the response for the user

### Example 2: System Health
**User:** "Check system health"

**Flow:**
1. Claude calls `get_system_health` tool
2. MCP server calls SiteMinder `/adminui/api/health`
3. Claude presents health status

### Example 3: List Domains
**User:** "Show me all domains"

**Flow:**
1. Claude calls `list_domains` tool
2. MCP server calls `/ca/api/sso/services/policy/v1/domains`
3. Claude displays domains in readable format

## Configuration

### SiteMinder Connection
Edit `.env` file:
```bash
SITEMINDER_BASE_URL=https://casso.cx.anapartner.net
SITEMINDER_USER=siteminder
SITEMINDER_PASSWORD=anaPassword01
```

### Anthropic API
```bash
ANTHROPIC_API_KEY=your-api-key-here
```

## Accessing from External Network

The application is configured to listen on all interfaces (0.0.0.0):

- **Local**: http://localhost:8080
- **Network**: http://10.128.0.56:8080 (replace with your server IP)

## API Reference

### Backend Endpoints

#### POST /api/chat
Chat with Claude about SiteMinder

**Request:**
```json
{
  "message": "List all domains",
  "conversationHistory": []
}
```

**Response:**
```json
{
  "response": "Here are the domains...",
  "conversationHistory": [...]
}
```

#### GET /api/health
Check backend and MCP status

**Response:**
```json
{
  "status": "ok",
  "mcpConnected": true,
  "availableTools": ["list_user_directories", "get_domain", ...]
}
```

## Debug Mode

Enable debug mode in the UI by:
1. Click the "🐛 Debug" toggle button
2. Send your message
3. See detailed MCP tool calls and responses

## Security Notes

⚠️ **Important Security Considerations:**

1. **MCP Server**: Runs internally, NOT exposed to internet
2. **API Keys**: Never commit API keys to git
3. **HTTPS**: SiteMinder API uses self-signed cert (rejectUnauthorized: false)
4. **Authentication**: Configure proper auth in production
5. **Network**: Use firewall rules to restrict access

## Troubleshooting

### Backend won't start
- Check `ANTHROPIC_API_KEY` is set in `.env`
- Verify Node.js version (18+)
- Check logs: `tail -f logs/backend.log`

### MCP tools not working
- Verify SiteMinder is accessible
- Check credentials (SITEMINDER_USER/SITEMINDER_PASSWORD)
- Test SiteMinder manually: `curl -k -u siteminder:anaPassword01 https://casso.cx.anapartner.net/`

### Frontend can't connect
- Ensure backend is running on port 3000
- Check `./status.sh`
- Open browser console for errors

### Port already in use
- Stop existing services: `./stop-all.sh`
- Check what's using the port: `lsof -i :3000` or `lsof -i :8080`

## System Information

- **SiteMinder URL**: https://casso.cx.anapartner.net
- **Server IP**: 10.128.0.56
- **Backend Port**: 3000
- **Frontend Port**: 8080

## Next Steps

1. Add more MCP tools (create/update operations)
2. Implement user authentication for frontend
3. Add conversation persistence
4. Create more sophisticated UI
5. Add real-time notifications
6. Implement role-based access control

## License

MIT

## Support

For issues or questions, check:
- SiteMinder Docs: https://techdocs.broadcom.com/
- MCP Docs: https://modelcontextprotocol.io/
- Anthropic Docs: https://docs.anthropic.com/
