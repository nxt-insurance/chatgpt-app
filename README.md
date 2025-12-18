# ChatGPT App - Liability Insurance MCP Server

A Model Context Protocol (MCP) server that provides anonymous liability insurance quotes for Germany via ChatGPT and Claude Desktop. Built with TypeScript and the `@modelcontextprotocol/sdk`.

## Features

- **Anonymous Quote Calculation**: Get liability insurance quotes without authentication
- **Multiple Coverage Levels**: Basic (€5M), Comfort (€10M), Premium (€20M)
- **Flexible Options**: Family coverage, drone liability, configurable deductibles
- **Risk-Based Pricing**: Considers claims history and previous cancellations
- **AI-Optimized**: Structured responses designed for AI consumption

## Installation

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/nxt-insurance/chatgpt-app.git
cd chatgpt-app

# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

### Running the MCP Server

```bash
# Start the server
npm start

# Or run in development mode
npm run dev
```

### Available Tool

#### `get_liability_quote`

Calculate anonymous liability insurance quote for Germany.

**Input Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `zipCode` | string | Yes | 5-digit German postal code |
| `tariffLine` | enum | Yes | Coverage level: `basic`, `comfort`, or `premium` |
| `familyCoverage` | boolean | No | Include family members (default: false) |
| `dronesCoverage` | boolean | No | Include drone liability (default: false) |
| `deductibleAmount` | enum | No | Deductible: 0, 150, 300, or 500 EUR (default: 0) |
| `previousInsurance` | boolean | No | Had previous liability insurance (default: false) |
| `numberOfClaims` | number | No | Claims in last 5 years (default: 0, max: 10) |
| `cancelledByInsurer` | boolean | No | Previously cancelled by insurer (default: false) |
| `effectiveDate` | string | Yes | Policy start date (YYYY-MM-DD) |
| `coverageAmount` | number | No | Custom coverage (€5M-€20M) |

**Example Request:**

```json
{
  "zipCode": "10115",
  "tariffLine": "comfort",
  "familyCoverage": true,
  "dronesCoverage": false,
  "deductibleAmount": 150,
  "previousInsurance": false,
  "numberOfClaims": 0,
  "cancelledByInsurer": false,
  "effectiveDate": "2025-01-01"
}
```

**Example Response:**

```json
{
  "success": true,
  "quote": {
    "quoteId": "quote_1734539123456_abc123",
    "monthlyPremium": 13.49,
    "annualPremium": 161.88,
    "currency": "EUR",
    "coverageSum": 10000000,
    "deductible": 150,
    "territory": "Worldwide",
    "includedRisks": ["personal_injury", "property_damage", "financial_loss"],
    "extensions": ["family_coverage"],
    "validUntil": "2025-01-18T12:34:56.789Z",
    "tariffLine": "comfort",
    "familyCoverage": true
  },
  "summary": "Liability Insurance Quote: €13.49/month (€161.88/year). Coverage: €10,000,000 comfort. Deductible: €150. Includes family coverage. Territory: Worldwide. Valid until: 1/18/2025."
}
```

## Configuration for AI Assistants

### ChatGPT

Add to your ChatGPT GPT configuration:

```json
{
  "name": "Getsafe Liability Insurance",
  "mcp_servers": {
    "chatgpt-app": {
      "command": "node",
      "args": ["/path/to/chatgpt-app/dist/index.js"]
    }
  }
}
```

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "chatgpt-app": {
      "command": "node",
      "args": ["/path/to/chatgpt-app/dist/index.js"]
    }
  }
}
```

## Development

### Project Structure

```
chatgpt-app/
├── src/
│   ├── clients/           # Business logic clients
│   │   └── liability-client.ts
│   ├── server/            # MCP server implementation
│   │   └── mcp-server.ts
│   ├── tools/             # MCP tools
│   │   ├── liability-quote-tool.ts
│   │   └── index.ts
│   ├── types/             # TypeScript types
│   │   └── index.ts
│   └── index.ts           # Entry point
├── tests/                 # Unit tests
│   ├── liability-client.test.ts
│   └── liability-quote-tool.test.ts
├── package.json
├── tsconfig.json
└── jest.config.js
```

### Scripts

```bash
# Build TypeScript
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run specific test file
npm test -- tests/liability-client.test.ts
```

## Quote Calculation Logic

### Base Premiums (Monthly)

- **Basic**: €5.99 (€5M coverage)
- **Comfort**: €9.99 (€10M coverage)
- **Premium**: €14.99 (€20M coverage)

### Pricing Factors

| Factor | Impact |
|--------|--------|
| Family Coverage | +50% |
| Drones Coverage | +€2.50/month |
| Deductible €150 | -10% |
| Deductible €300 | -15% |
| Deductible €500 | -20% |
| Each Claim | +15% per claim |
| Cancelled by Insurer | +30% |

### Example Calculation

**Inputs:**
- Tariff: Comfort (€9.99)
- Family Coverage: Yes
- Deductible: €150
- Claims: 1

**Calculation:**
1. Base: €9.99
2. Family: €9.99 × 1.5 = €14.99
3. Deductible: €14.99 × 0.9 = €13.49
4. Claims: €13.49 × 1.15 = €15.51

**Result:** €15.51/month (€186.12/year)

## Testing

The project includes comprehensive unit tests with 80%+ code coverage requirement:

- **Liability Client Tests**: Validation, quote calculation, premium calculations
- **Tool Tests**: Input validation, error handling, response formatting

## API Reference

### LiabilityClient

```typescript
class LiabilityClient {
  validateInput(params: LiabilityConfiguration): { valid: boolean; errors?: string[] }
  async calculateQuote(params: LiabilityConfiguration): Promise<LiabilityQuote>
  formatQuoteSummary(quote: LiabilityQuote): string
}
```

### Types

```typescript
interface LiabilityConfiguration {
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

interface LiabilityQuote {
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
```

## Error Handling

The server handles errors gracefully:

- **Validation Errors**: Returns detailed error messages for invalid inputs
- **Calculation Errors**: Catches and reports calculation failures
- **Unknown Errors**: Returns generic error message for unexpected issues

All errors include a `success: false` flag and descriptive error messages.

## Logging

The server uses Winston for structured logging:

- **Info**: Tool execution, quote calculations
- **Error**: Validation failures, calculation errors

Configure log level via `LOG_LEVEL` environment variable (default: `info`).

## License

MIT

## Related Projects

- **hybrid-agent**: Reference implementation for MCP patterns and data fields (staging prototype)

## Contributing

This is an internal Getsafe project. For questions or contributions, contact the engineering team.

## Jira

**Epic**: [CHATGPT-1](https://hellogetsafe.atlassian.net/browse/CHATGPT-1) - ChatGPT App - Anonymous Liability Insurance Quotes MVP
