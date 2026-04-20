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
    // console.log("[Raw Output]", line);
  }
});

console.log("--- STARTING GLOBAL INTELLIGENCE TESTS ---");

// Test: Global Impact for ISemanticProvider
setTimeout(() => {
  console.log("\n[Test] Checking Global Impact for 'ISemanticProvider'...");
  sendRequest("tools/call", { name: "get_global_impact", arguments: { symbol_name: "ISemanticProvider" } }, 1);
}, 2000);

setTimeout(() => {
  console.log("\n--- TESTS FINISHED ---");
  process.exit(0);
}, 8000);
