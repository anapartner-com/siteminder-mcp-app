# SiteMinder MCP App - Quick Start Guide

## 🚀 Access the Application

### Your Server Details
- **Public IP**: `YOUR_SERVER_IP`
- **Private IP**: `YOUR_SERVER_IP`
- **Frontend Port**: `8080`
- **Backend Port**: `3000`

### Access URLs

#### Option 1: From the Server (Local)
```
http://localhost:8080
```

#### Option 2: From Your Network (Private IP)
```
http://YOUR_SERVER_IP:8080
```

#### Option 3: From Internet (Public IP) ⭐ RECOMMENDED
```
http://YOUR_SERVER_IP:8080
```

### 📱 Quick Access

Open your browser and navigate to:
```
http://YOUR_SERVER_IP:8080
```

---

## 🔧 Managing the Application

### Start All Services
```bash
cd /home/madhu_telugu/siteminder-mcp-app
./start-all.sh
```

### Check Status
```bash
./status.sh
```

### Stop All Services
```bash
./stop-all.sh
```

### View Logs
```bash
# Backend logs (includes MCP server)
tail -f logs/backend.log

# Frontend logs
tail -f logs/frontend.log
```

---

## 🔐 Firewall Configuration

### Check if Ports are Open
```bash
# Check if port 8080 is accessible
curl http://localhost:8080

# From another machine
curl http://YOUR_SERVER_IP:8080
```

### Open Ports on GCP (if needed)
```bash
# Allow port 8080 for frontend
gcloud compute firewall-rules create allow-siteminder-frontend \
  --allow tcp:8080 \
  --description="Allow SiteMinder MCP Frontend" \
  --direction=INGRESS

# Allow port 3000 for backend
gcloud compute firewall-rules create allow-siteminder-backend \
  --allow tcp:3000 \
  --description="Allow SiteMinder MCP Backend" \
  --direction=INGRESS
```

Or via GCP Console:
1. Go to VPC Network → Firewall
2. Create Firewall Rule
3. Add ports: `8080, 3000`
4. Source IP ranges: `0.0.0.0/0` (for public access)

---

## 🎯 Using the Application

### 1. Open the Web UI
Navigate to: **http://YOUR_SERVER_IP:8080**

### 2. Try These Commands
- `List all user directories`
- `Show me all domains`
- `List all agents`
- `Check system health`
- `Show active sessions`
- `List all realms`

### 3. Enable Debug Mode
Click the **🐛 Debug** button to see:
- Claude API requests/responses
- MCP tool calls
- SiteMinder API responses

---

## 🔍 Troubleshooting

### Can't Access from Browser?

**Check if services are running:**
```bash
cd /home/madhu_telugu/siteminder-mcp-app
./status.sh
```

**Check firewall:**
```bash
# Test from server
curl http://localhost:8080

# Check what's listening
netstat -tlnp | grep -E '8080|3000'
```

**Check GCP firewall rules:**
```bash
gcloud compute firewall-rules list | grep -E '8080|3000'
```

### Services Not Starting?

**Check logs:**
```bash
tail -f logs/backend.log
tail -f logs/frontend.log
```

**Restart services:**
```bash
./stop-all.sh
./start-all.sh
```

### SiteMinder Connection Issues?

The app is configured to connect to:
- **URL**: https://casso.cx.anapartner.net
- **User**: siteminder
- **Password**: anaPassword01

If DNS doesn't resolve, check `.env` file and update to use local SiteMinder:
```bash
SITEMINDER_BASE_URL=https://localhost
```

Then restart:
```bash
./stop-all.sh
./start-all.sh
```

---

## 📊 System Architecture

```
Internet/Browser (http://YOUR_SERVER_IP:8080)
        ↓
    Frontend Server (Port 8080)
        ↓
    Backend Server (Port 3000)
        ↓
    Claude API (Anthropic)
        ↓
    MCP Server (stdio)
        ↓
    SiteMinder Policy Server
```

---

## 🔗 Important URLs

| Service | Local | Private Network | Public Internet |
|---------|-------|-----------------|-----------------|
| **Frontend** | http://localhost:8080 | http://YOUR_SERVER_IP:8080 | **http://YOUR_SERVER_IP:8080** |
| **Backend** | http://localhost:3000 | http://YOUR_SERVER_IP:3000 | http://YOUR_SERVER_IP:3000 |
| **Backend Health** | http://localhost:3000/api/health | http://YOUR_SERVER_IP:3000/api/health | http://YOUR_SERVER_IP:3000/api/health |

---

## 🎨 Example Chat Queries

Try asking Claude these questions:

1. **Basic Info**
   - "What can you tell me about this SiteMinder setup?"
   - "How many user directories are configured?"

2. **List Resources**
   - "List all domains"
   - "Show me all agents"
   - "What realms exist?"

3. **Health & Monitoring**
   - "Check system health"
   - "Show active sessions"
   - "Get audit logs"

4. **Specific Details**
   - "Get details of domain XYZ"
   - "Show me agent ABC"
   - "Describe realm DEF"

---

## 📱 Mobile Access

The UI is responsive and works on mobile devices!

Access from your phone: **http://YOUR_SERVER_IP:8080**

---

## 🛡️ Security Notes

⚠️ **For Production:**
1. Add authentication to the frontend
2. Enable HTTPS with SSL certificates
3. Restrict firewall to specific IPs
4. Use environment-specific API keys
5. Enable rate limiting

---

## 📞 Need Help?

1. Check logs: `tail -f logs/backend.log`
2. Verify status: `./status.sh`
3. Restart: `./stop-all.sh && ./start-all.sh`
4. Review README.md for detailed documentation

---

## ✅ Quick Checklist

- [ ] Services running: `./status.sh`
- [ ] Ports open: Check firewall rules
- [ ] Can access: http://YOUR_SERVER_IP:8080
- [ ] Backend healthy: http://YOUR_SERVER_IP:3000/api/health
- [ ] Chat works: Try sending a message

---

**🎉 Enjoy using your SiteMinder AI Assistant!**
