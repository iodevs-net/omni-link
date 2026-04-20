# 🕸️ Omni-Link: Universal Semantic Intelligence Bridge

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Engine: Serena](https://img.shields.io/badge/Engine-Serena-blueviolet)](https://github.com/oraios/serena)
[![Parser: ast-grep](https://img.shields.io/badge/Parser-ast--grep-red)](https://ast-grep.github.io/)
[![Stack: TypeScript](https://img.shields.io/badge/Stack-TypeScript-blue)](https://www.typescriptlang.org/)

**Omni-Link** is the **Precision Layer** for AI coding agents. It acts as a standardized semantic bridge that provides high-fidelity architectural context while minimizing context noise. By orchestrating multiple semantic engines, Omni-Link ensures that even the most constrained LLMs operate with senior-level structural awareness.

---

## 🚀 Key Value Proposition

Omni-Link solves the "Context Overload" problem by replacing raw code dumps with **High-Density Semantic Advisories**.

- **MVC (Minimum Viable Context):** Replaces raw code dumps with task-specific semantic maps.
- **Precision Orchestration:** Dynamically routes queries to the best engine (Serena, ast-grep, or LSP) for the job.
- **Cross-Project Intelligence (CPSI):** Detects breaking changes across your entire dev workspace.
- **Agent Synergy:** Designed to enhance power-tools like `oh-my-pi`, `Antigravity`, and `Claude Code`.

---

## 🏗️ Architecture

Omni-Link follows a strictly decoupled three-layer architecture:

```mermaid
graph TD
    subgraph Layer_C [Layer C: Interface]
        MCP[Universal MCP Server]
    end

    subgraph Layer_B [Layer B: Compression]
        SC[Semantic Compressor]
    end

    subgraph Layer_A [Layer A: Orchestration]
        ORCH[Semantic Orchestrator]
        SER[Serena Adapter]
        AST[ast-grep Provider]
    end

    MCP --> SC
    SC --> ORCH
    ORCH --> SER
    ORCH --> AST
```

---

## 🛠️ Available MCP Tools

| Tool | Purpose | Key Benefit |
| :--- | :--- | :--- |
| `get_spider_sense` | Compressed structural overview of a path. | Understand architecture in < 500 tokens. |
| `analyze_impact` | Local reference analysis. | Prevent breaking changes in the current repo. |
| `get_global_impact` | **Workspace-wide** dependency analysis. | Detect cross-project "butterfly effects". |
| `check_expert_rules` | **Sentinel**: Validate code against expert rules. | Ensure compliance with project-specific gotchas. |
| `get_health` | Multi-engine status and telemetry. | Ensure semantic engines are alive and responsive. |

---

## 💻 Quick Start

### Prerequisites
- **Node.js / Bun**
- **Serena MCP:** (Auto-spawned via `uvx`)
- **ast-grep:** `cargo install ast-grep` (for non-TS projects)

### Installation
```bash
bun install
npm run build
```

### Configuration (Antigravity/Claude/Gemini CLI)
Add the following to your `mcp_config.json`:
```json
"omni-link": {
  "command": "node",
  "args": ["/absolute/path/to/omni-link/build/index.js"]
}
```

---

## 🛡️ Engineering Principles (MASTER-PROTOCOL)

Omni-Link development is governed by the `MASTER-PROTOCOL.md`:
- **DRY:** Never reinvent the parser; leverage existing high-performance binaries.
- **KISS:** Keep the agent interface simple; hide the complexity of multi-engine routing.
- **LEAN:** No visual fluff, no "AI Lore". Pure, high-density data.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---
### Manual Test
```bash
node scratch/test_mcp.js
```

---
---
## 👤 Author

**Leonardo Vergara**
- Email: [leonardovergaramarin@gmail.com](mailto:leonardovergaramarin@gmail.com)
- Web: [iodevs.net](https://iodevs.net)
- Company: [ionet.cl](https://ionet.cl)

---
**Omni-Link** — *Giving Agents the Vision to Build Resilient Systems.*
