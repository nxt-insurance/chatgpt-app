/**
 * Unit tests for Liability Client
 */

import { LiabilityClient } from '../src/clients/liability-client';
import { ValidationError, LiabilityConfiguration } from '../src/types/index';

describe('LiabilityClient', () => {
  let client: LiabilityClient;

  beforeEach(() => {
    client = new LiabilityClient();
  });

  describe('validateInput', () => {
    it('should validate correct input', () => {
      const params: LiabilityConfiguration = {
        zipCode: '10115',
        tariffLine: 'comfort',
        familyCoverage: false,
        dronesCoverage: false,
        deductibleAmount: 0,
        previousInsurance: false,
        numberOfClaims: 0,
        cancelledByInsurer: false,
        effectiveDate: '2025-01-01',
      };

      const result = client.validateInput(params);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should reject invalid postal code', () => {
      const params: LiabilityConfiguration = {
        zipCode: '1234',
        tariffLine: 'comfort',
        familyCoverage: false,
        dronesCoverage: false,
        deductibleAmount: 0,
        previousInsurance: false,
        numberOfClaims: 0,
        cancelledByInsurer: false,
        effectiveDate: '2025-01-01',
      };

      const result = client.validateInput(params);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid German postal code (must be 5 digits)');
    });

    it('should reject invalid tariff line', () => {
      const params: any = {
        zipCode: '10115',
        tariffLine: 'invalid',
        familyCoverage: false,
        dronesCoverage: false,
        deductibleAmount: 0,
        previousInsurance: false,
        numberOfClaims: 0,
        cancelledByInsurer: false,
        effectiveDate: '2025-01-01',
      };

      const result = client.validateInput(params);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid tariff line (must be basic, comfort, or premium)');
    });

    it('should reject invalid deductible', () => {
      const params: any = {
        zipCode: '10115',
        tariffLine: 'comfort',
        familyCoverage: false,
        dronesCoverage: false,
        deductibleAmount: 250,
        previousInsurance: false,
        numberOfClaims: 0,
        cancelledByInsurer: false,
        effectiveDate: '2025-01-01',
      };

      const result = client.validateInput(params);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid deductible amount (must be 0, 150, 300, or 500)');
    });

    it('should reject negative number of claims', () => {
      const params: LiabilityConfiguration = {
        zipCode: '10115',
        tariffLine: 'comfort',
        familyCoverage: false,
        dronesCoverage: false,
        deductibleAmount: 0,
        previousInsurance: false,
        numberOfClaims: -1,
        cancelledByInsurer: false,
        effectiveDate: '2025-01-01',
      };

      const result = client.validateInput(params);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Number of claims cannot be negative');
    });

    it('should reject too many claims', () => {
      const params: LiabilityConfiguration = {
        zipCode: '10115',
        tariffLine: 'comfort',
        familyCoverage: false,
        dronesCoverage: false,
        deductibleAmount: 0,
        previousInsurance: false,
        numberOfClaims: 11,
        cancelledByInsurer: false,
        effectiveDate: '2025-01-01',
      };

      const result = client.validateInput(params);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Number of claims exceeds maximum allowed (10)');
    });

    it('should reject coverage amount out of range', () => {
      const params: LiabilityConfiguration = {
        zipCode: '10115',
        tariffLine: 'comfort',
        familyCoverage: false,
        dronesCoverage: false,
        deductibleAmount: 0,
        previousInsurance: false,
        numberOfClaims: 0,
        cancelledByInsurer: false,
        effectiveDate: '2025-01-01',
        coverageAmount: 30000000,
      };

      const result = client.validateInput(params);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Coverage amount must be between €5,000,000 and €20,000,000');
    });
  });

  describe('calculateQuote', () => {
    it('should calculate basic tariff quote', async () => {
      const params: LiabilityConfiguration = {
        zipCode: '10115',
        tariffLine: 'basic',
        familyCoverage: false,
        dronesCoverage: false,
        deductibleAmount: 0,
        previousInsurance: false,
        numberOfClaims: 0,
        cancelledByInsurer: false,
        effectiveDate: '2025-01-01',
      };

      const quote = await client.calculateQuote(params);

      expect(quote.monthlyPremium).toBe(5.99);
      expect(quote.annualPremium).toBe(71.88);
      expect(quote.coverageSum).toBe(5000000);
      expect(quote.tariffLine).toBe('basic');
    });

    it('should calculate comfort tariff quote', async () => {
      const params: LiabilityConfiguration = {
        zipCode: '10115',
        tariffLine: 'comfort',
        familyCoverage: false,
        dronesCoverage: false,
        deductibleAmount: 0,
        previousInsurance: false,
        numberOfClaims: 0,
        cancelledByInsurer: false,
        effectiveDate: '2025-01-01',
      };

      const quote = await client.calculateQuote(params);

      expect(quote.monthlyPremium).toBe(9.99);
      expect(quote.annualPremium).toBe(119.88);
      expect(quote.coverageSum).toBe(10000000);
      expect(quote.tariffLine).toBe('comfort');
    });

    it('should calculate premium tariff quote', async () => {
      const params: LiabilityConfiguration = {
        zipCode: '10115',
        tariffLine: 'premium',
        familyCoverage: false,
        dronesCoverage: false,
        deductibleAmount: 0,
        previousInsurance: false,
        numberOfClaims: 0,
        cancelledByInsurer: false,
        effectiveDate: '2025-01-01',
      };

      const quote = await client.calculateQuote(params);

      expect(quote.monthlyPremium).toBe(14.99);
      expect(quote.annualPremium).toBe(179.88);
      expect(quote.coverageSum).toBe(20000000);
      expect(quote.tariffLine).toBe('premium');
    });

    it('should apply family coverage surcharge', async () => {
      const params: LiabilityConfiguration = {
        zipCode: '10115',
        tariffLine: 'comfort',
        familyCoverage: true,
        dronesCoverage: false,
        deductibleAmount: 0,
        previousInsurance: false,
        numberOfClaims: 0,
        cancelledByInsurer: false,
        effectiveDate: '2025-01-01',
      };

      const quote = await client.calculateQuote(params);

      expect(quote.monthlyPremium).toBe(14.99);
      expect(quote.familyCoverage).toBe(true);
      expect(quote.extensions).toContain('family_coverage');
    });

    it('should apply drones coverage surcharge', async () => {
      const params: LiabilityConfiguration = {
        zipCode: '10115',
        tariffLine: 'comfort',
        familyCoverage: false,
        dronesCoverage: true,
        deductibleAmount: 0,
        previousInsurance: false,
        numberOfClaims: 0,
        cancelledByInsurer: false,
        effectiveDate: '2025-01-01',
      };

      const quote = await client.calculateQuote(params);

      expect(quote.monthlyPremium).toBe(12.49);
      expect(quote.extensions).toContain('drones_coverage');
    });

    it('should apply deductible discount', async () => {
      const params: LiabilityConfiguration = {
        zipCode: '10115',
        tariffLine: 'comfort',
        familyCoverage: false,
        dronesCoverage: false,
        deductibleAmount: 500,
        previousInsurance: false,
        numberOfClaims: 0,
        cancelledByInsurer: false,
        effectiveDate: '2025-01-01',
      };

      const quote = await client.calculateQuote(params);

      expect(quote.monthlyPremium).toBe(7.99);
      expect(quote.deductible).toBe(500);
    });

    it('should apply claims history surcharge', async () => {
      const params: LiabilityConfiguration = {
        zipCode: '10115',
        tariffLine: 'comfort',
        familyCoverage: false,
        dronesCoverage: false,
        deductibleAmount: 0,
        previousInsurance: false,
        numberOfClaims: 2,
        cancelledByInsurer: false,
        effectiveDate: '2025-01-01',
      };

      const quote = await client.calculateQuote(params);

      expect(quote.monthlyPremium).toBe(12.99);
    });

    it('should apply cancellation penalty', async () => {
      const params: LiabilityConfiguration = {
        zipCode: '10115',
        tariffLine: 'comfort',
        familyCoverage: false,
        dronesCoverage: false,
        deductibleAmount: 0,
        previousInsurance: false,
        numberOfClaims: 0,
        cancelledByInsurer: true,
        effectiveDate: '2025-01-01',
      };

      const quote = await client.calculateQuote(params);

      expect(quote.monthlyPremium).toBe(12.99);
    });

    it('should throw ValidationError for invalid input', async () => {
      const params: LiabilityConfiguration = {
        zipCode: 'invalid',
        tariffLine: 'comfort',
        familyCoverage: false,
        dronesCoverage: false,
        deductibleAmount: 0,
        previousInsurance: false,
        numberOfClaims: 0,
        cancelledByInsurer: false,
        effectiveDate: '2025-01-01',
      };

      await expect(client.calculateQuote(params)).rejects.toThrow(ValidationError);
    });

    it('should use custom coverage amount', async () => {
      const params: LiabilityConfiguration = {
        zipCode: '10115',
        tariffLine: 'comfort',
        familyCoverage: false,
        dronesCoverage: false,
        deductibleAmount: 0,
        previousInsurance: false,
        numberOfClaims: 0,
        cancelledByInsurer: false,
        effectiveDate: '2025-01-01',
        coverageAmount: 15000000,
      };

      const quote = await client.calculateQuote(params);

      expect(quote.coverageSum).toBe(15000000);
    });

    it('should include required quote fields', async () => {
      const params: LiabilityConfiguration = {
        zipCode: '10115',
        tariffLine: 'comfort',
        familyCoverage: false,
        dronesCoverage: false,
        deductibleAmount: 0,
        previousInsurance: false,
        numberOfClaims: 0,
        cancelledByInsurer: false,
        effectiveDate: '2025-01-01',
      };

      const quote = await client.calculateQuote(params);

      expect(quote).toHaveProperty('quoteId');
      expect(quote).toHaveProperty('monthlyPremium');
      expect(quote).toHaveProperty('annualPremium');
      expect(quote).toHaveProperty('currency');
      expect(quote).toHaveProperty('coverageSum');
      expect(quote).toHaveProperty('deductible');
      expect(quote).toHaveProperty('territory');
      expect(quote).toHaveProperty('includedRisks');
      expect(quote).toHaveProperty('extensions');
      expect(quote).toHaveProperty('validUntil');
      expect(quote.currency).toBe('EUR');
      expect(quote.territory).toBe('Worldwide');
      expect(quote.includedRisks).toEqual(['personal_injury', 'property_damage', 'financial_loss']);
    });
  });

  describe('formatQuoteSummary', () => {
    it('should format quote summary correctly', () => {
      const quote = {
        quoteId: 'test_123',
        monthlyPremium: 9.99,
        annualPremium: 119.88,
        currency: 'EUR',
        coverageSum: 10000000,
        deductible: 0,
        territory: 'Worldwide',
        includedRisks: ['personal_injury', 'property_damage', 'financial_loss'],
        extensions: [],
        validUntil: '2025-02-01T00:00:00.000Z',
        tariffLine: 'comfort',
        familyCoverage: false,
      };

      const summary = client.formatQuoteSummary(quote);

      expect(summary).toContain('€9.99/month');
      expect(summary).toContain('€119.88/year');
      expect(summary).toContain('€10,000,000');
      expect(summary).toContain('comfort');
      expect(summary).toContain('No deductible');
      expect(summary).toContain('Worldwide');
    });

    it('should include family coverage in summary', () => {
      const quote = {
        quoteId: 'test_123',
        monthlyPremium: 14.99,
        annualPremium: 179.88,
        currency: 'EUR',
        coverageSum: 10000000,
        deductible: 0,
        territory: 'Worldwide',
        includedRisks: ['personal_injury', 'property_damage', 'financial_loss'],
        extensions: ['family_coverage'],
        validUntil: '2025-02-01T00:00:00.000Z',
        tariffLine: 'comfort',
        familyCoverage: true,
      };

      const summary = client.formatQuoteSummary(quote);

      expect(summary).toContain('Includes family coverage');
    });

    it('should include drones coverage in summary', () => {
      const quote = {
        quoteId: 'test_123',
        monthlyPremium: 12.49,
        annualPremium: 149.88,
        currency: 'EUR',
        coverageSum: 10000000,
        deductible: 0,
        territory: 'Worldwide',
        includedRisks: ['personal_injury', 'property_damage', 'financial_loss'],
        extensions: ['drones_coverage'],
        validUntil: '2025-02-01T00:00:00.000Z',
        tariffLine: 'comfort',
        familyCoverage: false,
      };

      const summary = client.formatQuoteSummary(quote);

      expect(summary).toContain('Includes drone liability');
    });

    it('should show deductible amount when non-zero', () => {
      const quote = {
        quoteId: 'test_123',
        monthlyPremium: 7.99,
        annualPremium: 95.88,
        currency: 'EUR',
        coverageSum: 10000000,
        deductible: 500,
        territory: 'Worldwide',
        includedRisks: ['personal_injury', 'property_damage', 'financial_loss'],
        extensions: [],
        validUntil: '2025-02-01T00:00:00.000Z',
        tariffLine: 'comfort',
        familyCoverage: false,
      };

      const summary = client.formatQuoteSummary(quote);

      expect(summary).toContain('Deductible: €500');
    });
  });
});
