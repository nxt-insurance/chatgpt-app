/**
 * Liability Insurance Client
 * Handles liability insurance quote calculations
 */

import {
  LiabilityConfiguration,
  LiabilityQuote,
  ValidationError,
} from '../types/index.js';

export class LiabilityClient {
  /**
   * Validate liability configuration parameters
   */
  validateInput(params: LiabilityConfiguration): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    if (!params.zipCode || params.zipCode.length !== 5 || !/^\d{5}$/.test(params.zipCode)) {
      errors.push('Invalid German postal code (must be 5 digits)');
    }

    if (!['basic', 'comfort', 'premium'].includes(params.tariffLine)) {
      errors.push('Invalid tariff line (must be basic, comfort, or premium)');
    }

    if (![0, 150, 300, 500].includes(params.deductibleAmount)) {
      errors.push('Invalid deductible amount (must be 0, 150, 300, or 500)');
    }

    if (params.numberOfClaims < 0) {
      errors.push('Number of claims cannot be negative');
    }

    if (params.numberOfClaims > 10) {
      errors.push('Number of claims exceeds maximum allowed (10)');
    }

    const effectiveDate = new Date(params.effectiveDate);
    if (isNaN(effectiveDate.getTime())) {
      errors.push('Invalid effective date format');
    }

    if (params.coverageAmount) {
      if (params.coverageAmount < 5000000 || params.coverageAmount > 20000000) {
        errors.push('Coverage amount must be between €5,000,000 and €20,000,000');
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Calculate liability insurance quote
   */
  async calculateQuote(params: LiabilityConfiguration): Promise<LiabilityQuote> {
    const validation = this.validateInput(params);
    if (!validation.valid) {
      throw new ValidationError(
        'Invalid parameters',
        validation.errors
      );
    }

    const coverageAmounts: Record<string, number> = {
      basic: 5000000,
      comfort: 10000000,
      premium: 20000000,
    };

    const coverageAmount = params.coverageAmount || coverageAmounts[params.tariffLine];

    const basePremiums: Record<string, number> = {
      basic: 5.99,
      comfort: 9.99,
      premium: 14.99,
    };

    let monthlyPremium = basePremiums[params.tariffLine];

    if (params.familyCoverage) {
      monthlyPremium *= 1.5;
    }

    if (params.dronesCoverage) {
      monthlyPremium += 2.50;
    }

    const deductibleDiscounts: Record<number, number> = {
      0: 1.0,
      150: 0.9,
      300: 0.85,
      500: 0.8,
    };
    monthlyPremium *= deductibleDiscounts[params.deductibleAmount];

    if (params.numberOfClaims > 0) {
      monthlyPremium *= 1 + (params.numberOfClaims * 0.15);
    }

    if (params.cancelledByInsurer) {
      monthlyPremium *= 1.3;
    }

    const annualPremium = monthlyPremium * 12;

    const extensions: string[] = [];
    if (params.dronesCoverage) {
      extensions.push('drones_coverage');
    }
    if (params.familyCoverage) {
      extensions.push('family_coverage');
    }

    return {
      quoteId: `quote_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      monthlyPremium: Math.round(monthlyPremium * 100) / 100,
      annualPremium: Math.round(annualPremium * 100) / 100,
      currency: 'EUR',
      coverageSum: coverageAmount,
      deductible: params.deductibleAmount,
      territory: 'Worldwide',
      includedRisks: ['personal_injury', 'property_damage', 'financial_loss'],
      extensions,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      tariffLine: params.tariffLine,
      familyCoverage: params.familyCoverage,
    };
  }

  /**
   * Format quote into AI-friendly summary
   */
  formatQuoteSummary(quote: LiabilityQuote): string {
    const parts: string[] = [];

    parts.push(`Liability Insurance Quote: €${quote.monthlyPremium}/month (€${quote.annualPremium}/year)`);
    parts.push(`Coverage: €${quote.coverageSum.toLocaleString()} ${quote.tariffLine}`);

    if (quote.deductible > 0) {
      parts.push(`Deductible: €${quote.deductible}`);
    } else {
      parts.push('No deductible');
    }

    if (quote.familyCoverage) {
      parts.push('Includes family coverage');
    }

    if (quote.extensions.includes('drones_coverage')) {
      parts.push('Includes drone liability');
    }

    parts.push(`Territory: ${quote.territory}`);
    parts.push(`Valid until: ${new Date(quote.validUntil).toLocaleDateString()}`);

    return parts.join('. ') + '.';
  }
}
