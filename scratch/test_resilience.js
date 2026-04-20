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

console.log("--- STARTING RESILIENCE TESTS ---");

// Test 1: Health Check
setTimeout(() => {
  console.log("\n[Test 1] Health Check...");
  sendRequest("tools/call", { name: "get_health", arguments: {} }, 1);
}, 1000);

// Test 2: Path Sanitization
setTimeout(() => {
  console.log("\n[Test 2] Path Sanitization (//src//index.ts)...");
  sendRequest("tools/call", { name: "get_spider_sense", arguments: { path: "//src//index.ts" } }, 2);
}, 3000);

// Test 3: Analyze Impact (Robust Extraction)
setTimeout(() => {
  console.log("\n[Test 3] Analyze Impact (OmniLinkServer)...");
  sendRequest("tools/call", { name: "analyze_impact", arguments: { symbol_name: "OmniLinkServer", path: "src/index.ts" } }, 3);
}, 6000);

setTimeout(() => {
  console.log("\n--- TESTS FINISHED ---");
  process.exit(0);
}, 10000);
