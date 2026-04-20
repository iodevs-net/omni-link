import { spawn } from "child_process";

const child = spawn("node", ["build/index.js"]);

function sendRequest(method, params, id) {
  const req = {
    jsonrpc: "2.0",
    id,
    method,
    params
  };
  child.stdin.write(JSON.stringify(req) + "\n");
}

child.stdout.on("data", (data) => {
  const line = data.toString().trim();
  try {
    const response = JSON.parse(line);
    console.log(`[Response ${response.id}]`, JSON.stringify(response.result || response.error, null, 2));
  } catch (e) {
    console.log("[Raw Output]", line);
  }
});

child.stderr.on("data", (data) => {
  console.error("[Stderr]", data.toString());
});

console.log("--- STARTING ORCHESTRATION TESTS ---");

// Test 1: Health (Should show both engines)
setTimeout(() => {
  console.log("\n[Test 1] Multi-Engine Health Check...");
  sendRequest("tools/call", { name: "get_health", arguments: {} }, 1);
}, 1000);

// Test 2: TypeScript (Should use Serena)
setTimeout(() => {
  console.log("\n[Test 2] Routing to Serena (src/index.ts)...");
  sendRequest("tools/call", { name: "get_spider_sense", arguments: { path: "src/index.ts" } }, 2);
}, 3000);

// Test 3: Python (Should use ast-grep)
setTimeout(() => {
  console.log("\n[Test 3] Routing to ast-grep (test.py)...");
  // Creamos un archivo python temporal para probar
  spawn("sh", ["-c", "echo 'def hello():\n  print(\"world\")' > scratch/test.py"]);
  sendRequest("tools/call", { name: "get_spider_sense", arguments: { path: "scratch/test.py" } }, 3);
}, 6000);

setTimeout(() => {
  console.log("\n--- TESTS FINISHED ---");
  process.exit(0);
}, 10000);
