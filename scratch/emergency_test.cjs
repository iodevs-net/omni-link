const { spawn } = require('child_process');

const server = spawn('node', ['build/index.js'], {
    cwd: '/home/leonardo/dev/proyectos/omni-link'
});

const request = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
        name: "get_spider_sense",
        arguments: {
            path: "/home/leonardo/dev/proyectos/iodesk-3"
        }
    }
};

server.stdout.on('data', (data) => {
    console.log("RESPONSE FROM SERVER:");
    console.log(data.toString());
    process.exit(0);
});

server.stderr.on('data', (data) => {
    console.error("SERVER ERROR:", data.toString());
});

server.stdin.write(JSON.stringify(request) + "\n");
