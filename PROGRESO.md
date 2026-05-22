# PROGRESO: TalleRNA

**Última actualización**: 2026-05-22
**Etapa actual**: Polish / fit and finish
**Estado general**: Etapas 0–3 completas. Módulos Eta, Init, Activación, Momentum y
Topología operativos. Panel 2 con eje X dinámico. Panel 4 con visualización de red
adaptable a cualquier arquitectura. Interfaz reorganizada: pestañas arriba, barra abajo,
logo integrado. La interfaz fue sometida a una ronda de refinamiento de usabilidad
y coherencia visual.

---

## ETAPAS COMPLETADAS

### Etapa 0 — Infraestructura base ✅
Canvas, máquina de estados, pestañas, notificaciones,
estructura de datos global. (Milestone 1)

### Etapa 1 — Motor matemático ✅
generarDatos, crearModelo, forward, calcularLoss, backprop,
actualizarPesos, entrenarEpoca, evaluarTest,
verificarConvergencia, verificarDivergencia. (Milestone 2)
Bugs #1–#6 corregidos.

### Etapa 2 — Panel 1 y visualización ✅
Mapa de predicción, fronteras de decisión, datos train/test,
interacción hover/click. (Milestone 3)

### Etapa 3 — Animación del enjambre ✅
generarEnjambreEta, stepModelo, pasosPorFrame,
loop RUNNING en draw(), actualización de fronteras frame a frame.

### Panel 2 — Historial de pérdida ✅
Curvas J_train y J_test por modelo en tiempo real, escala
dinámica, toggle Lin/Log, toggle J/Acc, hover y click
cruzados con Panel 1, línea J* de referencia.
- **Eje X dinámico**: crece con el entrenamiento. `_xMaxPanel2()` compartida
  entre renderizado y detección de hover — mismo valor en cada frame.
- **Marcas adaptativas**: `tickNice()` produce 4–8 marcas bien espaciadas
  a cualquier escala (10 épocas → intervalo 2; 5000 → 1000; 10000 → 2000).

### Panel 3 — Módulo Tasa de aprendizaje ✅
Overlay DOM completo: botón principal, épocas máx. (select 500–20000, default 1000),
velocidad, sliders η log-scale, radio N modelos.
Círculos con color propio + anillo de estado (verde/rojo/gris).
"η=" aparece una sola vez a la izquierda de los valores numéricos.

### Panel 3 — Módulo Inicialización de pesos ✅
- `generarEnjambreInit()`: hasta 12 modelos (4 dist. × 3 semillas).
- Colores fijos por distribución (azul/verde/naranja/violeta),
  opacidad decreciente por semilla (255/166/102).
- Overlay DOM: checkboxes Uniforme/Normal/Xavier/He, radio semillas
  1/2/3, contador "Total de modelos", protección mínimo 1 activa.
- Layout Panel 3 agrupado por distribución: nombre en negrita encima,
  círculos de semillas debajo con `s1/s2/s3`, métrica accuracy encima.
- Selección grupal: click en nombre de distribución resalta todas sus
  fronteras en Panel 1 y curvas en Panel 2; click fuera desactiva.
- `distribucionSeleccionada` como variable global en config.js.
- `_modeloDestacado()` / `_modeloAtenuado()` unifican la lógica de
  resaltado para selección individual y grupal en ambos paneles.

### Panel 3 — Módulo Función de activación ✅
- `generarEnjambreActivacion()`: hasta 7 modelos (ReLU, Sigmoid, Tanh, Lineal,
  Leaky ReLU, ELU, Escalón). Red 2→4→1 fija, η=0.05, Xavier semilla=1.
- Checkboxes en 3 columnas ordenadas por familia; protección mínimo 1 activa.
- Colores fijos por función en `PALETAS.activacion`.
- Nota en Escalón: "∇=0" (gradiente nulo, no aprende con backprop).

### Panel 3 — Módulo Momentum ✅
- `generarEnjambreMomentum()`: 6 modelos β ∈ {0.0, 0.2, 0.4, 0.6, 0.8, 0.9}.
- Colores gradiente azul_claro → naranja_oscuro por β creciente.
- Overlay DOM: texto informativo, sin controles interactivos propios.
- Controles comunes (épocas máx., velocidad, +100) integrados.
- Círculos con accuracy encima y etiqueta β debajo.
- Hover y selección cruzada con Panel 1 y Panel 2 operativos.
- Fenómeno visible: β=0.0 converge notablemente más lento que β=0.9;
  accuracies finales similares — momentum afecta velocidad, no el mínimo.

### Panel 3 — Módulo Topología ✅
- `generarEnjambreTopologia()`: 6 modelos T0–T5, arquitecturas fijas:
  T0=[2,1], T1=[2,2,1], T2=[2,4,1], T3=[2,6,1], T4=[2,4,4,1], T5=[2,6,4,1].
- η=0.05, Xavier semilla=1, ReLU fija (mostrada explícitamente en overlay).
- `PALETAS.topologia` como objeto keyed por ID: T0=#888780 … T5=#1D9E75.
- Checkboxes en 2 columnas (T0–T2 / T3–T5); protección mínimo 1 activa.
- Cambios bloqueados durante RUNNING/PAUSED con notificación.
- `modeloReferencia` = índice de T2 si activa, si no el primero.
- Etiqueta corta ("T0"–"T5") bajo cada círculo en Panel 3.

### Panel 4 — Resumen + Red neuronal ✅
- Conteo por estado (convergido/divergente/no convergido/entrenando),
  mejor J_test y modelo ganador.
- Visualización de red adaptable a cualquier arquitectura del modelo
  seleccionado: `LAYOUT_RED` lookup table para las 6 topologías + fallback
  dinámico. Etiquetas "Oc.1", "Oc.2" para capas ocultas múltiples.
- `wMax` recalculado solo cuando cambia `modeloSeleccionado` (no cada frame).
- Nodos bias como triángulos amarillos entre capas adyacentes.

### Barra global DOM interactiva ✅
Selector de problema (XOR por defecto), sliders ruido/train,
botón semilla (⚄). Problema seno deshabilitado.

### Interfaz general ✅
- **Pestañas arriba** (y=0), **barra de controles debajo** (y=TAB_HEIGHT).
- **Logo TalleRNA** en extremo derecho de la fila de pestañas.
- **Texto de arquitectura** dinámico: `η∈[min,max]` en módulo Eta,
  `η=0.05` en los demás módulos.
- **Botón "Reiniciar" en PAUSED**: aparece junto a "Continuar" solo en ese
  estado, llama a `resetear()`. Contenedor flex con gap:8px.
- **Select de épocas** en todos los módulos: opciones 500/1000/2000/5000/
  10000/20000, default 1000. Reemplaza el `<input type="number">` anterior.

### Polish / Fit and finish — 2026-05-22 ✅

Ronda de refinamiento de usabilidad y coherencia visual.
Ningún cambio afecta la lógica de entrenamiento.

**Orden y contenido de módulos**
- Pestañas reordenadas por secuencia didáctica:
  Topología → Activación → Inicialización →
  Tasa de aprendizaje → Momentum.
- Módulo activo al cargar: Topología.
- Problema activo al cargar: Lineal.

**Problemas**
- Nuevo problema: Lineal (x₂ > x₁), primer ítem del selector.
  T0 lo resuelve con accuracy ~100%; caso base pedagógico.
- Orden del selector por dificultad creciente:
  Lineal → XOR → Círculos → Media luna → Espiral →
  Regresión seno.
- Media luna corregida: solapamiento vertical ±0.5,
  las dos lunas entrelazadas. T0 ya no la resuelve.

**Módulo Topología**
- 8 arquitecturas: T0=[2,1], T1=[2,2,1], T2=[2,3,1],
  T3=[2,4,1], T4=[2,2,3,1], T5=[2,3,2,1],
  T6=[2,4,4,1], T7=[2,6,4,1].
- Eliminada 2→6→1; agregadas 2→3→1, 2→2→3→1, 2→3→2→1.
- Layout Panel 3: 4 columnas × 2 filas.
- Activas por defecto: T0, T3, T6.
- T3 marcada como red base (★).

**Módulo Activación**
- Activas por defecto: Lineal, ReLU, Sigmoid, Tanh.
- Inactivas por defecto: Leaky ReLU, ELU, Escalón.

**Módulo Inicialización**
- Eliminado el display "Total de modelos: N" (superfluo).

**Módulo Tasa de aprendizaje**
- Escala logarítmica con factor multiplicativo ×2.
- Eliminado selector de N modelos.
- N calculado automáticamente; mostrado como display
  de solo lectura.
- Rango por defecto: η_min=0.005, η_max=0.500 → 8 modelos.
- Validación cruzada: η_min no puede superar η_max.

**Módulo Momentum**
- β_max=0.9 fijo e invariable (valor estándar).
- β_min seleccionable con radio buttons: {0.0, 0.2, 0.4, 0.6, 0.8}.
- Paso interno 0.2; N automático; β=0.9 siempre incluido.
- Default: β_min=0.0 → 6 modelos {0.0, 0.2, 0.4, 0.6, 0.8, 0.9}.

**Sincronización de controles**
- El select de épocas máximas se sincroniza con maximoEpocas
  al cambiar de módulo (corregido bug B22).

**Panel 1 — legibilidad**
- Ticks de ejes: 12px, color #444444.
- Etiquetas x₁, x₂: 12px, color #333333.
- Datos de test: cruz + en color de clase (antes: círculo
  con anillo blanco, invisible sobre fondo blanco).
- Leyenda: símbolo de test en gris claro #dddddd sobre
  fondo oscuro.

---

## BUGS CORREGIDOS (post-Etapa 3)

| Bug | Descripción |
|-----|-------------|
| B7  | return false en mousePressed bloqueaba controles DOM |
| B8  | esTipoRegresion no existía como global en evaluarTest |
| B9  | Slider η_max se detenía en 0.490 (SL_STEP fijo) |
| B10 | dibujarHistorialPanel2 no llamada desde draw() |
| B11 | acc_test vs accuracy_test — campo incorrecto en modo Acc |
| B12 | modeloReferencia nunca se asignaba → sin línea J* |
| B13 | totalEpocas fijo en 500 (Math.min hardcodeado) |
| B14 | Convergencia prematura: solo cond1, contadorConv=5 |
| B15 | Sin condición mínima de mejora — modelos sin aprendizaje marcaban "convergido" |
| B16 | Clipping faltante en curvas Panel 2 → líneas fuera del área |
| B17 | Fronteras invisibles post-entrenamiento (alfa=90, grosor=1) |
| B18 | Normalización: min-max solo sobre train → puntos se movían al cambiar trainRatio |
| B19 | Convergencia prematura sin generalización — ahora J_test < 50% del baseline |
| B20 | `totalEpocas` indefinida en `_epToX` tras refactor de eje X dinámico |
| B21 | Hover en Panel 2 usaba `maximoEpocas` mientras renderizado usaba `xMax` dinámico |

---

## DECISIONES DE IMPLEMENTACIÓN (adicionales)

- **Convergencia**: contadorConv ≥ 30 épocas de |ΔJ| < 1e-4 AND
  mejora ≥ 15% sobre J_inicial AND J_test < 50% del baseline.
- **Círculos Panel 3 (Eta)**: SEP=48, DIAM=10. Accuracy encima,
  η numérico debajo con prefijo "η=" una sola vez a la izquierda.
- **Círculos Panel 3 (Init)**: agrupados por distribución. DIAM=14,
  SEP_C=34, SEP_G=48. Nombre en bold encima; `s1/s2/s3` debajo.
  Hit areas guardadas en `_gruposHitAreas[]` para detección de click.
- **Selección grupal vs individual**: `distribucionSeleccionada` toma
  precedencia sobre `modeloSeleccionado`; click en círculo limpia
  `distribucionSeleccionada`; resetear/reiniciar limpian ambas.
- **Modelo seleccionado en Panel 1**: polilínea ordenada por ángulo
  (beginShape) solo para selección individual; puntos para el resto.
- **Normalización de datos**: min-max sobre train+test completo antes
  del split, aplicado a ambos conjuntos.
- **Escala de ruido ajustada por problema**: espiral usa σ/4.
- **Checkbox "Mostrar curvas de test"**: botón toggle [Test] en Panel 2.
- **Info en Panel 1**: n= y train= visibles en esquina superior derecha.
- **Problema inicial**: XOR (más pedagógico que espiral).
- **Estructura de archivos**: index.html + css/style.css +
  js/config.js + js/motor_ml.js + js/main.js +
  js/comun/{estado, layout, eventos, panel1, panel2, panel4}.js +
  js/modulos/{eta, init, activacion, momentum, dropout, topologia}.js
- **`_xMaxPanel2()`**: función compartida entre renderizado y eventos
  para garantizar que el mapeo época→píxel sea idéntico en cada frame.
- **LAYOUT_RED**: lookup table con posiciones normalizadas para las 6
  arquitecturas de topología; fallback dinámico para otras arquitecturas.

---

## PENDIENTE

| Componente | Prioridad | Notas |
|------------|-----------|-------|
| Módulo Dropout | 🟡 | Requiere red 2→4→4→1 |
| Panel 4 completo | 🟠 | Tabla por modelo |
| Regresión seno | 🟠 | Visualización 1D en Panel 1 |
| Símbolo ✕ modelos divergentes | 🟡 | Cruz sobre posición en Panel 1 |
| Tiempo/costo por arquitectura | 🔵 | Diferido a módulo experimental |
