# Omni-Link: Universal Semantic Intelligence Bridge

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Stack: TypeScript](https://img.shields.io/badge/Stack-TypeScript-blue)](https://www.typescriptlang.org/)

**Omni-Link** is a **Precision Layer** for AI coding agents. It provides high-fidelity architectural context by orchestrating multiple semantic engines (Serena, ast-grep) and compressing results into minimum viable context (~500 tokens).

It works as an **MCP server** and can be used with any MCP-compatible client (Claude Code, VS Code, Cursor, etc.).

---

## Installation

Omni-Link can be used in three ways, from simplest to most manual.

### A) Plugin Marketplace (Claude Code — recommended)

This is the zero-friction path. Tools appear automatically without manual `.mcp.json` config.

**1. Register the marketplace** — add this to `~/.claude/settings.json`:

```json
"extraKnownMarketplaces": {
  "omni-link": {
    "source": {
      "source": "github",
      "repo": "iodevs-net/omni-link"
    }
  }
}
```

**2. Install the plugin:**

```bash
claude plugins install omni-link@omni-link
```

**3. Reload plugins** — run `/reload-plugins` inside Claude Code, or restart.

The tools `get_spider_sense`, `analyze_impact`, `get_global_impact`, `check_expert_rules`, and `get_health` are now available as native MCP tools. This works with all Claude Code backends (Anthropic API, Bedrock, DeepSeek proxy, etc.).

### B) Direct npx (any MCP client)

No install required. Point your MCP config to the published npm package.

**Claude Code** (`~/.claude/mcp.json` or project `claude.json`):

```json
{
  "mcpServers": {
    "omni-link": {
      "command": "npx",
      "args": ["-y", "@iodevs/omni-link"]
    }
  }
}
```

**VS Code / Cursor** (`.vscode/mcp.json`):

```json
{
  "servers": {
    "omni-link": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@iodevs/omni-link"]
    }
  }
}
```

> **Note for proxy users**: If your AI client proxies through a non-Anthropic API, MCP servers from `settings.json` / `mcp.json` may not be exposed to the model. Use the Plugin Marketplace (A) or the Skill fallback (C) instead.

### C) From source (development)

Clone, install, and run locally:

```bash
git clone https://github.com/iodevs-net/omni-link.git
cd omni-link
npm install
```

Then configure your MCP client to use `node build/index.js`.

### Prerequisites

| Dependency | Required For | Install |
|-----------|-------------|---------|
| Node.js 18+ | Running Omni-Link | [nodejs.org](https://nodejs.org) |
| uv | Serena engine (TS/JS analysis) | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| ast-grep (sg) | Universal engine (Python/Go/Rust) | `cargo install ast-grep --locked` |

### Skill Fallback (Claude Code)

If your setup doesn't expose MCP tools (e.g., certain proxy configurations), the plugin includes a **skill** that teaches Claude to call Omni-Link via JSON-RPC over stdin/stdout. After installing the plugin, invoke it with:

```
/omni-link
```

The skill provides a Bash one-liner that starts the MCP server, sends a request, and returns the result.

---

## Available Tools

| Tool | Call When | What It Does | Output |
|------|-----------|-------------|--------|
| `get_spider_sense` | BEFORE editing any file | Compressed structural overview of file/directory | ~500 tokens of symbols, classes, types |
| `analyze_impact` | BEFORE renaming/refactoring a symbol | Finds all files referencing that symbol | File list or "SAFE" |
| `get_global_impact` | BEFORE modifying a shared/exported symbol | Scans sibling projects for references | Cross-project file list |
| `check_expert_rules` | AFTER writing/modifying code | Validates file against YAML expert rules | Violation list or "CLEAN" |
| `get_health` | FIRST, if any tool returns engine errors | Reports engine status + repair commands | Engine status JSON |

### Environment Variables

| Var | Default | Purpose |
|-----|---------|---------|
| `OMNI_LINK_WORKSPACE` | `../` from CWD | Cross-project scan root |
| `OMNI_LINK_SG_PATH` | auto-detected | Custom ast-grep binary path |
| `OMNI_LINK_DEBUG` | off | Enable verbose stderr logging |

---

## How It Works

```
Tool Call → SemanticOrchestrator → file extension check
                                    ├── .ts/.tsx/.js/.jsx  → Serena (high-fidelity AST)
                                    └── others              → ast-grep (universal)
                                  → SemanticCompressor (~500 token cap)
                                  → Response
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `SERENA_UNAVAILABLE` | uv not installed | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| `ASTGREP_UNAVAILABLE` | sg not found | `cargo install ast-grep` or set `OMNI_LINK_SG_PATH` |
| Tools return engine errors | Engine disconnected | Call `get_health` for repair instructions |
| Wrong workspace scanned | `OMNI_LINK_WORKSPACE` misconfigured | Set env var to correct parent directory |
| `Plugin omni-link not found` | Marketplace not registered | Add `omni-link` to `extraKnownMarketplaces` in `settings.json` |
| Tools not available in session | Plugin loaded, MCP tools not exposed | Run `/reload-plugins` or restart. Proxy setups may need the plugin approach or skill fallback. |

---

## Development

```bash
npm run dev        # watch mode
npm run inspector  # MCP inspector GUI
```

### Test

```bash
node scratch/test_mcp.js
```

---

## License

MIT — Leonardo Vergara ([iodevs.net](https://iodevs.net))
