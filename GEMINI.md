# Omni-Link: Universal Semantic Intelligence Bridge

**Omni-Link** is an MCP (Model Context Protocol) server designed to provide AI agents with a proactive "Spider-Sense" regarding codebase architecture. It acts as an intelligence bridge that understands symbols, dependencies, and structural impact without saturating the token window.

## 🚀 Project Overview

- **Purpose:** Provide high-fidelity semantic context to AI agents using compression and dependency analysis.
- **Core Technology:** Built with TypeScript, leveraging the `@modelcontextprotocol/sdk` and `Serena MCP` as the underlying semantic engine.
- **Engine:** Uses `uvx` to dynamically pull and run the Serena semantic provider.

## 🏗️ Architecture

The project is structured into three distinct layers:

1.  **Layer A (Adaptation):** `src/lib/serena.ts`
    - Manages the connection to the external `Serena MCP` server.
    - Implements a resilient client with automatic reconnection and a semantic cache (TTL: 10s).
2.  **Layer B (Compression):** `src/lib/compressor.ts`
    - Processes raw symbol data to maximize value-per-token.
    - Prioritizes structural elements (exports, classes, interfaces) over implementation details.
    - Limits output to ~2500 characters (~500-600 tokens) to ensure context efficiency.
3.  **Layer C (Interface):** `src/index.ts`
    - Entry point that exposes the MCP tools via `stdio` transport.

## 🛠️ Available MCP Tools

- `get_spider_sense(path: string)`: Returns a compressed semantic overview of a file or directory. Recommended before any refactoring.
- `analyze_impact(symbol_name: string, path: string)`: Identifies incoming references to a symbol to prevent breaking changes.
- `get_health()`: Monitors the connection status with Serena and cache statistics.

## 💻 Development Commands

- **Install Dependencies:** `bun install`
- **Build Project:** `npm run build` (Compiles TypeScript to `build/`)
- **Run Server:** `npm start` (Runs the compiled server via Node)
- **Watch Mode:** `npm run dev`
- **MCP Inspector:** `npm run inspector` (Useful for debugging tool definitions)
- **Manual Test:** `node scratch/test_mcp.js`

## 📝 Conventions

- **Types:** Always define domain models in `src/types.ts`.
- **Validation:** Use `zod` for all MCP tool input schemas.
- **Output Styling:** Prefixes tool responses with semantic markers like `### 🛡️ SEMANTIC_ARCHITECT_ADVISORY` to help the calling agent identify high-priority architectural context.
- **Error Handling:** Errors are caught at the server level and returned as MCP error responses.
