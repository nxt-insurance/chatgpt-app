/**
 * MCP Server Implementation
 * Core server using @modelcontextprotocol/sdk
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import winston from 'winston';
import { getAllTools } from '../tools/index.js';

export class MCPServer {
  private server: Server;
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
      ],
    });

    this.server = new Server(
      {
        name: 'chatgpt-app',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = getAllTools();
      const toolsList = tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.jsonSchema || {},
      }));

      return { tools: toolsList };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const tools = getAllTools();
      const tool = tools.find(t => t.name === request.params.name);

      if (!tool) {
        this.logger.error('Tool not found', { toolName: request.params.name });
        throw new Error(`Unknown tool: ${request.params.name}`);
      }

      try {
        this.logger.info('Executing tool', {
          toolName: tool.name,
          params: request.params.arguments,
        });

        const validatedParams = tool.inputSchema.parse(request.params.arguments);
        const result = await tool.handler(validatedParams);

        this.logger.info('Tool execution completed', {
          toolName: tool.name,
          success: true,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        this.logger.error('Tool execution failed', {
          toolName: tool.name,
          error: error instanceof Error ? error.message : String(error),
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    });
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    this.logger.info('MCP Server started', {
      name: 'chatgpt-app',
      version: '1.0.0',
    });
  }
}
