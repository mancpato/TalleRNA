# CLAUDE.md — TalleRNA

## Proyecto

TalleRNA es un visualizador interactivo de enjambres de redes neuronales, implementado como un único archivo HTML con p5.js. Permite explorar cómo hiperparámetros (tasa de aprendizaje, inicialización, activación, dropout, topología) afectan el entrenamiento de múltiples modelos simultáneamente, mostrando en tiempo real el espacio de decisión, el historial de pérdida y estadísticas del enjambre.

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `TalleRNA.html` | Único archivo de código — todo el proyecto vive aquí |
| `TalleRNAspec.md` | Especificación completa del proyecto (fuente de verdad) |
| `TalleRNA_Plan.md` | Plan de implementación por etapas y subtareas |
| `PROGRESO.md` | Estado actual, bugs corregidos, próximos pasos |

## Reglas de desarrollo

- **Una subtarea a la vez**: no implementar la siguiente hasta verificar visualmente o en consola la actual.
- **No avanzar sin verificar**: cada subtarea tiene criterio de verificación explícito en el prompt. Cumplirlo antes de continuar.
- **No borrar bloques de prueba**: los bloques `/* BLOQUE DE PRUEBA 1.x */` se comentan, nunca se eliminan.
- **`<!DOCTYPE html>` debe ser línea 1**: moverlo a cualquier otra posición activa Quirks Mode en el navegador y rompe el layout.
- **No tocar etapas anteriores** al implementar una nueva, salvo corrección de bug explícitamente solicitada.

## Bugs ya corregidos

| Bug | Descripción |
|-----|-------------|
| Bug#1 | `forward()` aplicaba sigmoid en regresión — corregido usando `esTipoClasif` |
| Bug#2 | Dropout usaba semilla LCG fija — corregido incorporando `modelo.stepCount * 997` |
| Bug#3 | `actualizarPesos()` desestructuraba `pesos/velPesos` de `gradientes` (undefined) — corregido leyendo de `modelo` |
| Bug#4 | `esTipoClasif` nunca se actualizaba al cambiar problema — corregido al final de `generarDatos()` |
| Bug#5 | `entrenarEpoca()` no guardaba resultados en `modelo.historial` — corregido con push al final |
| Bug#6 | Fronteras con `beginShape/vertex` sobre puntos desordenados producían líneas erráticas — reemplazado por `point()` |

## Decisiones de implementación

- **LCG seeded en lugar de `Math.random()`**: toda aleatoriedad (datos, pesos, dropout) usa la clase `LCG` con semilla explícita para garantizar reproducibilidad determinista entre sesiones.
- **`Float32Array`**: pesos, sesgos, velocidades y gradientes usan `Float32Array` para eficiencia de memoria y operaciones numéricas.
- **`point()` en lugar de `beginShape` para fronteras**: los puntos de frontera extraídos de la grilla 50×50 no están ordenados espacialmente, por lo que conectarlos con polilínea produce artefactos. Se dibujan como puntos individuales con `strokeWeight(2)`.
- **`gfxMapa` recreado en `windowResized()`**: el `createGraphics` tiene dimensiones fijas al momento de creación; si no se recrea tras `resizeCanvas()`, el mapa se desborda o queda mal escalado.
- **Detección de clicks en UI con coordenadas brutas**: los botones de Panel 3 y las pestañas se detectan comparando `mouseX/mouseY` con los rectángulos calculados por `panelRect()`, sin elementos DOM adicionales.

## Pendientes conocidos

- **Visualización 1D para regresión seno** (Etapa 5): Panel 1 actualmente asume clasificación 2D. Para el problema `seno` habrá que adaptar el renderizado a una curva x₁ → ŷ.
- **Símbolo ✕ para modelos divergentes** (Etapa 4): los modelos que divergen deben marcarse visualmente con una cruz sobre su frontera/posición en Panel 1.
- **Ordenamiento de puntos de frontera** (Etapa 5): si en el futuro se necesita una curva suave, habrá que ordenar los puntos de frontera por ángulo o recorrido antes de conectarlos con `beginShape`.
