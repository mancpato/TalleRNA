# PLAN DE TRABAJO: Módulo Experimental
## TalleRNA — Módulo 6: Experimento Factorial de Dos Hiperparámetros
**Versión 2.0 — 2026-05-27**
Referencia: TalleRNAspec_ModuloExperimental.md v1.1

---

## Decisión de arquitectura: sin Web Workers

El módulo experimental usa el loop `draw()` de p5.js para entrenar
los runs secuencialmente, exactamente igual que los cinco módulos
existentes. No se usa ningún Web Worker — esto garantiza que la
aplicación funcione desde `file://` sin servidor local.

Los runs se procesan uno a la vez. El heatmap se va coloreando celda
por celda conforme cada run termina. La barra de progreso muestra
`completados / total` y una línea indica el run en curso.

```javascript
// En draw(), cuando expEstado === 'EJECUTANDO':
function stepExperimento() {
  const run = expCola[expRunActual];
  if (!run) { expEstado = 'COMPLETADO'; return; }

  for (let s = 0; s < EXP_PASOS_POR_FRAME; s++) {
    entrenarEpoca(run.modelo, datosTrain);
    verificarTerminacion(run);        // actualiza run.estado si terminal
    if (run.estado !== 'entrenando') {
      expRunActual++;
      break;
    }
  }
}
```

`EXP_PASOS_POR_FRAME = 10` — fijo, sin control de velocidad en este
módulo (el experimento corre hasta completarse).

---

## Archivos nuevos

```
js/modulos/experimento.js     ← módulo completo (4 secciones)
```

## Cambios a archivos existentes

| Archivo | Cambio |
|---|---|
| `index.html` | `<script>` para experimento.js + sexta pestaña "Experimento" |
| `js/comun/estado.js` | Caso `'experimento'` en `initEnjambre()` y `dibujarControlesPanel3()` |
| `js/comun/layout.js` | Texto de arquitectura para `moduloActivo === 'experimento'` |

`motor_ml.js`, `config.js` y todos los demás archivos: **sin cambios**.

---

## Estructura de datos del módulo

Todo vive en `experimento.js`. Nada se agrega a `config.js`.

```javascript
// Estado de la máquina del módulo
let expEstado    = 'CONFIGURANDO'; // | 'EJECUTANDO' | 'COMPLETADO' | 'CANCELADO'

// Grilla de runs
let expGrilla    = [];    // Array 2D [i][j] de ExperimentRun
let expCola      = [];    // expGrilla.flat() al lanzar — orden FIFO
let expRunActual = 0;     // índice en expCola del run en curso
let expTotal     = 0;     // expCola.length

// Configuración activa
let expConfig = {
  par:          'eta_topologia',  // clave del par activo
  hiper1:       { nombre, tipo, valores },  // tipo: 'continuo'|'ordinal'|'categorico'
  hiper2:       { nombre, tipo, valores },
  maximoEpocas: 200,
  semillaPesos: 1,
  pregunta:     ''      // texto pedagógico para pares curados; '' en modo libre
};

// Selección en heatmap (Panel 4)
let expHover      = null;   // {i,j} | null
let expSel        = null;   // {i,j} | null  (click fijo en celda)
let expSelFila    = null;   // índice i | null
let expSelColumna = null;   // índice j | null

// Referencia de tiempo para estimación
let expTiempoRefMs = 500;   // ms por modelo; se actualiza al completar runs
```

### ExperimentRun

```javascript
{
  coordenada: { i, j },
  hiper1:     { nombre, valor },
  hiper2:     { nombre, valor },
  modeloConfig: {           // config completa ya resuelta con los dos hipers
    capas, activacion, eta, beta, dropout, distribucion, semillaPesos
  },
  modelo:   null,           // creado al inicio de ejecutarRun()
  estado:   'pendiente' | 'entrenando' | 'convergido' |
            'max_epocas' | 'divergente' | 'nan' | 'cancelado',
  metricas: { J_train, J_test, accuracy, epocas, gap, tiempo_ms },
  historial: [],
  t0:       null            // performance.now() al empezar este run
}
```

---

## Etapas

```
Etapa 0: Integración base (pestaña + estado + stubs)
   ↓
   [M1: pestaña funcional, sin crashes al cambiar de módulo]
   ↓
Etapa 1: Panel 3 — Configuración
   ↓
Etapa 2: Loop de entrenamiento + Panel 3 Progreso (pausa/reanudar)
   ↓
   [M2: experimento 2×2 completo de extremo a extremo]
   ↓
Etapa 3: Panel 4 — Heatmap y barras agrupadas
   ↓
   [M3: heatmap en tiempo real con grilla 3×4]
   ↓
Etapa 4: Panel 1, Panel 2 y exportación CSV
   ↓
   [M4: sistema completo verificado]
```

---

## Etapa 0 — Integración base

**Objetivo**: la pestaña "Experimento" existe y el sistema la trata
correctamente. Sin UI propia aún — solo que no crashee.

### 0.1 `index.html`

- Agregar al final de los `<script>`:
  `<script src="js/modulos/experimento.js"></script>`
  (antes de `main.js`)
- Agregar la sexta pestaña después de "Momentum":
  `<div class="tab" data-modulo="experimento">Experimento</div>`

### 0.2 `js/comun/estado.js`

Agregar caso `'experimento'` en:
- `initEnjambre()` → llama `iniciarModuloExperimento()`
- `dibujarControlesPanel3()` → llama `dibujarControlesExperimento()`

Ambas funciones son stubs en esta etapa (cuerpo vacío o
`console.log('experimento: stub')`).

### 0.3 `js/comun/layout.js`

En la función que genera el texto de arquitectura de la barra global:
```javascript
if (moduloActivo === 'experimento') return 'Experimento factorial';
```

### 0.4 Sección 1 de `experimento.js`

Declarar todas las variables de estado listadas en §Estructura de datos.
Implementar `iniciarModuloExperimento()` como stub.
Implementar `dibujarControlesExperimento()` como stub que dibuja
"[Módulo experimental — en construcción]" en Panel 3.

---

## Milestone 1 — Integración base verificada

- [ ] Pestaña "Experimento" visible y seleccionable
- [ ] Cambiar a esta pestaña no produce errores en consola
- [ ] Cambiar de vuelta a otro módulo tampoco produce errores
- [ ] Barra global muestra "Experimento factorial" al estar en esta pestaña
- [ ] Panel 3 muestra el texto de stub al seleccionar la pestaña

---

## Etapa 1 — Panel 3: Configuración

**Objetivo**: el formulario de configuración completo y funcional
antes de lanzar el primer experimento.

### 1.1 `crearOverlayConfigExperimento()`

Estructura DOM del overlay en fase CONFIGURANDO:

```
[ Iniciar experimento ]

Par de hiperparámetros:
[ η × topología ▾ ]    ← <select> con dos secciones

── Hiperparámetro 1 ─────────────────────────────
  [controles según tipo — ver §1.2]
  Valores: v₁ · v₂ · v₃ · ...   ← display en tiempo real

── Hiperparámetro 2 ─────────────────────────────
  [controles según tipo]
  Valores: v₁ · v₂ · ...

── Configuración general ────────────────────────
  Épocas máx.:   [ <select> 50/100/200/500/1000, default 200 ]
  Semilla pesos: [ <input type="number">, default 1 ]
  Total modelos: N    ← display de solo lectura

── Pregunta pedagógica ──────────────────────────
  [texto fijo para pares curados; oculto en modo libre]
```

### 1.2 Controles por tipo de hiperparámetro

**Continuo (η, β)**:
- `<input type="number">` para mín y máx
- `<select>` de pasos (2–7)
- Display de valores en tiempo real al modificar cualquier control
- η: escala logarítmica — `val[k] = min * (max/min)^(k/(n-1))`
- β: escala lineal — `val[k] = min + (max-min) * k/(n-1)`

**Ordinal (topología)**:
- Checkboxes T0–T7 con notación a la derecha (ej. "T3 — 2→4→1 ★")
- Mínimo 2 activos; protección al desmarcar
- Los valores de `expConfig.hiper.valores` son objetos
  `{id:'T3', capas:[2,4,1], etiqueta:'2→4→1'}` para cada checkbox activo

**Categórico (activación)**:
- Checkboxes de las 5 funciones
- Mínimo 2 activos; protección al desmarcar
- Aviso visible: "⚠ Panel 4 usará tabla de barras en lugar de mapa de calor"

### 1.3 Selector de par (`<select>` con `<optgroup>`)

```
── Pares recomendados ──────────────────────
  η × activación        (pregunta: ¿ReLU sigue ganando con η pequeña?)
  η × topología         (pregunta: ¿Más profundidad necesita η más baja?)
  η × momentum β        (pregunta: ¿Con β alto puedo usar η más pequeña?)
  topología × momentum β (pregunta: ¿La topología cambia cuánto importa β?)
── Modo libre ──────────────────────────────
  [ Hiperparámetro 1 ▾ ]  ×  [ Hiperparámetro 2 ▾ ]
```

Al elegir par curado: precargar valores por defecto de la spec §E3.1
y mostrar la pregunta pedagógica. Al elegir modo libre: mostrar
los dos selectores con validación de no-repetición.

Valores por defecto de pares curados:

| Par | H1 default | H2 default |
|---|---|---|
| η × activación | [0.01, 0.20], 4 pasos | ReLU + Sigmoid + Tanh + Lineal |
| η × topología | [0.01, 0.20], 4 pasos | T0+T1+T2+T3 (4 checkboxes) |
| η × momentum β | [0.01, 0.20], 4 pasos | [0.0, 0.9], 4 pasos |
| topología × momentum β | T0+T1+T2+T3 | [0.0, 0.9], 4 pasos |

### 1.4 Advertencia para N > 25

Si `expTotal > 25`: mostrar bajo el botón "Iniciar":
```
⚠ Este experimento entrenará N modelos (~X s estimados).
[ Confirmar e iniciar ]
```
`X = N × expTiempoRefMs / 1000` (redondear a entero).
Ocultar la advertencia al confirmar o al reducir N ≤ 25.

### 1.5 `generarGrilla()`

Genera `expGrilla[i][j]` para cada combinación de valores.
`i` indexa `expConfig.hiper1.valores`; `j` indexa `expConfig.hiper2.valores`.
Cada celda es un `ExperimentRun` con `estado: 'pendiente'` y
`modeloConfig` resuelto (los hipers variables aplicados sobre la
config fija de la red base global).

Config fija durante el experimento (se lee de globals al lanzar):
```javascript
const configFija = {
  capas:        esTipoClasif ? [2, 4, 1] : [1, 4, 1],
  activacion:   'relu',
  eta:          0.05,
  beta:         0.9,
  dropout:      0,
  distribucion: 'xavier'
};
```
Los valores de `hiper1` y `hiper2` sobreescriben los campos
correspondientes de `configFija` en cada celda.

Para topología: `hiper.valor.capas` reemplaza `configFija.capas`.
Para activación: `hiper.valor` (string) reemplaza `configFija.activacion`.
Para η: `hiper.valor` (number) reemplaza `configFija.eta`.
Para β: `hiper.valor` (number) reemplaza `configFija.beta`.

---

## Etapa 2 — Loop de entrenamiento y Panel 3 Progreso

**Objetivo**: el experimento corre de extremo a extremo.
Los runs se entrenan secuencialmente en `draw()`.

### 2.1 `lanzarExperimento()`

```javascript
function lanzarExperimento() {
  expCola      = expGrilla.flat();
  expTotal     = expCola.length;
  expRunActual = 0;
  expEstado    = 'EJECUTANDO';

  // Crear modelo para el primer run
  iniciarRun(expCola[0]);
  mostrarFaseProgreso();  // cambia el overlay DOM a fase Progreso
}
```

### 2.2 `iniciarRun(run)`

```javascript
function iniciarRun(run) {
  const c = run.modeloConfig;
  run.modelo  = crearModelo(c.capas, c.activacion, c.eta, c.dropout,
                            expConfig.semillaPesos, c.distribucion, c.beta);
  run.estado  = 'entrenando';
  run.t0      = performance.now();
}
```

### 2.3 `stepExperimento()` — llamada desde `draw()` cuando `expEstado === 'EJECUTANDO'`

```javascript
function stepExperimento() {
  if (expRunActual >= expTotal) {
    expEstado = 'COMPLETADO';
    mostrarFaseCompletado();
    return;
  }

  const run = expCola[expRunActual];

  for (let s = 0; s < EXP_PASOS_POR_FRAME; s++) {
    const J_ant = run.historial.length > 0
      ? run.historial[run.historial.length - 1].J_train : null;

    entrenarEpoca(run.modelo, datosTrain);

    const h = run.historial[run.historial.length - 1];

    // NaN en pesos
    if (hayNaN(run.modelo)) {
      finalizarRun(run, 'nan'); break;
    }

    // Divergencia
    const div = verificarDivergencia(run.modelo, J_ant);
    if (div.diverge) {
      finalizarRun(run, 'divergente'); break;
    }

    // Convergencia
    if (verificarConvergencia(run.modelo)) {
      finalizarRun(run, 'convergido'); break;
    }

    // Máximo de épocas
    if (run.historial.length >= expConfig.maximoEpocas) {
      finalizarRun(run, 'max_epocas'); break;
    }
  }
}
```

### 2.4 `finalizarRun(run, estado)`

```javascript
function finalizarRun(run, estado) {
  run.estado = estado;
  const h    = run.historial;
  const ult  = h.length > 0 ? h[h.length - 1] : {};

  run.metricas = {
    J_train:   ult.J_train   ?? null,
    J_test:    ult.J_test    ?? null,
    accuracy:  ult.accuracy_test ?? null,
    epocas:    h.length,
    gap:       (ult.J_test != null && ult.J_train != null)
               ? ult.J_test - ult.J_train : null,
    tiempo_ms: performance.now() - run.t0
  };

  // Actualizar referencia de tiempo
  expTiempoRefMs = run.metricas.tiempo_ms;

  expRunActual++;

  // Preparar siguiente run
  if (expRunActual < expTotal) {
    iniciarRun(expCola[expRunActual]);
  }
}
```

### 2.5 `hayNaN(modelo)` — helper

Recorre `modelo.pesos` y `modelo.sesgos`; devuelve `true` si
cualquier valor no es finito o supera 1e6 (complementa
`verificarDivergencia` para el caso NaN explícito).

### 2.6 Cancelación

Botón "Cancelar" (único control durante EJECUTANDO):
```javascript
function cancelarExperimento() {
  const run = expCola[expRunActual];
  if (run && run.estado === 'entrenando')
    finalizarRun(run, 'cancelado');

  // Marcar todos los pendientes como cancelados
  for (let k = expRunActual; k < expTotal; k++)
    expCola[k].estado = 'cancelado';

  expEstado = 'CANCELADO';
  mostrarFaseCancelado();
}
```

### 2.7 Pausa y reanudación

```javascript
function togglePausa() {
  if (expEstado === 'EJECUTANDO') expEstado = 'PAUSADO';
  else if (expEstado === 'PAUSADO') expEstado = 'EJECUTANDO';
}
```

En draw(), la condición para llamar stepExperimento() es
expEstado === 'EJECUTANDO' (sin cambio). Durante PAUSADO, draw()
sigue llamando dibujarHeatmapPanel4() — el heatmap se muestra
congelado en el estado actual.

El overlay DOM de progreso muestra:
- [ Pausar ] cuando expEstado === 'EJECUTANDO' → llama togglePausa()
- [ Reanudar ] cuando expEstado === 'PAUSADO' → llama togglePausa()
- [ Cancelar ] visible en ambos estados

actualizarUIProgreso() actualiza la etiqueta del botón en cada
frame según expEstado.

### 2.8 Overlay DOM — Fase Progreso

Al llamar `mostrarFaseProgreso()`: ocultar overlay de configuración,
mostrar overlay de progreso:

```
[ Cancelar ]

Progreso:
████████████░░░░░░░░░░  12 / 20 modelos
[div con width dinámico en %]

En curso:
  η=0.05 · T3  →  época 143 / 200

Completados:
  ✓ convergidos:   8
  ✗ divergentes:   1
  — max épocas:    3
  ⏳ pendientes:   8
```

`actualizarUIProgreso()` se llama desde `draw()` en cada frame
cuando `expEstado === 'EJECUTANDO'`.

---

## Milestone 2 — Ejecución extremo a extremo

Verificar con par η × topología, problema XOR, grilla 2×2 (4 runs):

- [ ] Botón "Iniciar experimento" lanza el experimento sin errores
- [ ] Panel 3 cambia a fase Progreso al iniciar
- [ ] Progreso (N/total) avanza correctamente en cada frame
- [ ] "En curso" muestra el run actual con su época
- [ ] Los 4 runs completan con estados correctos en consola:
      `expGrilla.flat().map(r => r.estado)` → array de 4 strings
- [ ] `expEstado === 'COMPLETADO'` al terminar todos
- [ ] Cancelar en mitad del experimento: runs pendientes → 'cancelado',
      runs completados conservan sus métricas
- [ ] Cambiar de pestaña durante EJECUTANDO: cancela y llama `resetear()`
- [ ] Misma semillaPesos + mismos hipers → mismo J_test en dos ejecuciones
- [ ] "Pausar" congela el entrenamiento; "Reanudar" lo continúa
      desde donde se detuvo sin perder épocas
- [ ] La etiqueta del botón cambia correctamente entre ambos estados
- [ ] "Cancelar" funciona desde EJECUTANDO y desde PAUSADO

---

## Etapa 3 — Panel 4: Heatmap y barras agrupadas

**Objetivo**: la visualización principal de resultados, actualizada
en tiempo real mientras los runs se completan.

### 3.1 `dibujarHeatmapPanel4()`

Activo cuando ninguno de los dos ejes es activación.

**Layout dentro de Panel 4**:

```
[selector métrica: J_test ▾]   ← <select> DOM superpuesto

      T0    T1    T2    T3     ← etiquetas eje X (hiper2), clickables
η=0.01 [ ]   [ ]   [ ]   [ ]
η=0.05 [ ]   [ ]   [ ]   [ ]  ← etiquetas eje Y (hiper1), clickables
η=0.10 [ ]   [ ]   [ ]   [ ]
η=0.20 [ ]   [ ]   [ ]   [ ]

[tooltip flotante al hacer hover]
```

Margen interno: 40px izquierda (etiquetas Y), 30px arriba (etiquetas X),
20px derecha y abajo.

**Color de celda — paleta viridis** (§E15.1 de la spec):
```javascript
const VIRIDIS = [
  [68,  1,   84],   // t=0.0
  [59,  82,  139],  // t=0.25
  [33,  145, 140],  // t=0.5
  [94,  201, 98],   // t=0.75
  [253, 231, 37]    // t=1.0
];
```
Interpolar entre los 5 puntos según `t`. La escala se calcula
solo sobre runs con métricas no nulas (excluye pendiente/cancelado/nan
sin valor).

Para métrica "menor es mejor" (J_test, J_train, gap, epocas):
`t = 1 - (val - valMin) / (valMax - valMin)`
Para "mayor es mejor" (accuracy): `t = (val - valMin) / (valMax - valMin)`

Recalcular escala en cada frame mientras EJECUTANDO; solo al completar
nuevos runs cambia (no recalcular si no hay runs nuevos — comparar
`expCompletadosUltimoPaleta` con `expRunActual`).

**Estados especiales**:
- `pendiente`: `#e8e8e8`, sin contenido
- `entrenando`: `#c8c8c8` + barra de progreso interna
  (rect horizontal, altura 4px en borde inferior de la celda,
  width = `(épocasActuales / maximoEpocas) × ancho_celda`)
- `divergente`: `#808080` + rayas diagonales
  (líneas cada 5px a 45°, color `#909090`,
  clip al rect de la celda con `drawingContext`)
- `nan`: `#202020` + texto "∅" centrado en blanco, 14px
- `max_epocas`: color viridis normal + borde punteado 1.5px `#555`
- `cancelado`: `#b0b0b0`

**Resaltado de selección**:
- Celda en hover: borde exterior 2px color acento `#2255aa`
- Celda seleccionada (click): borde exterior 2.5px `#2255aa` + fondo ligeramente más claro
- Fila seleccionada: borde exterior 1.5px `#2255aa` en todas las celdas de la fila
- Columna seleccionada: ídem para la columna

**Tooltip** (rect p5.js flotante, z-order encima de todo):
```
η = 0.05 · T3
J_test:   0.142
J_train:  0.118
Gap:      0.024
Accuracy: 84.1%
Épocas:   67
Estado:   convergido
Tiempo:   312 ms
```
Aparece al hover sobre celda con datos. Posición: a la derecha de la celda
si cabe, a la izquierda si está en el borde derecho del panel.

**Selector de métrica**: `<select>` DOM superpuesto en Panel 4,
opciones: `J_test · J_train · Accuracy · Épocas · Gap`.
Accuracy deshabilitada (`disabled`) en regresión.

**Interacción**:
- Hover sobre celda → `expHover = {i,j}`
- Click en celda → `expSel = {i,j}`, limpiar `expSelFila/Columna`
- Click en etiqueta eje Y (fila) → `expSelFila = i`, limpiar resto
- Click en etiqueta eje X (columna) → `expSelColumna = j`, limpiar resto
- Click en área vacía del panel → limpiar toda selección
- Hover y selección actualizados en `mouseMoved()` y `mousePressed()`,
  consultados en `draw()` — nunca calcular dentro de `draw()`

### 3.2 `dibujarBarrasAgrupadasPanel4()`

Activo cuando uno de los dos ejes es activación.

```
      ReLU  Sigmoid  Tanh  Lineal  ← funciones (eje X, sin orden implícito)
      ████   ████    ████   ████   η=0.01
      ████   ████    ████   ████   η=0.05
      ████   ████    ████   ████   η=0.10
```

- Grupos de barras separados por espacio entre grupos
- Altura de barra proporcional a la métrica seleccionada
- Colores de barra: `PALETAS.activacion` del módulo de activación
- Runs divergentes/nan: barra en `#E24B4A`, altura mínima visible
- Eje Y: rango `[0, máximo_métrica × 1.05]`, fijado al inicio

### 3.3 Conexión con `draw()`

En `draw()`, cuando `moduloActivo === 'experimento'`:
- Si Panel 4 es heatmap: llamar `dibujarHeatmapPanel4()`
- Si Panel 4 es barras: llamar `dibujarBarrasAgrupadasPanel4()`
- El selector se determina en `generarGrilla()` y no cambia durante
  la ejecución: `expUsaBarras = tipoH1 === 'categorico' || tipoH2 === 'categorico'`

---

## Milestone 3 — Heatmap en tiempo real

Verificar con par η × topología, espiral, grilla 3×4 (12 runs):

- [ ] Heatmap aparece al iniciar con todas las celdas en estado `pendiente` (gris claro)
- [ ] Celda en `entrenando` muestra barra de progreso interna que crece
- [ ] Al completar cada run, la celda toma el color viridis correspondiente
- [ ] Paleta se recalcula correctamente: el run con mejor J_test es el más amarillo
- [ ] Celda `divergente`: rayas diagonales visibles
- [ ] Celda `nan`: fondo negro con "∅"
- [ ] Celda `max_epocas`: color viridis con borde punteado
- [ ] Tooltip muestra todas las métricas correctas al hacer hover
- [ ] Selector de métrica cambia colores inmediatamente sin relanzar
- [ ] Accuracy deshabilitada en regresión
- [ ] Click en fila: borde en todas las celdas de esa fila
- [ ] Click en columna: ídem
- [ ] Para η × activación: aparecen barras agrupadas en lugar de heatmap
- [ ] Barras de runs divergentes en rojo separadas

---

## Etapa 4 — Panel 1, Panel 2 y CSV

**Objetivo**: integración cruzada con los paneles existentes
y exportación de resultados.

### 4.1 Panel 1 en modo experimento

`dibujarFronterasExperimentoPanel1()`, llamada desde `panel1.js`
cuando `moduloActivo === 'experimento'`:

- **Modelo activo** (hover o selección de celda individual):
  frontera en el color del run, 100%, 2.5px.
  El "color del run" se deriva de su posición en la grilla:
  continuo → gradiente de η o β; topología → `PALETAS.topologia`;
  activación → `PALETAS.activacion`.
- **Vecinos inmediatos** (hasta 4: arriba, abajo, izquierda, derecha):
  frontera gris claro `#cccccc`, 30%, 1px.
  Para celdas de borde: mostrar solo los vecinos que existan.
- **Fila o columna seleccionada**: fronteras de todas las celdas
  de esa fila/columna, coloreadas con 50% de opacidad.
- **Sin selección**: frontera del run con menor J_test entre completados.
- **Mapa de fondo**: del modelo activo; si no hay selección, del run
  con menor J_test.

### 4.2 Panel 2 en modo experimento

`dibujarCurvasExperimentoPanel2()`, llamada desde `panel2.js`:

- **Sin selección**: panel vacío (texto centrado: "Selecciona una celda")
- **Hover/click en celda**: curva de ese run, color del modelo, 2px.
  Toggle "Mostrar test" activo por defecto en este módulo.
- **Fila seleccionada**: curvas de toda la fila, coloreadas por el
  valor del hiper2 (gradiente azul-violeta→naranja para continuos;
  colores de paleta para discretos). Leyenda visible.
- **Columna seleccionada**: análogo, coloreadas por valor del hiper1.
- Toggles Lin/Log y J/Accuracy funcionan igual que en módulos simples.

### 4.3 `exportarCSV()`

Disponible en fases COMPLETADO y CANCELADO (exporta runs completados).

**Cabecera**:
```
# TalleRNA — Experimento Factorial
# Versión: 1.1
# Fecha: YYYY-MM-DD HH:MM:SS
# Problema: espiral   Ruido: 15%   Train: 80%   Semilla datos: 4721
# Semilla pesos: 1   (misma para todos los modelos)
# Hiper 1: eta        escala: logarítmica   rango: [0.010, 0.200]   pasos: 4
# Hiper 2: topologia  escala: ordinal       valores: T0·T1·T2·T3
# Total modelos: 16   Épocas máx.: 200
# Tiempo total: 12840 ms
#
```

**Columnas**: `hiper1,hiper2,J_train,J_test,accuracy,epocas,gap,estado,tiempo_ms`
- `accuracy` vacía en regresión
- `gap` vacío si cualquier pérdida es nula
- Runs con estado `pendiente` o `cancelado` sin métricas: campos vacíos

**Nombre**: `tallerna_{hiper1}-{hiper2}_{YYYYMMDD}-{HHMM}.csv`
Ejemplo: `tallerna_eta-topologia_20260527-1430.csv`

### 4.4 "Nuevo experimento"

Botón en fases COMPLETADO y CANCELADO:
- Conserva `expConfig` (misma configuración)
- Limpia `expGrilla`, `expCola`, `expRunActual`, `expTotal`
- `expEstado = 'CONFIGURANDO'`
- Muestra overlay de configuración con los mismos valores previos

---

## Milestone 4 — Sistema completo verificado

Verificar con par η × topología, espiral, grilla 4×4 (16 runs):

- [ ] Panel 1: frontera del run en hover visible; vecinos en gris
- [ ] Panel 1: celda en esquina muestra solo 2 vecinos sin error
- [ ] Panel 1: fila seleccionada muestra todas sus fronteras en 50%
- [ ] Panel 2: sin selección → texto "Selecciona una celda"
- [ ] Panel 2: hover en celda → curva de ese run
- [ ] Panel 2: click en fila → múltiples curvas con gradiente correcto
- [ ] Toggle "Mostrar test" activo por defecto en este módulo
- [ ] CSV: formato correcto, cabecera completa, campos vacíos donde corresponde
- [ ] CSV parcial exportable tras cancelar (solo runs completados)
- [ ] Nombre del archivo sigue el patrón correcto
- [ ] "Nuevo experimento" conserva config y limpia resultados
- [ ] Para η × activación: barras agrupadas; Panel 2 usa `PALETAS.activacion`
- [ ] Regresión: accuracy deshabilitada; columna ausente en CSV
- [ ] Cambiar de pestaña durante EJECUTANDO: cancela limpiamente
- [ ] `expTiempoRefMs` se actualiza tras cada run y mejora la estimación

---

## Notas para sesiones de Claude Code

1. **Empezar por Etapa 0** y verificar M1 antes de escribir una línea
   de configuración. Un crash al cambiar de pestaña bloquea todo lo demás.

2. **Etapa 1 antes de Etapa 2**: el formulario debe existir para
   poder llamar a `generarGrilla()` con datos reales.
   No hardcodear configuraciones de prueba.

3. **Heatmap estático antes que animado** (Etapa 3): implementar
   primero el dibujo de celdas con valores finales (color viridis),
   luego los estados especiales (pendiente, entrenando, rayas).

4. **`expHover` en `mouseMoved()`**: actualizar en cada movimiento
   del mouse, consultar en `draw()`. Nunca calcular hover dentro de `draw()`.
   Seguir el mismo patrón que `modeloHover` en los módulos existentes.

5. **Panel 1 y Panel 2** reutilizan lógica existente — implementarlos
   al final evita bloquear la verificación del heatmap.

6. **CSV puede ir antes de Panel 1/2** si se quiere verificar el
   flujo completo (configurar → ejecutar → exportar → análisis en R/Python)
   antes de pulir la visualización cruzada.
