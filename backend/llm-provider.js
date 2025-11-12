// LLM Provider abstraction layer
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

const LLM_PROVIDER = process.env.LLM_PROVIDER || 'anthropic';

// Initialize clients
const anthropic = LLM_PROVIDER === 'anthropic' ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}) : null;

const genAI = LLM_PROVIDER === 'gemini' ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

console.log(`🤖 Using LLM Provider: ${LLM_PROVIDER}`);

// Convert MCP tools to Gemini function declarations
function convertToolsToGemini(mcpTools) {
  return mcpTools.map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.inputSchema
  }));
}

// Call LLM with unified interface
export async function callLLM({ message, conversationHistory = [], tools = [] }) {
  if (LLM_PROVIDER === 'anthropic') {
    return await callAnthropic({ message, conversationHistory, tools });
  } else if (LLM_PROVIDER === 'gemini') {
    return await callGemini({ message, conversationHistory, tools });
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

// Continue conversation after tool call
export async function continueWithToolResult({ provider, toolResult, previousState, tools }) {
  if (provider === 'anthropic') {
    return await continueAnthropicWithToolResult({ toolResult, previousState, tools });
  } else if (provider === 'gemini') {
    return await continueGeminiWithToolResult({ toolResult, previousState, tools });
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

export function getProviderName() {
  return LLM_PROVIDER;
}
