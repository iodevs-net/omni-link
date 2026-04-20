import { exec } from "child_process";
import { promisify } from "util";
import { ISemanticProvider } from "../types.js";

const execPromise = promisify(exec);

/**
 * Layer A.2: ast-grep Provider (Universal Engine)
 * Uses the 'sg' binary to extract structural information from multiple languages.
 */
export class AstGrepProvider implements ISemanticProvider {
  private isAvailable: boolean = false;

  private binaryPath: string = "sg";

  public async connect(): Promise<boolean> {
    try {
      // Intentamos encontrar el path absoluto para mayor resiliencia
      const { stdout: whichOut } = await execPromise("which sg").catch(() => ({ stdout: "" }));
      if (whichOut.trim()) {
        this.binaryPath = whichOut.trim();
      } else {
        // Fallback al path común de cargo si no está en el PATH actual
        this.binaryPath = "/home/leonardo/.cargo/bin/sg";
      }

      const { stdout } = await execPromise(`${this.binaryPath} --version`);
      this.isAvailable = stdout.includes("ast-grep");
      return this.isAvailable;
    } catch {
      this.isAvailable = false;
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    // No persistent connection needed for CLI tool
  }

  public async getSymbolsOverview(path: string): Promise<string> {
    if (!this.isAvailable) await this.connect();
    if (!this.isAvailable) return "[Ast-Grep] Binario no encontrado.";

    try {
      const ext = path.split(".").pop()?.toLowerCase();
      let pattern = 'function $NAME($$$) { $$$ }'; // Default
      
      if (ext === "py") pattern = 'def $NAME($$$): $$$';
      if (ext === "go") pattern = 'func $NAME($$$) { $$$ }';
      if (ext === "rs") pattern = 'fn $NAME($$$) { $$$ }';

      const { stdout } = await execPromise(`${this.binaryPath} run -p '${pattern}' "${path}" --json`);
      const matches = JSON.parse(stdout);
      
      if (matches.length === 0) return "No se encontraron símbolos estructurales.";

      return matches
        .map((m: any) => {
          const name = m.metaVariables?.single?.NAME?.text || "unknown";
          const type = ext === "py" ? "def" : (ext === "rs" ? "fn" : "func");
          return `${type} ${name}`;
        })
        .join("\n");
      
    } catch (error) {
      return `[Ast-Grep Error] ${error instanceof Error ? error.message : "Desconocido"}`;
    }
  }

  public async getIncomingReferences(symbolName: string, path: string): Promise<string[]> {
    // ast-grep es excelente para buscar usos estructurales
    try {
      const { stdout } = await execPromise(`sg run -p '$NAME' --json`);
      // Lógica de filtrado de referencias...
      return [];
    } catch {
      return [];
    }
  }

  public async getHealth() {
    return {
      connected: this.isAvailable,
      alive: this.isAvailable,
      error: this.isAvailable ? null : "ast-grep binary not found",
      cacheEntries: 0,
      timestamp: new Date().toISOString()
    };
  }
}
