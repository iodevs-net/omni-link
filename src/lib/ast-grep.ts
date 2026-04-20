import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import { ISemanticProvider } from "../types.js";

const execPromise = promisify(exec);
const MAX_BUFFER = 10 * 1024 * 1024; // 10MB

/**
 * Ejecuta un comando de ast-grep y maneja los códigos de salida específicos.
 * ast-grep retorna 1 si no hay coincidencias, lo cual no es un error de ejecución.
 */
async function runSgCommand(command: string): Promise<{ stdout: string; stderr: string }> {
  try {
    return await execPromise(command, { maxBuffer: MAX_BUFFER });
  } catch (error: any) {
    // Si el código es 1, ast-grep simplemente no encontró coincidencias
    if (error.code === 1 && error.stdout) {
      return { stdout: error.stdout, stderr: error.stderr || "" };
    }
    throw error;
  }
}

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
    if (!this.isAvailable) return "🔴 [Ast-Grep] Binario no encontrado.";

    try {
      const ext = path.split(".").pop()?.toLowerCase();
      let pattern = 'function $NAME($$$) { $$$ }'; // Default
      
      if (fs.statSync(path).isDirectory()) {
        // Patrón universal para directorios: busca funciones, clases o definiciones comunes
        pattern = '{ [fn|func|def|function|class] $NAME($$$) }'; 
        // Nota: ast-grep soporta alternancia de tokens en algunos contextos, o usaremos uno más genérico:
        pattern = '$DEF $NAME($$$)'; 
      } else {
        if (ext === "py") pattern = 'def $NAME($$$): $$$';
        if (ext === "go") pattern = 'func $NAME($$$) { $$$ }';
        if (ext === "rs") pattern = 'fn $NAME($$$) { $$$ }';
      }

      const excludeGlobs = "--globs '!**/node_modules/**' --globs '!**/.git/**' --globs '!**/venv/**' --globs '!**/build/**' --globs '!**/dist/**' --globs '!**/__pycache__/**'";
      const { stdout } = await runSgCommand(`${this.binaryPath} run -p '${pattern}' "${path}" ${excludeGlobs} --json`);
      const matches = JSON.parse(stdout);
      
      let content = "";
      if (matches.length === 0) {
        content = "ℹ️ No se encontraron símbolos estructurales con el patrón actual.";
      } else {
        content = matches
          .map((m: any) => {
            const name = m.metaVariables?.single?.NAME?.text || "unknown";
            const type = ext === "py" ? "def" : (ext === "rs" ? "fn" : "func");
            return `- \`${type} ${name}\` (Línea ${m.range.start.line + 1})`;
          })
          .join("\n");
      }

      return `### 🛡️ SEMANTIC_ARCHITECT_ADVISORY\n` +
             `✅ Análisis Estructural de: \`${path}\`\n\n` +
             `${content}\n\n` +
             `⚠️ *Confía pero verifica: Este análisis es puramente estructural.*`;
      
    } catch (error) {
      return `❌ [Ast-Grep Error] ${error instanceof Error ? error.message : "Desconocido"}`;
    }
  }

  /**
   * Busca un patrón específico en una ruta determinada (útil para escaneos cross-project).
   */
  public async searchPatternInPath(pattern: string, name: string, searchPath: string): Promise<string[]> {
    if (!this.isAvailable) await this.connect();
    if (!this.isAvailable) return [];

    try {
      // Reemplazamos $NAME en el patrón si es necesario
      const finalPattern = pattern.replace("$NAME", name);
      // Añadimos exclusiones explícitas para evitar saturación y ruido
      const excludeGlobs = "--globs '!**/node_modules/**' --globs '!**/.git/**' --globs '!**/venv/**' --globs '!**/build/**' --globs '!**/dist/**'";
      const { stdout } = await runSgCommand(`${this.binaryPath} run -p '${finalPattern}' "${searchPath}" ${excludeGlobs} --json`);
      const matches = JSON.parse(stdout);
      
      // Retornamos las rutas únicas de los archivos que contienen el patrón
      return [...new Set(matches.map((m: any) => m.file))] as string[];
    } catch {
      return [];
    }
  }

  public async getIncomingReferences(symbolName: string, path: string): Promise<string[]> {
    if (!this.isAvailable) await this.connect();
    if (!this.isAvailable) return [];

    try {
      // Buscamos el símbolo como un identificador simple en el archivo/directorio
      const { stdout } = await runSgCommand(`${this.binaryPath} run -p '${symbolName}' "${path}" --json`);
      const matches = JSON.parse(stdout);
      
      return [...new Set(matches.map((m: any) => m.file))] as string[];
    } catch {
      return [];
    }
  }

  public async suggestFixes(path: string, rules_path?: string): Promise<any[]> {
    if (!this.isAvailable) await this.connect();
    if (!this.isAvailable) return [];

    try {
      // Intentamos encontrar la raíz del proyecto buscando hacia arriba desde el archivo
      let currentDir = path.includes("/") ? path.substring(0, path.lastIndexOf("/")) : ".";
      let projectRoot = ".";
      
      // Búsqueda simple hacia arriba (hasta 3 niveles) para encontrar .omni-rules.yaml o la raíz
      for (let i = 0; i < 3; i++) {
        if (fs.existsSync(`${currentDir}/.omni-rules.yaml`) || fs.existsSync(`${currentDir}/package.json`)) {
          projectRoot = currentDir;
          break;
        }
        currentDir = currentDir.includes("/") ? currentDir.substring(0, currentDir.lastIndexOf("/")) : ".";
        if (currentDir === ".") break;
      }

      const finalRulesPath = rules_path || `${projectRoot}/.omni-rules.yaml`;

      if (!fs.existsSync(finalRulesPath)) {
        return [];
      }

      // Ejecutamos el escaneo con las reglas expertas
      const { stdout } = await runSgCommand(
        `${this.binaryPath} scan -c "${finalRulesPath}" "${path}" --json`
      );
      
      const violations = JSON.parse(stdout);
      
      return violations.map((v: any) => ({
        ruleId: v.ruleId,
        message: v.message,
        file: v.file,
        range: v.range,
        lines: v.lines,
        replacement: v.replacement || null // ast-grep incluye esto si la regla tiene un 'fix'
      }));
    } catch (error) {
      console.error("[Ast-Grep Fixer Error]:", error);
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
