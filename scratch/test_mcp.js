import { spawn } from "child_process";

const child = spawn("node", ["build/index.js"]);

child.stdout.on("data", (data) => {
  console.log("Response:", data.toString());
  // No salimos inmediatamente para ver si llega algo más
});

child.stderr.on("data", (data) => {
  console.error("Stderr:", data.toString());
});

const callTool = {
  jsonrpc: "2.0",
  id: 2,
  method: "tools/call",
  params: {
    name: "get_spider_sense",
    arguments: {
      path: "src/index.ts"
    }
  }
};

child.stdin.write(JSON.stringify(callTool) + "\n");

setTimeout(() => {
  process.exit(0);
}, 5000);
