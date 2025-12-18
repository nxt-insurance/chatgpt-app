/**
 * Liability Quote MCP Tool
 * Exposed to ChatGPT/Claude for quote calculations
 */

import { LiabilityClient } from '../clients/liability-client.js';
import {
  LiabilityQuoteInputSchema,
  LiabilityQuoteResult,
  ValidationError,
  MCPTool,
} from '../types/index.js';

export function createLiabilityQuoteTool(): MCPTool {
  const client = new LiabilityClient();

  return {
    name: 'get_liability_quote',
    description: 'Calculate anonymous liability insurance quote for Germany. Supports basic, comfort, and premium coverage levels with optional family and drone coverage. Returns monthly and annual premiums.',
    inputSchema: LiabilityQuoteInputSchema,
    handler: async (params): Promise<LiabilityQuoteResult> => {
      try {
        const quote = await client.calculateQuote(params);
        const summary = client.formatQuoteSummary(quote);

        return {
          success: true,
          quote,
          summary,
        };
      } catch (error) {
        if (error instanceof ValidationError) {
          return {
            success: false,
            error: `Validation error: ${error.message}`,
            summary: `Failed to calculate quote: ${error.details?.join(', ') || error.message}`,
          };
        }

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          summary: 'Failed to calculate quote due to an unexpected error',
        };
      }
    },
  };
}
