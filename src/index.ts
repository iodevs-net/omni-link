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

/**
 * Omni-Link: Universal Semantic Intelligence Bridge
 */
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
    
    // Error handling
    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.provider.disconnect();
      process.exit(0);
    });
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "get_spider_sense",
          description: "Obtiene una visión arácnida (contexto semántico comprimido) de un archivo o directorio. Úsalo antes de refactorizar para entender la estructura.",
          inputSchema: zodToJsonSchema(z.object({
            path: z.string().min(1).describe("Ruta relativa del archivo o directorio a analizar"),
          })),
        },
        {
          name: "analyze_impact",
          description: "Analiza el impacto de cambiar un símbolo específico en el proyecto actual.",
          inputSchema: zodToJsonSchema(z.object({
            symbol_name: z.string().min(1).describe("Nombre del símbolo (función, clase, variable) a cambiar"),
            path: z.string().min(1).describe("Ruta del archivo donde reside el símbolo"),
          })),
        },
        {
          name: "get_global_impact",
          description: "ANALÍTICA AVANZADA: Analiza el impacto de un símbolo en TODOS los proyectos del workspace (~/dev/proyectos).",
          inputSchema: zodToJsonSchema(z.object({
            symbol_name: z.string().min(1).describe("Nombre del símbolo a buscar en todo el workspace"),
          })),
        },
        {
          name: "check_expert_rules",
          description: "SENTINEL: Verifica el archivo contra reglas expertas del proyecto (multi-tenant, gotchas, naming) y sugiere arreglos.",
          inputSchema: zodToJsonSchema(z.object({
            path: z.string().min(1).describe("Ruta del archivo a verificar"),
            rules_path: z.string().optional().describe("Opcional: Ruta al archivo de reglas YAML personalizado"),
          })),
        },
        {
          name: "get_health",
          description: "Verifica el estado de los proveedores de inteligencia semántica (Serena, etc.)",
          inputSchema: zodToJsonSchema(z.object({})),
        },
      ],
    }));

    // Handle tool calls
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
                text: `### 🛡️ SEMANTIC_ARCHITECT_ADVISORY\n${compressed}\n\n*Review references before refactoring any of these symbols.*`
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
                  text: `✅ No se detectaron referencias externas críticas para '${symbol_name}'. El cambio parece seguro.`
                }]
              };
            }

            return {
              content: [{
                type: "text",
                text: `⚠️ IMPACTO DETECTADO: El símbolo '${symbol_name}' es referenciado en los siguientes archivos:\n${references.map(f => `- ${f}`).join("\n")}\n\n*Valida estos archivos tras realizar el cambio.*`
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
                  text: `✅ No se detectó impacto global para '${symbol_name}' en otros proyectos del workspace.`
                }]
              };
            }

            let report = `🚨 IMPACTO GLOBAL DETECTADO para '${symbol_name}':\n`;
            for (const project of projects) {
              report += `\n### 📦 Proyecto: ${project}\n`;
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
              return { content: [{ type: "text", text: "❌ El proveedor actual no soporta Reglas Expertas." }], isError: true };
            }

            const findings = await this.provider.suggestFixes(path, rules_path);
            
            if (findings.length === 0) {
              return {
                content: [{
                  type: "text",
                  text: "✅ No se detectaron violaciones de reglas expertas en este archivo."
                }]
              };
            }

            let report = `### 🛡️ SEMANTIC_SENTINEL_ADVISORY\nSe han detectado ${findings.length} violaciones de reglas expertas en este archivo.\n\n`;
            for (const f of findings) {
              const severityEmoji = f.severity === "error" ? "🚨" : "⚠️";
              report += `#### ${severityEmoji} [${f.ruleId}] ${f.message}\n`;
              report += `> **Ubicación:** Línea ${f.range.start.line + 1}, Columna ${f.range.start.column + 1}\n`;
              
              if (f.replacement !== null) {
                report += `\n💡 **Sugerencia de Refactorización:**\n`;
                if (f.replacement === "") {
                  report += `*Se sugiere eliminar este bloque de código.*\n`;
                } else {
                  report += `\`\`\`${f.language}\n${f.replacement}\n\`\`\`\n`;
                }
              }
              report += `\n---\n`;
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
            const statusEmoji = health.alive ? "🟢" : "🔴";
            
            return {
              content: [{
                type: "text",
                text: `### ${statusEmoji} OMNI-LINK HEALTH REPORT\n\`\`\`json\n${JSON.stringify(health, null, 2)}\n\`\`\``
              }]
            };
          }

          default:
            throw new Error(`Tool not found: ${name}`);
        }
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`
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
