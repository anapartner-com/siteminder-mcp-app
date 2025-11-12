# SiteMinder MCP Server - REST API Mode

## Overview

The SiteMinder MCP server has been updated to use the official **SiteMinder REST API** instead of web scraping. This provides:

- **Better reliability** - No dependency on HTML structure
- **Official API support** - Uses documented Broadcom SiteMinder APIs
- **More features** - Access to full object details and relationships
- **Better performance** - Direct API calls instead of parsing HTML

## Authentication

The server uses the SiteMinder Administrative Token API for authentication:

1. **Initial Authentication**: POST to `/ca/api/sso/services/login/v1/token` with Basic Auth
2. **JWT Token**: Receives a JWT token (sessionkey) valid for ~1 hour
3. **Subsequent Calls**: Uses Bearer token authentication with the JWT

### Authentication Flow

```javascript
// Get JWT token
POST /ca/api/sso/services/login/v1/token
Authorization: Basic <base64(username:password)>
Body: {"username": "siteminder", "password": "anaPassword01"}

Response: {"sessionkey": "eyJlbmMi..."}

// Use token for API calls
GET /ca/api/sso/services/policy/v1/SmAgents
Authorization: Bearer eyJlbmMi...
```

## Available Tools

### 1. list_agents
Lists all SiteMinder policy server agents.

**Usage:**
```json
{
  "name": "list_agents",
  "arguments": {}
}
```

**Response:**
```json
{
  "message": "Found 4 agents",
  "count": 4,
  "agents": [
    {
      "id": "CA.SM::Agent@01-xxx",
      "path": "/SmAgents/sps_agent",
      "href": "https://...../objects/CA.SM::Agent@01-xxx",
      "desc": "SPS Web Agent"
    }
  ]
}
```

### 2. get_agent
Get detailed information about a specific agent.

**Parameters:**
- `agent_id` (string): Agent ID or name

**Usage:**
```json
{
  "name": "get_agent",
  "arguments": {
    "agent_id": "sps_agent"
  }
}
```

### 3. list_domains
Lists all SiteMinder domains.

### 4. get_domain
Get details of a specific domain by ID.

**Parameters:**
- `domain_id` (string): Domain ID (e.g., CA.SM::Domain@03-xxx)

### 5. list_realms
Lists all SiteMinder realms.

### 6. list_policies
Lists all SiteMinder policies.

### 7. list_user_directories
Lists all SiteMinder user directories.

### 8. list_auth_schemes
Lists all authentication schemes.

### 9. list_policy_servers
Lists all policy servers.

### 10. get_object
Get any SiteMinder object by its ID with full details.

**Parameters:**
- `object_id` (string): Object ID (e.g., CA.SM::Agent@01-xxx)

**Usage:**
```json
{
  "name": "get_object",
  "arguments": {
    "object_id": "CA.SM::Agent@01-000ca6fb-970c-18fb-9682-00150a2a0000"
  }
}
```

**Response includes:**
- Full object data
- Related links (self, usedby, classinfo, editinfo)
- Object type and attributes

## API Endpoints Used

### Authentication
- `POST /ca/api/sso/services/login/v1/token` - Get JWT token

### Policy Data API (v1)
All endpoints require Bearer token authentication:

- `GET /ca/api/sso/services/policy/v1/SmAgents` - List agents
- `GET /ca/api/sso/services/policy/v1/SmAgents/{name}` - Get agent by name
- `GET /ca/api/sso/services/policy/v1/SmDomains` - List domains
- `GET /ca/api/sso/services/policy/v1/SmRealms` - List realms
- `GET /ca/api/sso/services/policy/v1/SmPolicies` - List policies
- `GET /ca/api/sso/services/policy/v1/SmUserDirs` - List user directories
- `GET /ca/api/sso/services/policy/v1/SmAuthSchemes` - List auth schemes
- `GET /ca/api/sso/services/policy/v1/SmPolicyServers` - List policy servers
- `GET /ca/api/sso/services/policy/v1/objects/{id}` - Get any object by ID

## Configuration

Set these environment variables in `.env`:

```bash
SITEMINDER_BASE_URL=https://casso.cx.anapartner.net
SITEMINDER_USER=siteminder
SITEMINDER_PASSWORD=anaPassword01
```

## Testing

### Test tool listing:
```bash
cd /home/madhu_telugu/siteminder-mcp-app/mcp-server
node index.js <<EOF
{"jsonrpc":"2.0","id":1,"method":"tools/list"}
EOF
```

### Test list_agents:
```bash
node index.js <<EOF
{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_agents","arguments":{}}}
EOF
```

### Test get_agent:
```bash
node index.js <<EOF
{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_agent","arguments":{"agent_id":"sps_agent"}}}
EOF
```

## Response Format

All API responses follow the SiteMinder REST API format:

```json
{
  "responseType": "links" | "object",
  "path": "children",
  "xpsclass": "SmAgents",
  "data": [...],
  "links": {...}
}
```

The MCP server extracts and formats this data for easy consumption.

## Error Handling

- **Authentication failures**: Automatic re-authentication on token expiry
- **API errors**: Detailed error messages with status codes
- **SSL/TLS**: Self-signed certificates are accepted (rejectUnauthorized: false)

## Advantages over Web Scraping

1. **Stable API**: Official REST API endpoints won't change like HTML structure
2. **Complete data**: Access to all object properties and relationships
3. **Better performance**: Direct JSON responses vs HTML parsing
4. **Programmatic access**: Standard REST API operations
5. **Documentation**: Official Swagger/OpenAPI documentation available

## API Documentation

Full API documentation available at:
- https://casso.cx.anapartner.net/ca/api/sso/services/v1/api-doc/?url=CA.SM.json
- Swagger UI with all endpoints, parameters, and schemas

## Version

- **MCP Server Version**: 2.0.0
- **SiteMinder API Version**: v1 (Policy Data API)
- **Last Updated**: 2025-11-12
