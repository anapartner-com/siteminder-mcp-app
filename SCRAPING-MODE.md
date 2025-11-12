# ✅ SiteMinder MCP - Web Scraping Mode

## Overview

The MCP server now uses **web scraping** to extract data from the SiteMinder Admin UI, just like a browser does!

## How It Works

### Authentication Flow
1. **GET /adminui** - Establishes session
2. **POST /adminui/login/login.fcc** - Submits credentials
3. **Cookie-based session** - Maintains authentication
4. **Scrapes HTML pages** - Extracts data from Admin UI

### Available Tools (6)
- `list_user_directories` - Scrapes user directory management page
- `list_domains` - Scrapes domain management page
- `list_agents` - Scrapes agent management page
- `list_realms` - Scrapes realm management page
- `list_policies` - Scrapes policy management page
- `get_system_info` - Gets dashboard information

## Key Features

✅ **Browser-like authentication** - Uses cookies and sessions
✅ **HTML parsing** - Extracts data from tables
✅ **Auto re-authentication** - Handles session expiry
✅ **No REST API needed** - Works with any SiteMinder version

## Access Your Application

**URL**: http://34.122.218.6:8080

## Try These Queries

### Working Queries
- "List all user directories"
- "Show me all domains"
- "List all agents"
- "What realms are configured?"
- "List all policies"
- "Get system information"

### Example Conversation
**You**: "List all domains"
**AI**: *Logs in to Admin UI → Scrapes /adminui/manage/domain → Parses HTML → Returns data*

## Technical Details

### Libraries Used
- `axios` - HTTP client
- `axios-cookiejar-support` - Cookie management
- `tough-cookie` - Cookie jar

### Login Credentials
- URL: https://casso.cx.anapartner.net
- User: siteminder
- Password: anaPassword01

### Scraped Pages
- `/adminui/manage/userDirectory`
- `/adminui/manage/domain`
- `/adminui/manage/agent`
- `/adminui/manage/realm`
- `/adminui/manage/policy`
- `/adminui/home`

## Benefits

1. **Works without REST API** - Many SiteMinder versions have limited/broken REST APIs
2. **Real data** - Gets actual configured objects
3. **Session management** - Auto-handles timeouts
4. **Flexible** - Can scrape any page in Admin UI

## Limitations

1. **HTML structure dependent** - May break if UI changes
2. **Slower than REST** - Multiple requests needed
3. **Limited detail** - Only gets table/list data
4. **No modifications** - Read-only (for safety)

## Response Format

```json
{
  "message": "Found 5 domains",
  "count": 5,
  "domains": [
    {
      "type": "Domain",
      "data": ["Name", "Description", "Status"],
      "raw": "..."
    }
  ],
  "note": "Data extracted from SiteMinder Admin UI"
}
```

## Future Enhancements

- Add cheerio for better HTML parsing
- Extract more detailed information
- Add more pages (users, policies, etc.)
- Implement caching for performance
- Add write operations (with confirmation)

## Status

✅ **Operational** - All 6 tools working
✅ **Authenticated** - Session-based login working
✅ **Tested** - Ready to use

## Quick Test

1. Open: http://34.122.218.6:8080
2. Ask: "List all domains"
3. Watch the logs: `tail -f logs/backend.log`
4. See: Web scraping in action!

---

**Mode**: Web Scraping
**Version**: 2.0.0
**Status**: Production Ready 🚀
