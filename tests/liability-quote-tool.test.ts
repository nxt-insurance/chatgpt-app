/**
 * Unit tests for Liability Quote Tool
 */

import { createLiabilityQuoteTool } from '../src/tools/liability-quote-tool';
import { LiabilityQuoteInput } from '../src/types/index';

describe('LiabilityQuoteTool', () => {
  const tool = createLiabilityQuoteTool();

  describe('tool configuration', () => {
    it('should have correct name', () => {
      expect(tool.name).toBe('get_liability_quote');
    });

    it('should have description', () => {
      expect(tool.description).toBeDefined();
      expect(tool.description.length).toBeGreaterThan(0);
    });

    it('should have inputSchema', () => {
      expect(tool.inputSchema).toBeDefined();
    });

    it('should have handler function', () => {
      expect(typeof tool.handler).toBe('function');
    });
  });

  describe('handler', () => {
    it('should calculate quote successfully', async () => {
      const params: LiabilityQuoteInput = {
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

      const result = await tool.handler(params);

      expect(result.success).toBe(true);
      expect(result.quote).toBeDefined();
      expect(result.quote.monthlyPremium).toBe(9.99);
      expect(result.quote.coverageSum).toBe(10000000);
      expect(result.summary).toBeDefined();
    });

    it('should handle validation errors gracefully', async () => {
      const params: any = {
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

      const result = await tool.handler(params);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.summary).toContain('Failed to calculate quote');
    });

    it('should return summary for successful quotes', async () => {
      const params: LiabilityQuoteInput = {
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

      const result = await tool.handler(params);

      expect(result.success).toBe(true);
      expect(result.summary).toContain('€5.99/month');
      expect(result.summary).toContain('€5,000,000');
    });

    it('should handle family coverage correctly', async () => {
      const params: LiabilityQuoteInput = {
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

      const result = await tool.handler(params);

      expect(result.success).toBe(true);
      expect(result.quote?.familyCoverage).toBe(true);
      expect(result.quote?.extensions).toContain('family_coverage');
    });

    it('should handle drones coverage correctly', async () => {
      const params: LiabilityQuoteInput = {
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

      const result = await tool.handler(params);

      expect(result.success).toBe(true);
      expect(result.quote?.extensions).toContain('drones_coverage');
    });

    it('should handle all tariff lines', async () => {
      const tariffLines: Array<'basic' | 'comfort' | 'premium'> = ['basic', 'comfort', 'premium'];
      const expectedPremiums = [5.99, 9.99, 14.99];
      const expectedCoverage = [5000000, 10000000, 20000000];

      for (let i = 0; i < tariffLines.length; i++) {
        const params: LiabilityQuoteInput = {
          zipCode: '10115',
          tariffLine: tariffLines[i],
          familyCoverage: false,
          dronesCoverage: false,
          deductibleAmount: 0,
          previousInsurance: false,
          numberOfClaims: 0,
          cancelledByInsurer: false,
          effectiveDate: '2025-01-01',
        };

        const result = await tool.handler(params);

        expect(result.success).toBe(true);
        expect(result.quote?.monthlyPremium).toBe(expectedPremiums[i]);
        expect(result.quote?.coverageSum).toBe(expectedCoverage[i]);
      }
    });

    it('should handle all deductible amounts', async () => {
      const deductibles: Array<0 | 150 | 300 | 500> = [0, 150, 300, 500];
      const basePremium = 9.99;
      const expectedPremiums = [9.99, 8.99, 8.49, 7.99];

      for (let i = 0; i < deductibles.length; i++) {
        const params: LiabilityQuoteInput = {
          zipCode: '10115',
          tariffLine: 'comfort',
          familyCoverage: false,
          dronesCoverage: false,
          deductibleAmount: deductibles[i],
          previousInsurance: false,
          numberOfClaims: 0,
          cancelledByInsurer: false,
          effectiveDate: '2025-01-01',
        };

        const result = await tool.handler(params);

        expect(result.success).toBe(true);
        expect(result.quote?.monthlyPremium).toBe(expectedPremiums[i]);
        expect(result.quote?.deductible).toBe(deductibles[i]);
      }
    });

    it('should handle claims history', async () => {
      const params: LiabilityQuoteInput = {
        zipCode: '10115',
        tariffLine: 'comfort',
        familyCoverage: false,
        dronesCoverage: false,
        deductibleAmount: 0,
        previousInsurance: true,
        numberOfClaims: 3,
        cancelledByInsurer: false,
        effectiveDate: '2025-01-01',
      };

      const result = await tool.handler(params);

      expect(result.success).toBe(true);
      expect(result.quote?.monthlyPremium).toBeGreaterThan(9.99);
    });

    it('should handle cancellation by insurer', async () => {
      const params: LiabilityQuoteInput = {
        zipCode: '10115',
        tariffLine: 'comfort',
        familyCoverage: false,
        dronesCoverage: false,
        deductibleAmount: 0,
        previousInsurance: true,
        numberOfClaims: 0,
        cancelledByInsurer: true,
        effectiveDate: '2025-01-01',
      };

      const result = await tool.handler(params);

      expect(result.success).toBe(true);
      expect(result.quote?.monthlyPremium).toBeGreaterThan(9.99);
    });

    it('should handle custom coverage amount', async () => {
      const params: LiabilityQuoteInput = {
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

      const result = await tool.handler(params);

      expect(result.success).toBe(true);
      expect(result.quote?.coverageSum).toBe(15000000);
    });

    it('should validate zip code format', async () => {
      const invalidZipCodes = ['1234', '123456', 'abcde', '1234a'];

      for (const zipCode of invalidZipCodes) {
        const params: any = {
          zipCode,
          tariffLine: 'comfort',
          familyCoverage: false,
          dronesCoverage: false,
          deductibleAmount: 0,
          previousInsurance: false,
          numberOfClaims: 0,
          cancelledByInsurer: false,
          effectiveDate: '2025-01-01',
        };

        const result = await tool.handler(params);

        expect(result.success).toBe(false);
      }
    });

    it('should validate effective date format', async () => {
      const params: any = {
        zipCode: '10115',
        tariffLine: 'comfort',
        familyCoverage: false,
        dronesCoverage: false,
        deductibleAmount: 0,
        previousInsurance: false,
        numberOfClaims: 0,
        cancelledByInsurer: false,
        effectiveDate: 'invalid-date',
      };

      const result = await tool.handler(params);

      expect(result.success).toBe(false);
    });
  });
});
