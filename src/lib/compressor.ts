/**
 * Layer B: Semantic Compressor (Elite Version)
 * Procesa y comprime la data de Serena para maximizar el valor por token.
 */
export class SemanticCompressor {
  private static readonly MAX_CHARS = 2500; // ~500-600 tokens

  public static compress(rawSymbols: string): string {
    if (!rawSymbols) return "No symbols detected.";

    // 1. Limpieza de ruido (Comentarios y líneas vacías)
    const lines = rawSymbols.split("\n")
      .map(line => line.trim())
      .filter(line => {
        const isComment = line.startsWith("//") || line.startsWith("/*") || line.startsWith("*") || line.startsWith("#");
        return line.length > 0 && !isComment;
      });

    // 2. Clasificación por Relevancia Estructural
    const structuralLines: string[] = [];
    const implementationLines: string[] = [];

    // Regex expandido para Python (def, class) y Go (func, type, struct)
    const structuralRegex = /export|class|interface|enum|type|public|private|protected|abstract|extends|implements|def\s+|func\s+|struct\s+\{/;

    for (const line of lines) {
      if (structuralRegex.test(line)) {
        structuralLines.push(line);
      } else {
        implementationLines.push(line);
      }
    }

    // 3. Ensamblaje con Prioridad
    let result = "--- Project Structure ---\n";
    let currentCharCount = result.length;
    let addedCount = 0;

    // Añadir líneas estructurales primero
    for (const line of structuralLines) {
      if (currentCharCount + line.length > this.MAX_CHARS) break;
      result += `- ${line}\n`;
      currentCharCount += line.length + 3;
      addedCount++;
    }

    // Añadir líneas de implementación si queda espacio
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

    // 4. Indicador de Truncamiento REAL
    if (addedCount < lines.length) {
      result += "\n[Note: Some minor details were omitted for brevity]";
    }

    return result;
  }
}
