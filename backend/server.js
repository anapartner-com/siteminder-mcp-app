import express from 'express';
import cors from 'cors';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { callLLM, continueWithToolResult, getProviderName } from './llm-provider.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// MCP Client
let mcpClient = null;
let availableTools = [];

// Initialize MCP connection
async function initializeMCP() {
  const serverPath = path.join(__dirname, '../mcp-server/index.js');

  // Spawn MCP server as subprocess
  const serverProcess = spawn('node', [serverPath], {
    env: {
      ...process.env,
      SITEMINDER_BASE_URL: process.env.SITEMINDER_BASE_URL || 'https://casso.cx.anapartner.net',
      SITEMINDER_USER: process.env.SITEMINDER_USER || 'siteminder',
      SITEMINDER_PASSWORD: process.env.SITEMINDER_PASSWORD || 'anaPassword01',
    }
  });

  // Handle server errors
  serverProcess.stderr.on('data', (data) => {
    console.error(`MCP Server: ${data}`);
  });

  // Create MCP client
  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverPath],
    env: {
      ...process.env,
      SITEMINDER_BASE_URL: process.env.SITEMINDER_BASE_URL || 'https://casso.cx.anapartner.net',
      SITEMINDER_USER: process.env.SITEMINDER_USER || 'siteminder',
      SITEMINDER_PASSWORD: process.env.SITEMINDER_PASSWORD || 'anaPassword01',
    }
  });

  mcpClient = new Client({
    name: 'siteminder-backend-client',
    version: '1.0.0',
  }, {
    capabilities: {},
  });

  await mcpClient.connect(transport);

  // Get available tools
  const toolsResponse = await mcpClient.listTools();
  availableTools = toolsResponse.tools;

  console.log('MCP Client connected. Available tools:', availableTools.map(t => t.name));
}

// Endpoint: Chat with LLM about SiteMinder
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check if debug mode is enabled
    const debugMode = message.toLowerCase().includes('debug');
    const debugInfo = {
      enabled: debugMode,
      provider: getProviderName(),
      interactions: []
    };

    // Call LLM with available tools
    let llmState = await callLLM({
      message,
      conversationHistory,
      tools: availableTools
    });

    if (debugMode) {
      debugInfo.interactions.push({
        type: 'llm_request',
        timestamp: new Date().toISOString(),
        provider: llmState.provider,
      });
      debugInfo.interactions.push({
        type: 'llm_response',
        timestamp: new Date().toISOString(),
        payload: llmState.response,
      });
    }

    // Process tool calls if any
    while (llmState.needsToolCall && llmState.toolCalls.length > 0) {
      const toolCall = llmState.toolCalls[0];

      console.log(`Calling tool: ${toolCall.name} with args:`, toolCall.input);

      if (debugMode) {
        debugInfo.interactions.push({
          type: 'tool_call',
          timestamp: new Date().toISOString(),
          tool: toolCall.name,
          payload: toolCall.input,
        });
      }

      // Call MCP tool
      const toolResult = await mcpClient.callTool({
        name: toolCall.name,
        arguments: toolCall.input || {},
      });

      console.log('Tool result:', toolResult);

      if (debugMode) {
        debugInfo.interactions.push({
          type: 'tool_result',
          timestamp: new Date().toISOString(),
          tool: toolCall.name,
          payload: toolResult,
        });
      }

      // Continue conversation with tool result
      llmState = await continueWithToolResult({
        provider: llmState.provider,
        toolResult: {
          tool_use_id: toolCall.id,
          name: toolCall.name,
          content: toolResult.content[0].text,
        },
        previousState: llmState,
        tools: availableTools
      });

      if (debugMode) {
        debugInfo.interactions.push({
          type: 'llm_response',
          timestamp: new Date().toISOString(),
          payload: llmState.response,
        });
      }
    }

    res.json({
      response: llmState.textResponse || 'No response',
      conversationHistory: llmState.messages || conversationHistory,
      debug: debugMode ? debugInfo : undefined,
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: error.message,
      details: error.response?.data || error.stack
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mcpConnected: mcpClient !== null,
    availableTools: availableTools.map(t => t.name)
  });
});

// Start server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces

initializeMCP()
  .then(() => {
    app.listen(PORT, HOST, () => {
      console.log(`Backend server running on http://${HOST}:${PORT}`);
      console.log(`Accessible at: http://localhost:${PORT} and http://<your-ip>:${PORT}`);
      console.log(`Connected to MCP with tools: ${availableTools.map(t => t.name).join(', ')}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize MCP:', error);
    process.exit(1);
  });
