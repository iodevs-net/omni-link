import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { ISemanticProvider, CallToolResult } from "../types.js";

export class SerenaClient implements ISemanticProvider {
  private client: Client;
  private transport: StdioClientTransport;
  private isConnected: boolean = false;
  private connectionError: string | null = null;

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
    return path.replace(/\/+/g, "/").replace(/^\/|\/$/g, "");
  }

  public async getSymbolsOverview(path: string, _timeoutMs = this.DEFAULT_TIMEOUT): Promise<string> {
    const cleanPath = this.sanitizePath(path);

    if (!this.isConnected) {
      const ok = await this.connect();
      if (!ok) throw new Error(
        `SERENA_UNAVAILABLE: Cannot connect to Serena semantic engine.\n` +
        `  Fix: Ensure 'uv' is installed (curl -LsSf https://astral.sh/uv/install.sh | sh).\n` +
        `  Then run 'uvx --from git+https://github.com/oraios/serena serena start-mcp-server' to test.\n` +
        `  Restart Omni-Link after installing uv.`
      );
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

      const result = `=== Serena Symbols: ${cleanPath} ===\n${rawResult}`;

      this.cache.set(cleanPath, { data: result, timestamp: Date.now() });
      return result;
    } catch (error) {
      throw new Error(
        `SERENA_ERROR: Semantic analysis failed for '${cleanPath}'.\n` +
        `  Engine error: ${error instanceof Error ? error.message : "Unknown"}\n` +
        `  Fix: Run 'get_health' tool to check Serena status, then retry.`
      );
    }
  }

  public async getIncomingReferences(symbolName: string, path: string): Promise<string[]> {
    const cleanPath = this.sanitizePath(path);

    if (!this.isConnected) {
      const ok = await this.connect();
      if (!ok) throw new Error(
        `SERENA_UNAVAILABLE: Cannot connect to Serena for reference search.\n` +
        `  Fix: Install uv (curl -LsSf https://astral.sh/uv/install.sh | sh) and restart.`
      );
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
      engine: "serena",
      alive: isAlive,
      connected: this.isConnected,
      error: isAlive ? null : (this.connectionError || "Serena MCP server not reachable"),
      repair: isAlive ? null : "Fix: Ensure 'uv' is installed (curl -LsSf https://astral.sh/uv/install.sh | sh). Then restart Omni-Link. Serena is auto-launched via 'uvx --from git+https://github.com/oraios/serena serena start-mcp-server'.",
      cacheEntries: this.cache.size,
      timestamp: new Date().toISOString()
    };
  }
}
