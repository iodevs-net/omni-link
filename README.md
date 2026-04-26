# Omni-Link: Universal Semantic Intelligence Bridge

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Stack: TypeScript](https://img.shields.io/badge/Stack-TypeScript-blue)](https://www.typescriptlang.org/)

**Omni-Link** is a **Precision Layer** for AI coding agents. It provides high-fidelity architectural context by orchestrating multiple semantic engines (Serena, ast-grep) and compressing results into minimum viable context (~500 tokens).

---

## Quick Start

### Prerequisites

| Dependency | Required For | Install |
|-----------|-------------|---------|
| Node.js 18+ | Running Omni-Link | [nodejs.org](https://nodejs.org) |
| uv | Serena engine (TS/JS analysis) | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| ast-grep (sg) | Universal engine (Python/Go/Rust) | `cargo install ast-grep --locked` |

### Install & Build

```bash
cd omni-link
npm install    # installs deps + builds automatically (postinstall)
# or manually: npm run build
```

### Add to Your AI Client

**Claude Code** (`claude.json` at project root):

```json
{
  "mcpServers": {
    "omni-link": {
      "command": "node",
      "args": ["build/index.js"],
      "env": {
        "OMNI_LINK_WORKSPACE": ".."
      }
    }
  }
}
```

**VS Code** (`.vscode/mcp.json`):

```json
{
  "mcpServers": {
    "omni-link": {
      "command": "node",
      "args": ["${workspaceFolder}/build/index.js"]
    }
  }
}
```

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
