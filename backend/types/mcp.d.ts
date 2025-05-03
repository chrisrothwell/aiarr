declare module '@modelcontextprotocol/sdk' {
  export class ModelContextProtocol {
    constructor(config: {
      name: string;
      version: string;
      description: string;
      capabilities: string[];
    });

    defineCapability(name: string, config: {
      description: string;
      actions: {
        [key: string]: {
          description: string;
          parameters?: {
            [key: string]: {
              type: string;
              description: string;
            };
          };
          handler: (params?: any) => Promise<any>;
        };
      };
    }): void;

    getCapabilities(): Array<{
      name: string;
      description: string;
      actions: Array<{
        name: string;
        description: string;
        parameters?: {
          [key: string]: {
            type: string;
            description: string;
          };
        };
      }>;
    }>;

    executeAction(capability: string, action: string, parameters?: any): Promise<any>;
  }
} 