# Omni-Link (v1.0.0)

**Universal Semantic Intelligence Bridge MCP**

**Omni-Link** es un servidor MCP (Model Context Protocol) que actúa como una capa de inteligencia semántica proactiva para agentes IA. Inspirado en el plugin `omni-pi`, este servidor permite que cualquier IDE o terminal agéntica tenga un "Sentido Arácnido" sobre el código.

## 🕸️ Sentido Arácnido (Spider-Sense)

Omni-Link no solo lee archivos; entiende la arquitectura. Utiliza **Serena MCP** como motor semántico subyacente y aplica una capa de **Elite Resilience** y **Semantic Compression** para entregar el contexto exacto sin saturar la ventana de tokens.

### Herramientas Disponibles:

- `get_spider_sense`: Devuelve un resumen comprimido de los símbolos y la estructura de un archivo o directorio. Ideal para inyectar en el contexto antes de realizar cambios.
- `analyze_impact`: Identifica qué otros archivos y símbolos dependen de uno específico. Previene regresiones y roturas de contrato.
- `get_health`: Informa sobre el estado de la conexión con Serena y la salud de la caché semántica.

## 🚀 Instalación y Uso

### Requisitos
- [Bun](https://bun.sh/) o Node.js.
- [uv](https://github.com/astral-sh/uv) (para levantar Serena automáticamente).

### Configuración en tu Agente (Ejemplo Antigravity/Claude Desktop)

Añade esto a tu configuración de MCP:

```json
{
  "mcpServers": {
    "omni-link": {
      "command": "node",
      "args": ["/ruta/a/omni-link/build/index.js"]
    }
  }
}
```

### Desarrollo

1. Instalar dependencias: `bun install`
2. Compilar: `npm run build`
3. Probar: `node scratch/test_mcp.js`

## 🛡️ Arquitectura

- **Layer A (Adaptación):** Conecta con Serena MCP vía stdio con lógica de reconexión automática.
- **Layer B (Compresión):** Filtra y prioriza símbolos estructurales sobre detalles de implementación.
- **Layer C (Interfaz):** Expone herramientas MCP simplificadas para un consumo rápido por parte de la IA.

## 📄 Licencia

MIT - Elevando la precisión de la ingeniería asistida por IA.
