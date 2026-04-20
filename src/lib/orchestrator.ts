import { ISemanticProvider } from "../types.js";
import { SerenaClient } from "./serena.js";
import { AstGrepProvider } from "./ast-grep.js";

/**
 * Layer A+: Semantic Orchestrator
 * Routes requests to the most appropriate semantic engine based on file type.
 */
export class SemanticOrchestrator implements ISemanticProvider {
  private serena: SerenaClient;
  private astGrep: AstGrepProvider;

  constructor() {
    this.serena = new SerenaClient();
    this.astGrep = new AstGrepProvider();
  }

  public async connect(): Promise<boolean> {
    const results = await Promise.all([
      this.serena.connect(),
      this.astGrep.connect()
    ]);
    return results.some(r => r === true);
  }

  public async disconnect(): Promise<void> {
    await Promise.all([
      this.serena.disconnect(),
      this.astGrep.disconnect()
    ]);
  }

  private getProviderForFile(path: string): ISemanticProvider {
    const ext = path.split(".").pop()?.toLowerCase();
    
    // Serena es el experto en TS/JS
    if (ext === "ts" || ext === "tsx" || ext === "js" || ext === "jsx") {
      return this.serena;
    }
    
    // Para todo lo demás (Python, Go, Rust), usamos ast-grep
    return this.astGrep;
  }

  public async getSymbolsOverview(path: string, timeoutMs?: number): Promise<string> {
    const provider = this.getProviderForFile(path);
    return provider.getSymbolsOverview(path, timeoutMs);
  }

  public async getIncomingReferences(symbolName: string, path: string): Promise<string[]> {
    const provider = this.getProviderForFile(path);
    return provider.getIncomingReferences(symbolName, path);
  }

  public async getHealth() {
    const [serenaHealth, astHealth] = await Promise.all([
      this.serena.getHealth(),
      this.astGrep.getHealth()
    ]);

    return {
      connected: serenaHealth.connected || astHealth.connected,
      alive: serenaHealth.alive && astHealth.alive,
      error: serenaHealth.error || astHealth.error,
      cacheEntries: serenaHealth.cacheEntries + astHealth.cacheEntries,
      engines: {
        serena: serenaHealth,
        astGrep: astHealth
      },
      timestamp: new Date().toISOString()
    };
  }
}
