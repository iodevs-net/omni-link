import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { SemanticOrchestrator } from "./lib/orchestrator.js";
import { SemanticCompressor } from "./lib/compressor.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";

class OmniLinkServer {
  private server: Server;
  private provider: SemanticOrchestrator;

  constructor() {
    this.server = new Server(
      {
        name: "omni-link",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.provider = new SemanticOrchestrator();
    this.setupHandlers();

    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.provider.disconnect();
      process.exit(0);
    });
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "get_spider_sense",
          description: "BEFORE modifying or refactoring any file: get compressed structural overview (classes, functions, interfaces, types, exports). Returns ~500 tokens of high-density architecture context. Use instead of reading entire files to understand code structure quickly.",
          inputSchema: zodToJsonSchema(z.object({
            path: z.string().min(1).describe("File or directory path relative to process CWD. Examples: 'src/index.ts', 'src/lib/', 'README.md'"),
          })),
        },
        {
          name: "analyze_impact",
          description: "BEFORE renaming, deleting, or refactoring a symbol: find ALL files in current project that reference it. Prevents breaking changes by revealing hidden dependencies. Safe to call even if symbol doesn't exist.",
          inputSchema: zodToJsonSchema(z.object({
            symbol_name: z.string().min(1).describe("Exact symbol name to search references for. Examples: 'getUserById', 'UserService', 'MAX_RETRIES', 'handleClick'"),
            path: z.string().min(1).describe("Path to file where symbol is defined, relative to CWD. Used to select analysis engine. Example: 'src/services/user.ts'"),
          })),
        },
        {
          name: "get_global_impact",
          description: "BEFORE renaming a shared/exported symbol: check if OTHER projects in workspace (~/dev/proyectos) reference it. Cross-project dependency scanner for monorepo-like setups. Calls ast-grep across sibling directories.",
          inputSchema: zodToJsonSchema(z.object({
            symbol_name: z.string().min(1).describe("Symbol name to search in all workspace projects. Examples: 'backendBaseUrl', 'SharedType', 'logger'"),
          })),
        },
        {
          name: "check_expert_rules",
          description: "AFTER writing or modifying code: validate file against project-specific YAML expert rules. Catches naming violations, multi-tenant gotchas, anti-patterns, and enforced conventions (e.g., no console.log, specific import patterns).",
          inputSchema: zodToJsonSchema(z.object({
            path: z.string().min(1).describe("Path to file to validate, relative to CWD. Example: 'src/index.ts'"),
            rules_path: z.string().optional().describe("Optional: custom YAML rules file path. Falls back to .omni-rules.yaml in project root."),
          })),
        },
        {
          name: "get_health",
          description: "Check if semantic engines (Serena, ast-grep) are connected and responsive. Call this FIRST if any other tool returns engine errors. Returns status, latency, and repair suggestions for each engine.",
          inputSchema: zodToJsonSchema(z.object({})),
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "get_spider_sense": {
            const { path } = args as { path: string };
            const rawSymbols = await this.provider.getSymbolsOverview(path);
            const compressed = SemanticCompressor.compress(rawSymbols);

            return {
              content: [{
                type: "text",
                text: `### STRUCTURAL OVERVIEW: ${path}\n${compressed}\n\n---\n*Verify references before refactoring any of these symbols.*`
              }]
            };
          }

          case "analyze_impact": {
            const { symbol_name, path } = args as { symbol_name: string; path: string };
            const references = await this.provider.getIncomingReferences(symbol_name, path);

            if (references.length === 0) {
              return {
                content: [{
                  type: "text",
                  text: `SAFE: No files reference '${symbol_name}'. Rename/delete appears safe.`
                }]
              };
            }

            return {
              content: [{
                type: "text",
                text: `IMPACT FOUND: '${symbol_name}' is referenced in ${references.length} file(s):\n${references.map(f => `- ${f}`).join("\n")}\n\n---\n*Review these files after making changes.*`
              }]
            };
          }

          case "get_global_impact": {
            const { symbol_name } = args as { symbol_name: string };
            const impact = await this.provider.getGlobalImpact(symbol_name);

            const projects = Object.keys(impact);
            if (projects.length === 0) {
              return {
                content: [{
                  type: "text",
                  text: `GLOBAL SAFE: No other projects reference '${symbol_name}'.`
                }]
              };
            }

            let report = `GLOBAL IMPACT: '${symbol_name}' referenced across ${projects.length} project(s):\n`;
            for (const project of projects) {
              report += `\n## Project: ${project}\n`;
              report += impact[project].map(f => `- ${f}`).join("\n") + "\n";
            }

            return {
              content: [{
                type: "text",
                text: report
              }]
            };
          }

          case "check_expert_rules": {
            const { path, rules_path } = args as { path: string, rules_path?: string };
            if (!this.provider.suggestFixes) {
              return { content: [{ type: "text", text: "EXPERT_RULES_UNSUPPORTED: Current engine does not support expert rules. Requires ast-grep with YAML rules file." }], isError: true };
            }

            const findings = await this.provider.suggestFixes(path, rules_path);

            if (findings.length === 0) {
              return {
                content: [{
                  type: "text",
                  text: "CLEAN: No expert rule violations found in this file."
                }]
              };
            }

            let report = `EXPERT RULES: ${findings.length} violation(s) found:\n\n`;
            for (const f of findings) {
              const severity = f.severity === "error" ? "ERROR" : "WARN";
              report += `[${severity}] [${f.ruleId}] ${f.message}\n`;
              report += `  Location: line ${f.range.start.line + 1}, col ${f.range.start.column + 1}\n`;

              if (f.replacement !== null) {
                report += `  Suggestion:\n`;
                if (f.replacement === "") {
                  report += `  Remove this block.\n`;
                } else {
                  report += `  Replace with: ${f.replacement}\n`;
                }
              }
              report += `\n`;
            }

            return {
              content: [{
                type: "text",
                text: report
              }]
            };
          }

          case "get_health": {
            const health = await this.provider.getHealth();
            const statusEmoji = health.alive ? "OK" : "FAIL";

            return {
              content: [{
                type: "text",
                text: `OMNI-LINK HEALTH [${statusEmoji}]\n${JSON.stringify(health, null, 2)}`
              }]
            };
          }

          default:
            return {
              content: [{ type: "text", text: `UNKNOWN_TOOL: '${name}' is not available. Available tools: get_spider_sense, analyze_impact, get_global_impact, check_expert_rules, get_health` }],
              isError: true
            };
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return {
          content: [{
            type: "text",
            text: msg
          }],
          isError: true
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.provider.connect();
    await this.server.connect(transport);
    console.error("Omni-Link MCP server running on stdio");
  }
}

const server = new OmniLinkServer();
server.run().catch(console.error);
