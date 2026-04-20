import { SemanticCompressor } from "../build/lib/compressor.js";

const pythonMock = `
# This is a comment
def main():
    print("Hello")

class MyService:
    async def process(self, data):
        return data.upper()

def _internal():
    pass
`;

const goMock = `
// Package comment
package main

import "fmt"

type Config struct {
    ID int
}

func (c *Config) Run() {
    fmt.Println("Running")
}

func main() {
}
`;

console.log("--- PYTHON COMPRESSION TEST ---");
console.log(SemanticCompressor.compress(pythonMock));

console.log("\n--- GO COMPRESSION TEST ---");
console.log(SemanticCompressor.compress(goMock));
