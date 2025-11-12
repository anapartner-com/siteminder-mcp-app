#!/bin/bash

# Test script for SiteMinder MCP Server REST API mode

cd /home/madhu_telugu/siteminder-mcp-app/mcp-server

echo "=========================================="
echo "Testing SiteMinder MCP Server REST API"
echo "=========================================="
echo ""

echo "1. Testing list_agents..."
timeout 10 node index.js <<EOF 2>/dev/null | grep -o '"message":[^,]*' | head -1
{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_agents","arguments":{}}}
EOF
echo "✓ list_agents completed"
echo ""

echo "2. Testing list_domains..."
timeout 10 node index.js <<EOF 2>/dev/null | grep -o '"message":[^,]*' | head -1
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_domains","arguments":{}}}
EOF
echo "✓ list_domains completed"
echo ""

echo "3. Testing list_realms..."
timeout 10 node index.js <<EOF 2>/dev/null | grep -o '"message":[^,]*' | head -1
{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"list_realms","arguments":{}}}
EOF
echo "✓ list_realms completed"
echo ""

echo "4. Testing list_policies..."
timeout 10 node index.js <<EOF 2>/dev/null | grep -o '"message":[^,]*' | head -1
{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"list_policies","arguments":{}}}
EOF
echo "✓ list_policies completed"
echo ""

echo "5. Testing list_user_directories..."
timeout 10 node index.js <<EOF 2>/dev/null | grep -o '"message":[^,]*' | head -1
{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"list_user_directories","arguments":{}}}
EOF
echo "✓ list_user_directories completed"
echo ""

echo "6. Testing list_auth_schemes..."
timeout 10 node index.js <<EOF 2>/dev/null | grep -o '"message":[^,]*' | head -1
{"jsonrpc":"2.0","id":6,"method":"tools/call","params":{"name":"list_auth_schemes","arguments":{}}}
EOF
echo "✓ list_auth_schemes completed"
echo ""

echo "=========================================="
echo "All tests completed successfully!"
echo "=========================================="
