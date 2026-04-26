import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import { ISemanticProvider } from "../types.js";

const execPromise = promisify(exec);
const MAX_BUFFER = 10 * 1024 * 1024;

async function runSgCommand(command: string): Promise<{ stdout: string; stderr: string }> {
  try {
    return await execPromise(command, { maxBuffer: MAX_BUFFER });
  } catch (error: any) {
    if (error.code === 1 && error.stdout) {
      return { stdout: error.stdout, stderr: error.stderr || "" };
    }
    throw error;
  }
}

export class AstGrepProvider implements ISemanticProvider {
  private isAvailable: boolean = false;

  private binaryPath: string = "sg";

  public async connect(): Promise<boolean> {
    if (this.isAvailable) return true;

    const envPath = process.env.OMNI_LINK_SG_PATH;
    const candidates = envPath
      ? [envPath]
      : ["sg", `${process.env.HOME}/.cargo/bin/sg`, `${process.env.HOME}/.local/bin/sg`];

    for (const candidate of candidates) {
      try {
        const { stdout } = await execPromise(`"${candidate}" --version`);
        if (stdout.includes("ast-grep") || stdout.includes("sg")) {
          this.binaryPath = candidate;
          this.isAvailable = true;
          return true;
        }
      } catch {
        continue;
      }
    }

    this.isAvailable = false;
    return false;
  }

  public async disconnect(): Promise<void> {}

  public async getSymbolsOverview(path: string): Promise<string> {
    if (!this.isAvailable) await this.connect();
    if (!this.isAvailable) throw new Error(
      `ASTGREP_UNAVAILABLE: ast-grep (sg) binary not found.\n` +
      `  Fix: Install via 'cargo install ast-grep' or 'npm install -g @ast-grep/cli'.\n` +
      `  Or set OMNI_LINK_SG_PATH env var to custom binary path.`
    );

    try {
      const ext = path.split(".").pop()?.toLowerCase();
      let pattern;

      if (fs.statSync(path).isDirectory()) {
        pattern = '$DEF $NAME($$$)';
      } else if (ext === "py") {
        pattern = 'def $NAME($$$): $$$';
      } else if (ext === "go") {
        pattern = 'func $NAME($$$) { $$$ }';
      } else if (ext === "rs") {
        pattern = 'fn $NAME($$$) { $$$ }';
      } else {
        pattern = 'function $NAME($$$) { $$$ }';
      }

      const excludeGlobs = "--globs '!**/node_modules/**' --globs '!**/.git/**' --globs '!**/venv/**' --globs '!**/build/**' --globs '!**/dist/**' --globs '!**/__pycache__/**'";
      const { stdout } = await runSgCommand(`${this.binaryPath} run -p '${pattern}' "${path}" ${excludeGlobs} --json`);
      const matches = JSON.parse(stdout);
      
      let content = "";
      if (matches.length === 0) {
        content = "(no structural symbols found with current pattern)";
      } else {
        content = matches
          .map((m: any) => {
            const name = m.metaVariables?.single?.NAME?.text || "unknown";
            const type = ext === "py" ? "def" : (ext === "rs" ? "fn" : "func");
            return `- ${type} ${name} (line ${m.range.start.line + 1})`;
          })
          .join("\n");
      }

      return `=== ast-grep Symbols: ${path} ===\n${content}`;

    } catch (error) {
      throw new Error(
        `ASTGREP_ERROR: Structural analysis failed for '${path}'.\n` +
        `  ${error instanceof Error ? error.message : "Unknown error"}\n` +
        `  Fix: Verify file exists and ast-grep is functional via 'sg --version'.`
      );
    }
  }

  public async searchPatternInPath(pattern: string, name: string, searchPath: string): Promise<string[]> {
    if (!this.isAvailable) await this.connect();
    if (!this.isAvailable) throw new Error("ASTGREP_UNAVAILABLE: ast-grep not available for pattern search.");

    try {
      const finalPattern = pattern.replace("$NAME", name);
      const excludeGlobs = "--globs '!**/node_modules/**' --globs '!**/.git/**' --globs '!**/venv/**' --globs '!**/build/**' --globs '!**/dist/**'";
      const { stdout } = await runSgCommand(`${this.binaryPath} run -p '${finalPattern}' "${searchPath}" ${excludeGlobs} --json`);
      const matches = JSON.parse(stdout);

      return [...new Set(matches.map((m: any) => m.file))] as string[];
    } catch (error) {
      if (error instanceof Error === false && (error as any)?.code === 1) return [];
      throw new Error(
        `ASTGREP_ERROR: Pattern search failed in '${searchPath}'.\n` +
        `  ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  public async getIncomingReferences(symbolName: string, path: string): Promise<string[]> {
    if (!this.isAvailable) await this.connect();
    if (!this.isAvailable) throw new Error(
      `ASTGREP_UNAVAILABLE: Cannot search references without ast-grep.\n` +
      `  Fix: Install ast-grep (cargo install ast-grep) or set OMNI_LINK_SG_PATH.`
    );

    try {
      const { stdout } = await runSgCommand(`${this.binaryPath} run -p '${symbolName}' "${path}" --json`);
      const matches = JSON.parse(stdout);

      return [...new Set(matches.map((m: any) => m.file))] as string[];
    } catch (error) {
      if (error instanceof Error === false && (error as any)?.code === 1) return [];
      throw new Error(
        `ASTGREP_ERROR: Reference search failed for '${symbolName}'.\n` +
        `  ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  public async suggestFixes(path: string, rules_path?: string): Promise<any[]> {
    if (!this.isAvailable) await this.connect();
    if (!this.isAvailable) return [];

    try {
      let currentDir = path.includes("/") ? path.substring(0, path.lastIndexOf("/")) : ".";
      let projectRoot = ".";

      for (let i = 0; i < 3; i++) {
        if (fs.existsSync(`${currentDir}/.omni-rules.yaml`) || fs.existsSync(`${currentDir}/package.json`)) {
          projectRoot = currentDir;
          break;
        }
        currentDir = currentDir.includes("/") ? currentDir.substring(0, currentDir.lastIndexOf("/")) : ".";
        if (currentDir === ".") break;
      }

      const finalRulesPath = rules_path || `${projectRoot}/.omni-rules.yaml`;

      if (!fs.existsSync(finalRulesPath)) return [];

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
        replacement: v.replacement || null
      }));
    } catch (error) {
      console.error("[Ast-Grep Fixer Error]:", error);
      return [];
    }
  }

  public async getHealth() {
    const alive = this.isAvailable || await this.connect();
    return {
      engine: "ast-grep",
      alive,
      connected: alive,
      error: alive ? null : "ast-grep (sg) binary not found in PATH or cargo bin",
      repair: alive ? null : "Run: cargo install ast-grep --locked | or: npm install -g @ast-grep/cli | or: set OMNI_LINK_SG_PATH=<path-to-sg>",
      binaryPath: this.binaryPath,
      cacheEntries: 0,
      timestamp: new Date().toISOString()
    };
  }
}
