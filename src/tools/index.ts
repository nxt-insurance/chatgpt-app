/**
 * Tool Registry
 * Exports all MCP tools
 */

import { createLiabilityQuoteTool } from './liability-quote-tool.js';
import { MCPTool } from '../types/index.js';

export function getAllTools(): MCPTool[] {
  return [
    createLiabilityQuoteTool(),
  ];
}

export { createLiabilityQuoteTool };
