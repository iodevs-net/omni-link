---
name: omni-link
description: |
  Trigger when user asks about code analysis, semantic understanding, 
  impact analysis, codebase overview, dependency tracing, or symbol lookup.
  Use BEFORE get_spider_sense, analyze_impact, explore_call_graph, get_health, get_symbols_overview.
allowed-tools: [Bash]
model: sonnet
---

## Semantic Code Analysis via omni-link

Call `@iodevs/omni-link` MCP server via stdin/stdout JSON-RPC:

```bash
node -e "
import { spawn } from 'node:child_process';
const s = spawn('npx', ['-y', '@iodevs/omni-link'], { stdio: ['pipe', 'pipe', 'pipe'] });
let b = '';
s.stdout.on('data', c => { b += c.toString(); tryLn(); });
function tryLn() {
  const i = b.indexOf('\n');
  if (i === -1) return;
  const line = b.slice(0, i).trim();
  b = b.slice(i + 1);
  if (line) {
    try { 
      const r = JSON.parse(line);
      const txt = r.result?.content?.[0]?.text || r.error?.message || JSON.stringify(r);
      console.log(txt);
    } catch(e) { console.log(line); }
    s.kill();
  }
}
const req = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'TOOL_NAME', arguments: TOOL_ARGS } });
s.stdin.write(req + '\n');
setTimeout(() => { s.kill(); process.exit(1); }, 15000);
"
```

Replace `TOOL_NAME` and `TOOL_ARGS` with values below.

### Tools

#### get_spider_sense
Structural overview of a file. Call BEFORE editing unfamiliar code.
```json
{ "name": "get_spider_sense", "arguments": { "path": "src/file.ts" } }
```

#### analyze_impact
Find what depends on a symbol. Call BEFORE renaming/refactoring.
```json
{ "name": "analyze_impact", "arguments": { "symbol_name": "ClassName", "path": "src/file.ts" } }
```

#### explore_call_graph
Find incoming references to a symbol.
```json
{ "name": "explore_call_graph", "arguments": { "symbol_name": "methodName", "path": "src/file.ts" } }
```

#### get_symbols_overview
Quick file symbol listing (classes, functions, interfaces).
```json
{ "name": "get_symbols_overview", "arguments": { "path": "src/lib/serena.ts" } }
```

#### get_health
Verify omni-link MCP server is functional.
```json
{ "name": "get_health", "arguments": {} }
```
