import { ISemanticProvider } from "../types.js";
import { SerenaClient } from "./serena.js";
import { AstGrepProvider } from "./ast-grep.js";
import path from "path";
import fs from "fs";

export class SemanticOrchestrator implements ISemanticProvider {
  private serena: SerenaClient;
  private astGrep: AstGrepProvider;
  private workspaceRoot: string;

  constructor() {
    this.serena = new SerenaClient();
    this.astGrep = new AstGrepProvider();

    this.workspaceRoot = process.env.OMNI_LINK_WORKSPACE
      || path.resolve(process.cwd(), "..")
      || process.cwd();
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

  private getProviderForFile(filePath: string): ISemanticProvider {
    const isDir = fs.statSync(filePath).isDirectory();
    if (isDir) return this.astGrep;

    const ext = filePath.split(".").pop()?.toLowerCase();
    if (["ts", "tsx", "js", "jsx"].includes(ext || "")) {
      return this.serena;
    }
    return this.astGrep;
  }

  public async getSymbolsOverview(filePath: string, timeoutMs?: number): Promise<string> {
    const provider = this.getProviderForFile(filePath);
    return provider.getSymbolsOverview(filePath, timeoutMs);
  }

  public async getIncomingReferences(symbolName: string, filePath: string): Promise<string[]> {
    const provider = this.getProviderForFile(filePath);
    return provider.getIncomingReferences(symbolName, filePath);
  }

  public async suggestFixes(filePath: string, rulesPath?: string): Promise<any[]> {
    const provider = this.getProviderForFile(filePath);
    if (provider.suggestFixes) {
      return provider.suggestFixes(filePath, rulesPath);
    }
    return [];
  }

  public async getGlobalImpact(symbolName: string): Promise<Record<string, string[]>> {
    const ignoredDirs = [".git", "node_modules", "venv", ".serena", "build", "dist"];

    const projects = fs.readdirSync(this.workspaceRoot)
      .filter(f => {
        const fullPath = path.join(this.workspaceRoot, f);
        return fs.statSync(fullPath).isDirectory() && !ignoredDirs.includes(f);
      });

    const impact: Record<string, string[]> = {};

    await Promise.all(projects.map(async (project) => {
      const projectPath = path.join(this.workspaceRoot, project);
      const refs = await this.astGrep.searchPatternInPath(`$NAME`, symbolName, projectPath);
      if (refs.length > 0) {
        impact[project] = refs;
      }
    }));

    return impact;
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
      workspace: this.workspaceRoot,
      engines: {
        serena: serenaHealth,
        astGrep: astHealth
      },
      timestamp: new Date().toISOString()
    };
  }
}
