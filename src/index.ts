/**
 * ChatGPT MCP Server Entry Point
 * Provides liability insurance quotes via Model Context Protocol
 */

import { MCPServer } from './server/mcp-server.js';

async function main(): Promise<void> {
  try {
    const server = new MCPServer();
    await server.start();
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

main();
