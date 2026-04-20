/**
 * Omni-Link Types
 */

export interface CallToolResult {
  content: any[];
  isError?: boolean;
}

/**
 * Interface agnóstica para proveedores de análisis semántico.
 */
export interface ISemanticProvider {
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  getSymbolsOverview(path: string, timeoutMs?: number): Promise<string>;
  getIncomingReferences(symbolName: string, path: string): Promise<string[]>;
  getHealth(): Promise<{ 
    connected: boolean; 
    alive: boolean; 
    error: string | null; 
    cacheEntries: number;
    timestamp: string;
    [key: string]: any;
  }>;

  // Fase V: Expert Intelligence
  getExpertRules?(path: string): Promise<any[]>;
  suggestFixes?(path: string, rulesPath?: string): Promise<{
    ruleId: string;
    message: string;
    diff: string;
  }[]>;
}
