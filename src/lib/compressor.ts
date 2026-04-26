export class SemanticCompressor {
  private static readonly MAX_CHARS = 2500;

  public static compress(rawSymbols: string): string {
    if (!rawSymbols) return "No symbols detected.";

    const lines = rawSymbols.split("\n")
      .map(line => line.trim())
      .filter(line => {
        const isComment = line.startsWith("//") || line.startsWith("/*") || line.startsWith("*") || line.startsWith("#");
        return line.length > 0 && !isComment;
      });

    const structuralLines: string[] = [];
    const implementationLines: string[] = [];

    const structuralRegex = /export|class|interface|enum|type|public|private|protected|abstract|extends|implements|def\s+|func\s+|struct\s+\{/;

    for (const line of lines) {
      if (structuralRegex.test(line)) {
        structuralLines.push(line);
      } else {
        implementationLines.push(line);
      }
    }

    let result = "--- Project Structure ---\n";
    let currentCharCount = result.length;
    let addedCount = 0;

    for (const line of structuralLines) {
      if (currentCharCount + line.length > this.MAX_CHARS) break;
      result += `- ${line}\n`;
      currentCharCount += line.length + 3;
      addedCount++;
    }

    if (currentCharCount < this.MAX_CHARS && implementationLines.length > 0) {
      result += "\n--- Implementation Details ---\n";
      currentCharCount += 28;
      for (const line of implementationLines) {
        if (currentCharCount + line.length > this.MAX_CHARS) break;
        result += `- ${line}\n`;
        currentCharCount += line.length + 3;
        addedCount++;
      }
    }

    if (addedCount < lines.length) {
      result += "\n[Note: Some minor details were omitted for brevity]";
    }

    return result;
  }
}
