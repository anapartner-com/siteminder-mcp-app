// LLM Provider abstraction layer
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fetch from 'node-fetch';

const LLM_PROVIDER = process.env.LLM_PROVIDER || 'anthropic';

// Initialize clients
const anthropic = LLM_PROVIDER === 'anthropic' ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}) : null;

const genAI = LLM_PROVIDER === 'gemini' ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Custom LLM configuration
let customLLMToken = null;
const CUSTOM_LLM_URL = process.env.CUSTOM_LLM_URL;
const CUSTOM_LLM_USERNAME = process.env.CUSTOM_LLM_USERNAME;
const CUSTOM_LLM_PASSWORD = process.env.CUSTOM_LLM_PASSWORD;

console.log(`🤖 Using LLM Provider: ${LLM_PROVIDER}`);

// Convert MCP tools to Gemini function declarations
function convertToolsToGemini(mcpTools) {
  return mcpTools.map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.inputSchema
  }));
}

// Authenticate with custom LLM (Open WebUI)
async function authenticateCustomLLM() {
  if (customLLMToken) return customLLMToken;

  const response = await fetch(`${CUSTOM_LLM_URL}/api/v1/auths/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: CUSTOM_LLM_USERNAME,
      password: CUSTOM_LLM_PASSWORD
    })
  });

  const data = await response.json();
  customLLMToken = data.token;
  console.log('✅ Authenticated with custom LLM');
  return customLLMToken;
}

// Call LLM with unified interface
export async function callLLM({ message, conversationHistory = [], tools = [] }) {
  if (LLM_PROVIDER === 'anthropic') {
    return await callAnthropic({ message, conversationHistory, tools });
  } else if (LLM_PROVIDER === 'gemini') {
    return await callGemini({ message, conversationHistory, tools });
  } else if (LLM_PROVIDER === 'custom') {
    return await callCustomLLM({ message, conversationHistory, tools });
  }
  throw new Error(`Unknown LLM provider: ${LLM_PROVIDER}`);
}

// Anthropic implementation
async function callAnthropic({ message, conversationHistory, tools }) {
  const messages = [
    ...conversationHistory,
    {
      role: 'user',
      content: message,
    },
  ];

  const claudeTools = tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema,
  }));

  const response = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 4096,
    tools: claudeTools,
    messages: messages,
  });

  return {
    provider: 'anthropic',
    response,
    needsToolCall: response.stop_reason === 'tool_use',
    toolCalls: response.content.filter(block => block.type === 'tool_use'),
    textResponse: response.content.find(block => block.type === 'text')?.text,
    messages,
  };
}

// Gemini implementation with function calling
async function callGemini({ message, conversationHistory, tools }) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    tools: tools.length > 0 ? [{ functionDeclarations: convertToolsToGemini(tools) }] : undefined,
  });

  // Build chat history
  const history = conversationHistory.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) }],
  }));

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(message);
  const response = result.response;

  // Check for function calls
  const functionCalls = response.functionCalls?.() || [];

  return {
    provider: 'gemini',
    response,
    needsToolCall: functionCalls.length > 0,
    toolCalls: functionCalls.map(fc => ({
      name: fc.name,
      input: fc.args,
      id: `gemini_${Date.now()}`,
    })),
    textResponse: response.text(),
    chat,
    history,
  };
}

// Custom LLM implementation (OpenAI-compatible API)
async function callCustomLLM({ message, conversationHistory, tools }) {
  const token = await authenticateCustomLLM();

  const messages = [
    ...conversationHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
    })),
    {
      role: 'user',
      content: message
    }
  ];

  // Convert tools to OpenAI format
  const openaiTools = tools.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema
    }
  }));

  const response = await fetch(`${CUSTOM_LLM_URL}/api/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama3.2:latest',
      messages: messages,
      tools: openaiTools.length > 0 ? openaiTools : undefined,
      tool_choice: 'auto'
    })
  });

  const data = await response.json();

  if (!data.choices || !data.choices[0]) {
    console.error('Invalid response from custom LLM:', data);
    throw new Error(`Custom LLM error: ${data.detail || JSON.stringify(data)}`);
  }

  const result = data.choices[0];
  const toolCalls = result.message.tool_calls || [];

  return {
    provider: 'custom',
    response: result,
    needsToolCall: toolCalls.length > 0,
    toolCalls: toolCalls.map(tc => ({
      id: tc.id,
      name: tc.function.name,
      input: JSON.parse(tc.function.arguments)
    })),
    textResponse: result.message.content,
    messages: [...messages, result.message]
  };
}

// Continue conversation after tool call
export async function continueWithToolResult({ provider, toolResult, previousState, tools }) {
  if (provider === 'anthropic') {
    return await continueAnthropicWithToolResult({ toolResult, previousState, tools });
  } else if (provider === 'gemini') {
    return await continueGeminiWithToolResult({ toolResult, previousState, tools });
  } else if (provider === 'custom') {
    return await continueCustomLLMWithToolResult({ toolResult, previousState, tools });
  }
  throw new Error(`Unknown LLM provider: ${provider}`);
}

async function continueAnthropicWithToolResult({ toolResult, previousState, tools }) {
  const { messages, response } = previousState;

  messages.push({
    role: 'assistant',
    content: response.content,
  });

  messages.push({
    role: 'user',
    content: [
      {
        type: 'tool_result',
        tool_use_id: toolResult.tool_use_id,
        content: toolResult.content,
      },
    ],
  });

  const claudeTools = tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema,
  }));

  const newResponse = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 4096,
    tools: claudeTools,
    messages: messages,
  });

  return {
    provider: 'anthropic',
    response: newResponse,
    needsToolCall: newResponse.stop_reason === 'tool_use',
    toolCalls: newResponse.content.filter(block => block.type === 'tool_use'),
    textResponse: newResponse.content.find(block => block.type === 'text')?.text,
    messages,
  };
}

async function continueGeminiWithToolResult({ toolResult, previousState, tools }) {
  const { chat } = previousState;

  // Send function response back to Gemini
  const functionResponse = {
    functionResponse: {
      name: toolResult.name,
      response: {
        result: toolResult.content,
      },
    },
  };

  const result = await chat.sendMessage([functionResponse]);
  const response = result.response;

  const functionCalls = response.functionCalls?.() || [];

  return {
    provider: 'gemini',
    response,
    needsToolCall: functionCalls.length > 0,
    toolCalls: functionCalls.map(fc => ({
      name: fc.name,
      input: fc.args,
      id: `gemini_${Date.now()}`,
    })),
    textResponse: response.text(),
    chat,
  };
}

async function continueCustomLLMWithToolResult({ toolResult, previousState, tools }) {
  const token = await authenticateCustomLLM();
  const { messages } = previousState;

  // Add tool result to conversation
  messages.push({
    role: 'tool',
    tool_call_id: toolResult.tool_use_id,
    content: toolResult.content
  });

  // Convert tools to OpenAI format
  const openaiTools = tools.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema
    }
  }));

  const response = await fetch(`${CUSTOM_LLM_URL}/api/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama3.2:latest',
      messages: messages,
      tools: openaiTools.length > 0 ? openaiTools : undefined,
      tool_choice: 'auto'
    })
  });

  const data = await response.json();

  if (!data.choices || !data.choices[0]) {
    console.error('Invalid response from custom LLM:', data);
    throw new Error(`Custom LLM error: ${data.detail || JSON.stringify(data)}`);
  }

  const result = data.choices[0];
  const toolCalls = result.message.tool_calls || [];

  return {
    provider: 'custom',
    response: result,
    needsToolCall: toolCalls.length > 0,
    toolCalls: toolCalls.map(tc => ({
      id: tc.id,
      name: tc.function.name,
      input: JSON.parse(tc.function.arguments)
    })),
    textResponse: result.message.content,
    messages: [...messages, result.message]
  };
}

export function getProviderName() {
  return LLM_PROVIDER;
}
