/**
 * TypeScript type definitions for the ChatGPT MCP Server
 */

import { z } from 'zod';

// Liability insurance configuration
export interface LiabilityConfiguration {
  zipCode: string;
  tariffLine: 'basic' | 'comfort' | 'premium';
  familyCoverage: boolean;
  dronesCoverage: boolean;
  deductibleAmount: 0 | 150 | 300 | 500;
  previousInsurance: boolean;
  numberOfClaims: number;
  cancelledByInsurer: boolean;
  effectiveDate: string;
  coverageAmount?: number;
}

// Liability quote result
export interface LiabilityQuote {
  quoteId: string;
  monthlyPremium: number;
  annualPremium: number;
  currency: string;
  coverageSum: number;
  deductible: number;
  territory: string;
  includedRisks: string[];
  extensions: string[];
  validUntil: string;
  tariffLine: string;
  familyCoverage: boolean;
}

// MCP tool result for AI consumption
export interface LiabilityQuoteResult {
  success: boolean;
  quote?: LiabilityQuote;
  error?: string;
  summary: string;
}

// Input validation schema using Zod
export const LiabilityQuoteInputSchema = z.object({
  zipCode: z.string().length(5).regex(/^\d{5}$/, 'Must be a 5-digit German postal code'),
  tariffLine: z.enum(['basic', 'comfort', 'premium'], {
    description: 'Coverage level: basic (€5M), comfort (€10M), or premium (€20M)',
  }),
  familyCoverage: z.boolean().default(false).describe('Include family members in coverage'),
  dronesCoverage: z.boolean().default(false).describe('Include drone liability coverage'),
  deductibleAmount: z.enum([0, 150, 300, 500] as const, {
    description: 'Deductible amount in EUR (higher deductible = lower premium)',
  }).default(0),
  previousInsurance: z.boolean().default(false).describe('Had previous liability insurance'),
  numberOfClaims: z.number().int().min(0).max(10).default(0).describe('Number of claims in last 5 years'),
  cancelledByInsurer: z.boolean().default(false).describe('Previously cancelled by insurer'),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be in YYYY-MM-DD format').describe('Policy start date'),
  coverageAmount: z.number().int().min(5000000).max(20000000).optional().describe('Custom coverage amount in EUR'),
});

export type LiabilityQuoteInput = z.infer<typeof LiabilityQuoteInputSchema>;

// MCP Tool interface
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: z.ZodType<any>;
  handler: (params: any) => Promise<any>;
}

// Error types
export class ValidationError extends Error {
  constructor(message: string, public details?: string[]) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class QuoteCalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuoteCalculationError';
  }
}
