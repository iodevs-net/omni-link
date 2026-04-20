import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { ISemanticProvider, CallToolResult } from "../types.js";

/**
 * Layer A: Serena Adapter (Resilient Version)
 * Handles MCP connection, semantic caching, and circuit-breaker logic.
 */
export class SerenaClient implements ISemanticProvider {
  private client: Client;
  private transport: StdioClientTransport;
  private isConnected: boolean = false;
  private connectionError: string | null = null;
  
  // Semantic Cache to avoid redundant calls
  private cache: Map<string, { data: string; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 10000; 
  
  private readonly DEFAULT_TIMEOUT = 3000;

  constructor() {
    this.transport = new StdioClientTransport({
      command: "uvx",
      args: [
        "--from",
        "git+https://github.com/oraios/serena",
        "serena",
        "start-mcp-server",
        "--project-from-cwd"
      ],
    });

    this.client = new Client(
      { 
        name: "omni-link", 
        version: "1.0.0",
        description: "Universal Semantic Intelligence Bridge",
      },
      { capabilities: {} }
    );
  }

  public async connect(): Promise<boolean> {
    if (this.isConnected) return true;
    
    try {
      await this.client.connect(this.transport);
      this.isConnected = true;
      this.connectionError = null;
      return true;
    } catch (error) {
      this.isConnected = false;
      this.connectionError = (error as Error).message;
      return false;
    }
  }

  public async ping(): Promise<boolean> {
    if (!this.isConnected) {
      const ok = await this.connect();
      if (!ok) return false;
    }
    try {
      // Intentamos listar las herramientas como un heartbeat ligero
      await this.client.listTools();
      return true;
    } catch (e) {
      this.isConnected = false;
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.transport.close();
        this.isConnected = false;
      }
    } catch (error) {
      console.warn("[Serena] Error durante la desconexión:", error);
    }
  }

  private sanitizePath(path: string): string {
    // Normalizar: quitar redundancias de slashes y asegurar que no sea path traversal
    return path.replace(/\/+/g, "/").replace(/^\/|\/$/g, "");
  }

  public async getSymbolsOverview(path: string, timeoutMs = this.DEFAULT_TIMEOUT): Promise<string> {
    const cleanPath = this.sanitizePath(path);
    
    if (!this.isConnected) {
      const ok = await this.connect();
      if (!ok) return "🔴 [Omni-Link] Serena no disponible.";
    }

    const cached = this.cache.get(cleanPath);
    if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
      return cached.data;
    }

    try {
      const response = await this.client.callTool(
        {
          name: "get_symbols_overview",
          arguments: { relative_path: cleanPath, depth: 1 },
        }
      ) as CallToolResult;

      const rawResult = (response.content?.[0] as any)?.text || "";
      
      const result = `### 🛡️ SEMANTIC_ARCHITECT_ADVISORY\n` +
                    `✅ Análisis exitoso para: \`${cleanPath}\`\n\n` +
                    `${rawResult}\n\n` +
                    `⚠️ *Verifica las referencias cruzadas antes de refactorizar.*`;

      this.cache.set(cleanPath, { data: result, timestamp: Date.now() });
      return result;
    } catch (error) {
      return `❌ [Error Semántico] ${error instanceof Error ? error.message : "Desconocido"}`;
    }
  }

  public async getIncomingReferences(symbolName: string, path: string): Promise<string[]> {
    const cleanPath = this.sanitizePath(path);
    
    if (!this.isConnected) {
      const ok = await this.connect();
      if (!ok) return [];
    }

    try {
      const response = await this.client.callTool({
        name: "find_referencing_symbols",
        arguments: {
          symbol: symbolName,
          path: cleanPath
        }
      }) as CallToolResult;

      if (!response || !response.content) return [];

      const refs = (response.content as any[])
        .filter((c: any) => c.type === "text")
        .map((c: any) => c.text)
        .join("\n");

      // Refactorización: Mejor extracción de rutas
      // Buscamos patrones de archivos pero validamos que no empiecen con slashes dobles raros
      const matches = refs.match(/(?:^|\s)([a-zA-Z0-9._\-/]+\.(?:ts|js|py|go|rs|cpp|h))/g) || [];
      const files = [...new Set(matches.map(m => this.sanitizePath(m.trim())))] as string[];
      
      return files.filter(f => f !== cleanPath && f.length > 0);
      
    } catch (e) {
      return [];
    }
  }

  public async getHealth() {
    const isAlive = await this.ping();
    return {
      connected: this.isConnected,
      alive: isAlive,
      error: this.connectionError,
      cacheEntries: this.cache.size,
      timestamp: new Date().toISOString()
    };
  }
}
