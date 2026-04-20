# MASTER-SPEC-PROTOCOL: Omni-Link Universal Bridge

## 1. Visión y Objetivo
Estandarizar la **Inteligencia Semántica Proactiva** para agentes de IA. Omni-Link actúa como un orquestador que comprime el AST y las dependencias del código en un flujo de tokens de alta densidad, permitiendo a los agentes "ver" el impacto de sus cambios antes de ejecutarlos.

### Core Principles
| Principio | Aplicación en Omni-Link |
| :--- | :--- |
| **Agnosticismo** | Funcionar en cualquier plataforma compatible con MCP (stdio/http). |
| **Densidad** | Maximizar el valor por token (Spider Sense > Raw Output). |
| **Resiliencia** | Circuit-breaker, caching y multi-engine fallback para garantizar disponibilidad. |
| **Modularidad** | Capas A (Adapters), B (Compressor) y C (Interface) estrictamente separadas. |
| **Seguridad Elite** | Validación estricta de rutas y sanitización de inputs (Anti-Path Traversal). |

---

## 2. Arquitectura de Inteligencia (Layers)

1.  **Layer A: Semantic Orchestrator (Multi-Engine)**
    *   Gestiona el enrutamiento a proveedores especializados basado en extensión de archivo.
    *   Motores: Serena (TS/JS), ast-grep (Universal/Python/Go/Rust).
2.  **Layer B: Compression Engine**
    *   Transforma datos crudos de símbolos en contextos estructurados.
    *   Límite estricto: ~2500 caracteres (600 tokens) para evitar el "Context Overload".
3.  **Layer C: Universal MCP Interface**
    *   Exposición de herramientas estandarizadas: `get_spider_sense`, `analyze_impact`.
    *   Health reporting proactivo con telemetría de latencia.

---

## 3. Sistema de GATES (Elite Workflow)

*   **GATE 0: Aislamiento**: Entorno de desarrollo aislado (uv, nvm, rustup).
*   **GATE 1: Análisis Estructural**: Validar el árbol sintáctico (AST) antes de proponer cambios.
*   **GATE 2: Planificación Atómica**: Definir tareas en `implementation_plan.md` y `task.md`.
*   **GATE 3: Implementación SOLID**: Código idiomático, seguro y listo para producción.
*   **GATE 4: Verificación Cruzada**: `npm run build` + `test_orchestration.js`.
*   **GATE 5: Auditoría de Contexto**: Validar que la salida del compressor sea útil y concisa.

---

## 4. Mapa de Implementación (Roadmap 2026)

### Fase 1: Cimentación (Completada)
*   [x] Serena Adapter Core.
*   [x] Semantic Compressor inicial.
*   [x] MCP Interface básica.

### Fase 2: Resiliencia (Completada)
*   [x] Sanitización de rutas y path traversal protection.
*   [x] Health heartbeat y caching.
*   [x] Soporte multilingüe básico (regex-based).

### Fase 3: Orquestación Universal (ACTIVA)
*   [ ] **Orchestrator Logic**: Enrutamiento dinámico por extensión.
*   [ ] **ast-grep Integration**: Motor de alto rendimiento para Python, Go y Rust.
*   [ ] **Detailed Health**: Reporte de estado por cada motor independiente.

---

## 5. Reglas de Ingeniería (AI Mandatory Instructions)

1.  **Protección de Hardware**: Minimizar escrituras en SSD. Usar `/scratch` para basura técnica.
2.  **Heartbeat Semántico**: Toda herramienta debe verificar el estado del motor antes de procesar.
3.  **Sanitización Total**: No se confía en ninguna ruta proporcionada por el host.
4.  **No Lore**: Comunicación técnica directa. Cero redundancia.

---

**Estado del Protocolo: ACTIVO / FASE III (Orquestación Universal)**
