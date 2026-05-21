# ESPECIFICACIÓN: Módulo Experimental
## TalleRNA — Módulo 6: Experimento Factorial de Dos Hiperparámetros
**Versión 1.0** — Anexo a TalleRNAspec.md v1.1

---

## E1. VISIÓN GENERAL

El módulo experimental permite variar **dos hiperparámetros simultáneamente**
y observar cómo interactúan. A diferencia de los cinco módulos anteriores
(estudios de sensibilidad univariados), este módulo produce un estudio
factorial: cada combinación de valores es un modelo independiente, y el
resultado es una grilla 2D de métricas que revela interacciones no observables
variando un solo hiperparámetro a la vez.

**Pregunta pedagógica central**: el efecto de η no es independiente de
dropout, activación o topología. Este módulo hace esa dependencia visible.

**Diferencia operacional respecto a los módulos simples**: no existe control
de velocidad, pausa ni avance por pasos. El experimento se lanza y corre hasta
completarse. La interacción del usuario es: configurar → iniciar → observar
progreso → analizar resultados → exportar CSV.

El módulo se agrega como **sexta pestaña** en TalleRNA. El archivo es
`modulos/experimento.js`. No requiere cambios en el motor matemático ni en
los paneles compartidos (`panel1.js`, `panel2.js`, `panel4.js`), salvo la
adición de modos de renderizado específicos descritos en §E7 y §E8.

---

## E2. HIPERPARÁMETROS DISPONIBLES Y SUS TIPOS

La distinción de tipos determina la visualización válida en Panel 4.

### E2.1 Continuos numéricos

El usuario define mínimo, máximo y número de pasos. Los valores se
distribuyen uniformemente en escala lineal (dropout, momentum) o logarítmica
(η).

| Hiperparámetro | Rango permitido | Escala | Default |
|---|---|---|---|
| η (tasa de aprendizaje) | [0.001, 0.50] | logarítmica | [0.01, 0.20], 4 pasos |
| Dropout p | [0.0, 0.80] | lineal | [0.0, 0.40], 5 pasos |
| Momentum β | [0.0, 0.99] | lineal | [0.0, 0.90], 4 pasos |

Para continuos: el **heatmap 2D es la visualización correcta** en Panel 4.
Los ejes representan escalas reales; los gradientes de color son
interpretables; la continuidad visual es válida.

### E2.2 Discretos ordinales

El usuario selecciona cuáles incluir mediante checkboxes. Existe un orden
implícito de complejidad creciente pero no una métrica continua entre ellos.

| Hiperparámetro | Opciones | Orden |
|---|---|---|
| Topología | T0–T7 (ver §6.5 de la spec principal) | Complejidad creciente |

Para ordinales: el **heatmap es permitido** pero el eje se etiqueta con
nombres de arquitectura (T0, T1, ...), nunca con índices numéricos. Las
celdas no se interpolan visualmente entre sí.

### E2.3 Discretos categóricos

No existe orden entre los valores. Un heatmap con estos valores en un eje
sugeriría falsamente que existe algo "entre" categorías.

| Hiperparámetro | Opciones |
|---|---|
| Activación | ReLU, Sigmoid, Tanh, Lineal, Leaky ReLU |

Para categóricos: el heatmap **no se usa**. Panel 4 muestra una
**tabla de barras agrupadas** (ver §E8.2). Todo lo demás — CSV, Panel 1,
Panel 2 — funciona de forma idéntica.

---

## E3. PARES DE HIPERPARÁMETROS

### E3.1 Sistema híbrido: pares curados + modo libre

**Selector desplegable con dos secciones:**

**Pares recomendados** — valores por defecto preconfigurados, pregunta
pedagógica explícita visible en Panel 3:

| Par | Pregunta pedagógica | Viz. Panel 4 |
|---|---|---|
| η × dropout | ¿Compensa regularizar si se sube la tasa? | Heatmap |
| η × activación | ¿ReLU sigue ganando con η pequeña? | Barras agrupadas |
| η × topología | ¿Una red más profunda necesita η más baja? | Heatmap |
| η × momentum β | ¿Con β alto puedo usar η más pequeña? | Heatmap |
| dropout × topología | ¿El dropout importa más en redes grandes? | Heatmap |

**Modo libre** — dos selectores independientes con todos los hiperparámetros
disponibles. Restricciones:
- No se puede seleccionar el mismo hiperparámetro en ambos ejes.
- Si se selecciona activación, se muestra aviso: "Panel 4 usará tabla de
  barras en lugar de mapa de calor".
- Si el producto de pasos supera 49, se muestra advertencia de tiempo
  estimado antes de habilitar el botón "Iniciar experimento".

### E3.2 Qué permanece fijo en todos los experimentos

Los valores fijos durante un experimento son los de la red base global
(display en barra global), excepto los dos hiperparámetros que varían.
La semilla de pesos es la misma para todos los modelos de la grilla (ver §E5).

---

## E4. GRILLA DE EXPERIMENTOS

### E4.1 Dimensiones y límites

```
n₁ × n₂ = total de modelos

Por defecto: máximo 5 valores por eje → 5×5 = 25 modelos
Límite configurable: hasta 7 valores por eje → 7×7 = 49 modelos
```

Pasos mínimos: 2 por eje (al menos 4 modelos totales).

Si el total supera 25, el botón "Iniciar" muestra antes de ejecutar:
```
"Este experimento entrenará N modelos. Tiempo estimado: ~X segundos."
[ Confirmar ]  [ Cancelar ]
```

El tiempo estimado se calcula como `N × t_referencia`, donde `t_referencia`
es el tiempo del último modelo entrenado en la sesión o 500ms si no hay
referencia.

### E4.2 Identificación de cada celda

Cada celda de la grilla se identifica por sus coordenadas `(i, j)`:
- `i`: índice del primer hiperparámetro (eje Y del heatmap, fila)
- `j`: índice del segundo hiperparámetro (eje X del heatmap, columna)

El valor de cada hiperparámetro en la celda `(i, j)` es:

```
Para continuos:
  val[k] = min_k + (max_k - min_k) * k / (pasos_k - 1)
  (k = i para el primero, k = j para el segundo)

Para discretos (topología, activación):
  val[k] = lista_seleccionada[k]
```

---

## E5. SINCRONIZACIÓN DE SEMILLAS

### E5.1 Semilla de pesos

**Todos los modelos de la grilla usan la misma semilla de inicialización
de pesos** (por defecto: 1). Esto aísla el efecto del hiperparámetro que
varía y elimina el ruido de la inicialización.

La semilla es configurable en Panel 3 antes de iniciar. El usuario puede
cambiarla, lanzar el experimento de nuevo, y comparar los dos CSVs
exportados — ese es el flujo de trabajo para estimar varianza.

### E5.2 Semilla de datos

La semilla de datos (visible en la barra global) no cambia durante el
experimento. Está sincronizada con el resto de la aplicación.

### E5.3 Lo que NO se implementa

Sin repeticiones automáticas con promedio. El promedio sobre semillas es
trabajo del estudiante fuera de la aplicación, usando los CSVs exportados
y herramientas externas (R, Python).

---

## E6. ESTRUCTURA DE DATOS: ExperimentRun

Cada celda de la grilla es un `ExperimentRun` independiente con ciclo de
vida propio. Esta estructura es la única adición de datos nueva que no existe
en el motor actual.

```javascript
ExperimentRun {
  coordenada:    {i, j},                   // posición en la grilla
  hiper1:        {nombre, valor},          // ej. {nombre:'eta', valor:0.05}
  hiper2:        {nombre, valor},          // ej. {nombre:'dropout', valor:0.2}
  modelo:        ModeloRNA,                // objeto del motor matemático
  estado:        'pendiente'               // ver §E6.1
             | 'entrenando'
             | 'convergido'
             | 'max_epocas'
             | 'divergente'
             | 'nan'
             | 'cancelado',
  metricas: {
    J_train:     number | null,
    J_test:      number | null,
    accuracy:    number | null,            // null en regresión
    epocas:      number | null,
    gap:         number | null,            // J_test - J_train
    tiempo_ms:   number | null            // tiempo total de entrenamiento
  },
  historial:     Array<{epoca, J_train, J_test, accuracy_test}>,
  workerId:      number | null             // worker asignado
}
```

### E6.1 Estados del ExperimentRun

```
pendiente   → esperando en la cola del pool de workers
entrenando  → worker activo procesando épocas
convergido  → criterio de convergencia cumplido (§12.4 de la spec principal)
max_epocas  → máximo de épocas alcanzado sin convergencia
divergente  → pérdida explota (criterio §12.4)
nan         → NaN detectado en pesos o pérdida
cancelado   → usuario canceló el experimento en curso
```

La distinción `divergente` / `nan` / `max_epocas` es importante para el
análisis: cada estado tiene significado pedagógico distinto y aparece
diferenciado en el CSV y en el heatmap.

---

## E7. LÓGICA DE EJECUCIÓN

### E7.1 Pool de Web Workers

```
Pool fijo de 4 workers concurrentes.
Cola de experimentos pendientes: FIFO.
Al completar un ExperimentRun, el worker toma el siguiente de la cola.
```

El motor matemático completo (`motor_ml.js`) se carga en cada worker.
Los workers no acceden al DOM ni a variables globales de p5.js.
La comunicación es por mensajes:

```javascript
// Worker → Main (al completar cada época)
{ tipo: 'progreso', coordenada, epoca, J_train, J_test }

// Worker → Main (al terminar)
{ tipo: 'completado', coordenada, estado, metricas, historial }

// Main → Worker (para cancelar)
{ tipo: 'cancelar' }
```

### E7.2 Actualización de la interfaz

El hilo principal recibe mensajes de workers en `onmessage` y actualiza:
- La barra de progreso global (modelos completados / total).
- La celda correspondiente en el heatmap (color + estado).
- Panel 1 si el modelo completado es el que está en hover.

La interfaz se actualiza por eventos, no por polling. El bucle `draw()` de
p5.js solo dibuja el estado actual — no lanza cálculos.

### E7.3 Cancelación

El botón "Cancelar" (único control disponible durante la ejecución) envía
mensaje de cancelación a todos los workers activos, marca los runs pendientes
como `cancelado`, y transiciona a estado CONFIGURANDO. Los resultados de runs
ya completados se conservan y son exportables.

---

## E8. PANEL 4 — VISUALIZACIÓN DE RESULTADOS

Panel 4 tiene dos modos de renderizado según el tipo del segundo
hiperparámetro. El primero siempre es el eje Y.

### E8.1 Modo Heatmap (continuo × continuo, continuo × ordinal)

```
          [eje X: hiper2]
          v₁    v₂    v₃    v₄    v₅
[eje Y]
  v₁    [ ]   [ ]   [ ]   [ ]   [ ]
  v₂    [ ]   [ ]   [ ]   [ ]   [ ]
  v₃    [ ]   [ ]   [ ]   [ ]   [ ]
  v₄    [ ]   [ ]   [ ]   [ ]   [ ]
  v₅    [ ]   [ ]   [ ]   [ ]   [ ]
```

**Color**: paleta perceptualmente uniforme (viridis). Verde oscuro = valor
bajo (bueno para J, gap; malo para accuracy). El sentido de la paleta se
invierte automáticamente según la métrica seleccionada.

**Estados especiales en el heatmap**:
- `pendiente`: celda gris claro con punto parpadeante
- `entrenando`: celda gris con barra de progreso de épocas interna
- `divergente`: celda gris oscuro con patrón de rayas diagonales
- `nan`: celda negra con símbolo ∅
- `max_epocas`: celda con borde discontinuo (no convergió pero tiene valor)
- `cancelado`: celda gris medio

**Métrica visualizada** (selector en Panel 4):
```
[ J_test ▾ ]   opciones: J_test · J_train · Accuracy · Épocas · Gap (J_test−J_train)
```

**Interacción con el heatmap**:
- Hover sobre celda → Panel 1 muestra la frontera de ese modelo + las 4
  celdas vecinas en gris tenue. Panel 2 muestra la curva de ese modelo.
- Click en celda → selección fija (persiste al mover el mouse).
- Click en fila completa (en etiqueta del eje Y) → Panel 2 muestra todas
  las curvas de esa fila (valor fijo del hiper1, todos los hiper2).
- Click en columna completa (en etiqueta del eje X) → análogo.

**Tooltip** al hacer hover sobre celda:
```
η = 0.05  dropout = 0.2
J_test:   0.142
J_train:  0.118
Gap:      0.024
Accuracy: 84.1%
Épocas:   67
Estado:   convergido
Tiempo:   312 ms
```

### E8.2 Modo Barras Agrupadas (cualquier eje × categórico)

Cuando uno de los dos hiperparámetros es activación:

```
          ReLU   Sigmoid  Tanh   Lineal  Leaky
          ████   ████     ████   ████    ████   η = 0.01
          ████   ████     ████   ████    ████   η = 0.05
          ████   ████     ████   ████    ████   η = 0.10
          ████   ████     ████   ████    ████   η = 0.20
```

Una barra por función de activación, agrupadas por valor del otro
hiperparámetro. Altura = métrica seleccionada. El eje X no implica orden ni
continuidad entre funciones de activación.

La métrica seleccionable es la misma que en el modo heatmap.

---

## E9. PANEL 1 EN EL MÓDULO EXPERIMENTAL

Panel 1 muestra la frontera del modelo en hover y, opcionalmente, las
fronteras de sus vecinos inmediatos en la grilla.

```
Modelo en hover:         frontera en color del modelo, opacidad 100%, grosor 2.5px
Vecinos inmediatos (4):  frontera en gris claro, opacidad 30%, grosor 1px
Resto de modelos:        no se dibuja
```

Los datos train/test se dibujan siempre (capas 2 y 3 de §7.2).
El mapa de predicción de fondo corresponde al modelo en hover.

Si no hay hover activo, Panel 1 muestra el último modelo seleccionado
(por click en heatmap). Si tampoco hay selección, Panel 1 muestra el
modelo de menor J_test entre los completados.

---

## E10. PANEL 2 EN EL MÓDULO EXPERIMENTAL

Panel 2 muestra curvas de pérdida filtradas según la interacción con Panel 4.

**Sin selección**: no dibuja curvas (demasiadas para ser útil).
**Hover en celda**: curva de ese modelo, grosor 2px, color del modelo.
**Click en celda**: idem, persiste.
**Click en fila/columna del heatmap**: curvas de esa fila/columna,
  coloreadas por el valor del hiperparámetro que varía, leyenda visible.

Los toggles Lin/Log y J/Accuracy siguen funcionando igual que en los módulos
simples. El toggle "Mostrar test" está activo por defecto en este módulo
(la brecha train/test es especialmente informativa aquí).

---

## E11. PANEL 3 EN EL MÓDULO EXPERIMENTAL

Panel 3 tiene dos fases: **Configuración** (antes de iniciar) y
**Progreso** (durante la ejecución).

### E11.1 Fase de Configuración

```
[ Iniciar experimento ]

Par de hiperparámetros:
[ η × dropout ▾ ]   ← menú desplegable (§E3.1)

── Hiperparámetro 1: η ──────────────────────────────────────
  Mín: [0.01]   Máx: [0.20]   Pasos: [ 4 ▾ ] (2–7)
  Valores: 0.010 · 0.077 · 0.143 · 0.210

── Hiperparámetro 2: dropout ────────────────────────────────
  Mín: [0.0]    Máx: [0.40]   Pasos: [ 5 ▾ ] (2–7)
  Valores: 0.0 · 0.1 · 0.2 · 0.3 · 0.4

── Configuración general ────────────────────────────────────
  Épocas máx.:  [200]
  Semilla pesos: [1]   (misma para todos los modelos)
  Total modelos: 20

── Pregunta pedagógica ──────────────────────────────────────
  "¿Compensa regularizar más si se sube la tasa de aprendizaje?"
  (texto fijo por par curado; vacío en modo libre)
```

Los valores de cada hiperparámetro se muestran en tiempo real al modificar
mín, máx o pasos, para que el usuario vea exactamente qué se va a entrenar.

Para hiperparámetros discretos (activación, topología), los controles de
mín/máx/pasos se reemplazan por checkboxes de los valores disponibles.

### E11.2 Fase de Progreso

Al presionar "Iniciar experimento", Panel 3 cambia completamente:

```
[ Cancelar ]

Progreso global:
████████████░░░░░░░░░░  12 / 20 modelos

Workers activos:
  W1: η=0.05  dp=0.2  → época 143/200
  W2: η=0.10  dp=0.2  → época  89/200
  W3: η=0.15  dp=0.1  → convergido ✓  (J_test=0.142, 67 ép.)
  W4: η=0.20  dp=0.0  → divergente ✗

Completados:
  ✓ convergidos:    8
  ✗ divergentes:    1
  — max épocas:     3
  ⏳ pendientes:    8
```

La sección "Workers activos" se actualiza en tiempo real por mensajes de
los workers. La sección "Completados" acumula al terminar cada run.

### E11.3 Botón de exportación CSV

Aparece en Panel 3 al completar el experimento (todos los runs en estado
terminal). Si el usuario canceló, aparece igualmente con los runs completados.

```
[ Exportar CSV ]   tallerna_eta-dropout_20260518-1430.csv
```

---

## E12. EXPORTACIÓN CSV

### E12.1 Formato

```csv
# TalleRNA — Experimento Factorial
# Versión: 1.1
# Fecha: 2026-05-18 14:30:22
# Problema: espiral   Ruido: 15%   Train: 80%   Semilla datos: 4721
# Semilla pesos: 1  (misma para todos los modelos)
# Hiper 1: eta      escala: logarítmica   rango: [0.010, 0.200]   pasos: 4
# Hiper 2: dropout  escala: lineal        rango: [0.0, 0.4]       pasos: 5
# Total modelos: 20   Workers: 4   Épocas máx.: 200
# Tiempo total experimento: 18432 ms
#
eta,dropout,J_train,J_test,accuracy,epocas,gap,estado,tiempo_ms
0.010,0.000,0.412,0.418,71.2,200,,max_epocas,842
0.010,0.100,0.380,0.385,73.5,200,,max_epocas,819
0.010,0.200,0.371,0.374,74.1,200,,max_epocas,834
0.077,0.200,0.191,0.194,84.1,67,0.003,convergido,312
0.200,0.300,,,,,divergente,41
```

**Notas sobre el formato**:
- Columna `accuracy` es vacía en problemas de regresión.
- Columna `gap` = J_test − J_train. Vacía si cualquiera de las dos es nula.
- Para runs divergentes o NaN, las métricas numéricas quedan vacías.
- La columna `estado` usa los valores de §E6.1 en inglés minúscula
  (`convergido`, `max_epocas`, `divergente`, `nan`, `cancelado`) para
  facilitar el filtrado en R/Python.

### E12.2 Nombre del archivo

```
tallerna_{hiper1}-{hiper2}_{YYYYMMDD}-{HHMM}.csv
```

Ejemplos:
```
tallerna_eta-dropout_20260518-1430.csv
tallerna_eta-activacion_20260518-1517.csv
tallerna_dropout-topologia_20260518-1602.csv
```

Para modo libre con orden arbitrario, el primer hiperparámetro en el nombre
es siempre el del eje Y del heatmap (el que el usuario configuró como "1").

---

## E13. MÁQUINA DE ESTADOS DEL MÓDULO EXPERIMENTAL

El módulo experimental tiene su propia máquina de estados, independiente
de la máquina global de TalleRNA:

```
CONFIGURANDO  →  EJECUTANDO  →  COMPLETADO
                     ↓
                 CANCELADO
```

**CONFIGURANDO**: Panel 3 muestra formulario de configuración. Todos los
controles habilitados. Botón "Iniciar experimento" activo.

**EJECUTANDO**: Panel 3 muestra barra de progreso y estado de workers.
Único control disponible: "Cancelar". Heatmap se actualiza en tiempo real
con los runs completados.

**COMPLETADO**: todos los runs en estado terminal. Panel 4 muestra heatmap
completo. Panel 3 muestra resumen y botón "Exportar CSV". Botón "Nuevo
experimento" vuelve a CONFIGURANDO (conserva la configuración del par,
limpia los resultados).

**CANCELADO**: transición desde EJECUTANDO al presionar "Cancelar". Los
runs completados conservan sus resultados. Panel 3 muestra cuántos se
completaron y ofrece "Exportar CSV parcial" y "Nuevo experimento".

---

## E14. LÍMITES DE SEGURIDAD Y VALIDACIONES

| Parámetro | Límite | Acción si se excede |
|---|---|---|
| η máximo | 0.50 | Clamp silencioso al límite |
| dropout máximo | 0.80 | Clamp silencioso al límite |
| momentum máximo | 0.99 | Clamp silencioso al límite |
| Pasos por eje | 7 | UI no permite más |
| Total modelos | 49 (7×7) | UI no permite más |
| Total modelos > 25 | — | Advertencia con tiempo estimado |
| Épocas máximas | 1000 | UI no permite más |

Si un run produce NaN en cualquier peso durante el entrenamiento, el worker
lo detecta inmediatamente, marca el run como `nan`, y libera el worker para
el siguiente run de la cola. No se intenta recuperar.

---

## E15. PALETA DE COLOR DEL MÓDULO EXPERIMENTAL

### E15.1 Heatmap — paleta viridis (aproximación en JS)

```javascript
// Interpolación de 5 puntos de la paleta viridis
const VIRIDIS = [
  color(68,  1,   84),   // t=0.0  (peor valor)
  color(59,  82,  139),  // t=0.25
  color(33,  145, 140),  // t=0.5
  color(94,  201, 98),   // t=0.75
  color(253, 231, 37)    // t=1.0  (mejor valor)
];
```

Para métricas donde mayor es mejor (accuracy): t = valor / valor_max.
Para métricas donde menor es mejor (J_test, J_train, gap, épocas):
t = 1 − (valor − valor_min) / (valor_max − valor_min).

La escala se calcula sobre los runs completados y se recalcula al completar
cada nuevo run.

### E15.2 Curvas en Panel 2

Cuando Panel 2 muestra una fila/columna completa, las curvas se colorean
por el valor del hiperparámetro que varía en esa fila/columna:
- Hiperparámetro continuo: gradiente azul-violeta → naranja (igual que
  módulo η).
- Hiperparámetro discreto (activación, topología): colores fijos de
  `PALETAS.activacion` y `PALETAS.topologia`.

---

## E16. INTEGRACIÓN CON EL RESTO DE TALLERANA

### E16.1 Lo que NO cambia

- `motor_ml.js`: sin cambios. Los workers cargan este archivo directamente.
- `config.js`: sin variables nuevas de módulo (las variables del experimento
  viven en `modulos/experimento.js`).
- `comun/panel1.js`, `comun/panel2.js`: se agregan modos de renderizado
  opcionales activados por `moduloActivo === 'experimento'`, sin romper los
  modos existentes.
- La barra global y las pestañas: sin cambios.

### E16.2 Lo que sí cambia (mínimo)

- `index.html`: agregar `<script src="js/modulos/experimento.js"></script>`
  y una sexta pestaña "Experimento".
- `comun/estado.js`: agregar caso `'experimento'` en `initEnjambre()` y
  `dibujarControlesPanel3()`. Las funciones delegadas son
  `generarEnjambreExperimento()`, `crearSeccionOverlayExperimento()`,
  `dibujarControlesExperimento()`.
- `comun/layout.js`: el texto de arquitectura en la barra global para
  `moduloActivo === 'experimento'` muestra "Experimento factorial".

### E16.3 Estructura de `modulos/experimento.js`

El archivo sigue el mismo patrón de 4 secciones que los otros módulos:

```javascript
// ══════════════════════════════════════════════════════════════════════
// MÓDULO: EXPERIMENTO FACTORIAL
// Variable 1: configurable (η, dropout, momentum, activación, topología)
// Variable 2: configurable (ídem, distinto al primero)
// ══════════════════════════════════════════════════════════════════════

// ── 1. CONFIGURACIÓN Y ESTADO DEL EXPERIMENTO ────────────────────────
// Variables del módulo, ExperimentRun, pool de workers

// ── 2. GENERACIÓN Y EJECUCIÓN ────────────────────────────────────────
// generarGrilla(), lanzarExperimento(), manejarMensajeWorker()
// calcularMetricasGrilla(), cancelarExperimento()

// ── 3. CONTROLES PANEL 3 (DOM) ────────────────────────────────────────
// crearSeccionOverlayExperimento() — fases Configuración y Progreso
// actualizarUIEstadoExperimento()
// exportarCSV()

// ── 4. VISUALIZACIÓN (p5.js) ─────────────────────────────────────────
// dibujarControlesExperimento() — barra de progreso en Panel 3
// dibujarHeatmapPanel4() — o dibujarBarrasAgrupadasPanel4()
// dibujarFronterasExperimentoPanel1()
// dibujarCurvasExperimentoPanel2()
```

---

## E17. FUERA DEL ALCANCE DE ESTA VERSIÓN

Lo siguiente está documentado pero no se implementa:

- Repeticiones automáticas con cálculo de media y desviación estándar.
- Backend con GPU (servidor Python/CUDA para grillas mayores).
- Guardado automático incremental del CSV durante la ejecución.
- Reporte HTML descargable con capturas de heatmap y curvas.
- Más de dos hiperparámetros simultáneos.
- Búsqueda de hiperparámetros guiada (grid search con criterio de parada).

Estas extensiones corresponden al **Módulo Experimental Avanzado**, que es
una aplicación independiente con servidor y GPU opcional.

---

## Módulo experimental — Dropout

Variable: tasa de dropout p ∈ {0.0, 0.1, 0.2, 0.3, 0.4, 0.5} (6 modelos fijos).

Red recomendada: 2→4→4→1 (en lugar de la red base 2→4→1).
Justificación: con 2→4→1 (17 parámetros) y 160 puntos de entrenamiento la razón
datos/parámetros es ~10:1 y el sobreajuste raramente aparece, haciendo invisible el
efecto regularizador del dropout. Con 2→4→4→1 (37 parámetros) y problema Espiral con
ruido ≥ 15 la brecha J_train/J_test sin dropout es observable, y dropout la reduce
progresivamente hasta que p=0.5 degrada el aprendizaje — el fenómeno pedagógico completo.

Implementación: inverted dropout ya está en motor_ml.js.
Solo falta el UI del Panel 3 y generarEnjambreDropout().

Esquema de color (del §11.5 de la spec principal):
```
t = p / 0.5
color = lerpColor(naranja_oscuro, azul, t)
naranja_oscuro = hsl(20, 80%, 40%)
azul           = hsl(210, 70%, 45%)
```
