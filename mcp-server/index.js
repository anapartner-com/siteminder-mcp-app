#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import https from 'https';

// SiteMinder Configuration
const SITEMINDER_BASE_URL = process.env.SITEMINDER_BASE_URL || 'https://casso.cx.anapartner.net';
const SITEMINDER_USER = process.env.SITEMINDER_USER || 'siteminder';
const SITEMINDER_PASSWORD = process.env.SITEMINDER_PASSWORD || 'anaPassword01';

// Create HTTPS agent that ignores self-signed certificates
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// Create axios instance for REST API
const siteminderClient = axios.create({
  baseURL: SITEMINDER_BASE_URL,
  httpsAgent: httpsAgent,
  timeout: 30000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Session state
let jwtToken = null;
let tokenExpiry = null;

// Authenticate with SiteMinder REST API using Basic Auth to get JWT token
async function authenticate() {
  try {
    console.error('🔐 Authenticating with SiteMinder REST API...');

    const response = await siteminderClient.post(
      '/ca/api/sso/services/login/v1/token',
      {
        username: SITEMINDER_USER,
        password: SITEMINDER_PASSWORD
      },
      {
        auth: {
          username: SITEMINDER_USER,
          password: SITEMINDER_PASSWORD
        }
      }
    );

    if (response.data && response.data.sessionkey) {
      jwtToken = response.data.sessionkey;
      // Token typically expires after some time, we'll set a 1 hour expiry
      tokenExpiry = Date.now() + (60 * 60 * 1000);
      console.error('✅ JWT token obtained');
      return true;
    }

    console.error('❌ Authentication failed - no token received');
    return false;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Ensure we have a valid token
async function ensureAuthenticated() {
  if (!jwtToken || Date.now() >= tokenExpiry) {
    await authenticate();
  }
}

// Make authenticated REST API call
async function apiCall(method, path, data = null) {
  await ensureAuthenticated();

  const config = {
    method: method,
    url: path,
    headers: {
      'Authorization': `Bearer ${jwtToken}`
    }
  };

  if (data) {
    config.data = data;
  }

  try {
    const response = await siteminderClient(config);
    return response.data;
  } catch (error) {
    console.error(`API call failed: ${method} ${path}`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

// Create MCP Server
const server = new Server(
  {
    name: 'siteminder-mcp-server',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_agents',
        description: 'List all SiteMinder policy server agents via REST API',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_agent',
        description: 'Get details of a specific SiteMinder agent by name or ID',
        inputSchema: {
          type: 'object',
          properties: {
            agent_id: {
              type: 'string',
              description: 'Agent ID (e.g., CA.SM::Agent@01-xxx) or name',
            },
          },
          required: ['agent_id'],
        },
      },
      {
        name: 'list_domains',
        description: 'List all SiteMinder domains via REST API',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_domain',
        description: 'Get details of a specific SiteMinder domain by ID',
        inputSchema: {
          type: 'object',
          properties: {
            domain_id: {
              type: 'string',
              description: 'Domain ID (e.g., CA.SM::Domain@03-xxx)',
            },
          },
          required: ['domain_id'],
        },
      },
      {
        name: 'list_realms',
        description: 'List all SiteMinder realms via REST API',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'list_policies',
        description: 'List all SiteMinder policies via REST API',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'list_user_directories',
        description: 'List all SiteMinder user directories via REST API',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'list_auth_schemes',
        description: 'List all SiteMinder authentication schemes via REST API',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'list_policy_servers',
        description: 'List all SiteMinder policy servers via REST API',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_object',
        description: 'Get any SiteMinder object by its ID with full details',
        inputSchema: {
          type: 'object',
          properties: {
            object_id: {
              type: 'string',
              description: 'Object ID (e.g., CA.SM::Agent@01-xxx)',
            },
          },
          required: ['object_id'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;

    switch (name) {
      case 'list_agents':
        console.error('Fetching agents via REST API...');
        const agentsData = await apiCall('GET', '/ca/api/sso/services/policy/v1/SmAgents');
        result = {
          message: `Found ${agentsData.data?.length || 0} agents`,
          count: agentsData.data?.length || 0,
          agents: agentsData.data,
          note: 'Data retrieved from SiteMinder REST API'
        };
        break;

      case 'get_agent':
        console.error(`Fetching agent: ${args.agent_id}...`);
        // If it's not an ID format, try to get by name
        let agentPath;
        if (args.agent_id.startsWith('CA.SM::')) {
          agentPath = `/ca/api/sso/services/policy/v1/objects/${args.agent_id}`;
        } else {
          agentPath = `/ca/api/sso/services/policy/v1/SmAgents/${args.agent_id}`;
        }
        const agentData = await apiCall('GET', agentPath);
        result = {
          message: `Agent details for ${args.agent_id}`,
          agent: agentData.data,
          note: 'Data retrieved from SiteMinder REST API'
        };
        break;

      case 'list_domains':
        console.error('Fetching domains via REST API...');
        const domainsData = await apiCall('GET', '/ca/api/sso/services/policy/v1/SmDomains');
        result = {
          message: `Found ${domainsData.data?.length || 0} domains`,
          count: domainsData.data?.length || 0,
          domains: domainsData.data,
          note: 'Data retrieved from SiteMinder REST API'
        };
        break;

      case 'get_domain':
        console.error(`Fetching domain: ${args.domain_id}...`);
        const domainData = await apiCall('GET', `/ca/api/sso/services/policy/v1/objects/${args.domain_id}`);
        result = {
          message: `Domain details for ${args.domain_id}`,
          domain: domainData.data,
          note: 'Data retrieved from SiteMinder REST API'
        };
        break;

      case 'list_realms':
        console.error('Fetching realms via REST API...');
        const realmsData = await apiCall('GET', '/ca/api/sso/services/policy/v1/SmRealms');
        result = {
          message: `Found ${realmsData.data?.length || 0} realms`,
          count: realmsData.data?.length || 0,
          realms: realmsData.data,
          note: 'Data retrieved from SiteMinder REST API'
        };
        break;

      case 'list_policies':
        console.error('Fetching policies via REST API...');
        const policiesData = await apiCall('GET', '/ca/api/sso/services/policy/v1/SmPolicies');
        result = {
          message: `Found ${policiesData.data?.length || 0} policies`,
          count: policiesData.data?.length || 0,
          policies: policiesData.data,
          note: 'Data retrieved from SiteMinder REST API'
        };
        break;

      case 'list_user_directories':
        console.error('Fetching user directories via REST API...');
        const userDirsData = await apiCall('GET', '/ca/api/sso/services/policy/v1/SmUserDirs');
        result = {
          message: `Found ${userDirsData.data?.length || 0} user directories`,
          count: userDirsData.data?.length || 0,
          directories: userDirsData.data,
          note: 'Data retrieved from SiteMinder REST API'
        };
        break;

      case 'list_auth_schemes':
        console.error('Fetching authentication schemes via REST API...');
        const authSchemesData = await apiCall('GET', '/ca/api/sso/services/policy/v1/SmAuthSchemes');
        result = {
          message: `Found ${authSchemesData.data?.length || 0} authentication schemes`,
          count: authSchemesData.data?.length || 0,
          schemes: authSchemesData.data,
          note: 'Data retrieved from SiteMinder REST API'
        };
        break;

      case 'list_policy_servers':
        console.error('Fetching policy servers via REST API...');
        const policyServersData = await apiCall('GET', '/ca/api/sso/services/policy/v1/SmPolicyServers');
        result = {
          message: `Found ${policyServersData.data?.length || 0} policy servers`,
          count: policyServersData.data?.length || 0,
          servers: policyServersData.data,
          note: 'Data retrieved from SiteMinder REST API'
        };
        break;

      case 'get_object':
        console.error(`Fetching object: ${args.object_id}...`);
        const objectData = await apiCall('GET', `/ca/api/sso/services/policy/v1/objects/${args.object_id}`);
        result = {
          message: `Object details for ${args.object_id}`,
          object: objectData.data,
          links: objectData.links,
          note: 'Data retrieved from SiteMinder REST API'
        };
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    console.error(`Error executing ${name}:`, error.message);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error.message,
            status: error.response?.status,
            details: error.response?.data,
            note: 'Failed to retrieve data from SiteMinder REST API'
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  console.error('🚀 Starting SiteMinder MCP Server (REST API Mode)...');
  console.error(`📡 SiteMinder URL: ${SITEMINDER_BASE_URL}`);
  console.error(`👤 User: ${SITEMINDER_USER}`);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('✅ SiteMinder MCP Server running');
  console.error('📚 Available tools: list_agents, get_agent, list_domains, get_domain, list_realms, list_policies, list_user_directories, list_auth_schemes, list_policy_servers, get_object');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
