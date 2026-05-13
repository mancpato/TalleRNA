# PROGRESO: TalleRNA

**Última actualización**: 2026-05-12
**Etapa actual**: Módulo de Activación
**Estado general**: Etapas 0–3 completas. Módulos Eta e Init operativos.
Panel 2, Panel 4 (resumen + red neuronal) y barra global terminados.
Interfaz reorganizada: pestañas arriba, barra abajo, logo integrado.

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

### Panel 3 — Módulo Tasa de aprendizaje ✅
Overlay DOM completo: botón principal, épocas máx. (hasta 5000),
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

### Panel 4 — Resumen + Red neuronal ✅
- Conteo por estado (convergido/divergente/no convergido/entrenando),
  mejor J_test y modelo ganador.
- Visualización de red 2→4→1 en esquina inferior derecha: nodos
  coloreados por capa (rojo=entrada, azul=oculta, verde=salida),
  conexiones azul/rojo por signo del peso, grosor proporcional a |w|,
  etiquetas x₁, x₂, y. Se activa con modelo seleccionado.

### Barra global DOM interactiva ✅
Selector de problema (XOR por defecto), sliders ruido/train,
botón semilla (⚄). Problema seno deshabilitado.

### Interfaz general ✅
- **Pestañas arriba** (y=0), **barra de controles debajo** (y=TAB_HEIGHT).
- **Logo TalleRNA** en extremo derecho de la fila de pestañas,
  dibujado en p5.js ("Taller" gris + "RNA" violeta, bold 20px).
- **Texto de arquitectura** dinámico: `η∈[min,max]` en módulo Eta,
  `η=0.05` en los demás módulos.
- **Notificaciones de cambio de modo eliminadas**: solo quedan las de
  error o cambio de problema/parámetros.

---

## BUGS CORREGIDOS (post-Etapa 3)

| Bug | Descripción |
|-----|-------------|
| B7 | return false en mousePressed bloqueaba controles DOM |
| B8 | esTipoRegresion no existía como global en evaluarTest |
| B9 | Slider η_max se detenía en 0.490 (SL_STEP fijo) |
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
  js/{config, motor_ml, ui, interaccion, main}.js.

---

## PENDIENTE

| Componente | Prioridad | Notas |
|------------|-----------|-------|
| **Módulo Activación** | 🔴 Inmediato | Checkboxes ReLU/Sigmoid/Tanh/Lineal/LeakyReLU |
| Módulo Dropout | 🟡 | 6 modelos fijos p=0.0–0.5 |
| Módulo Topología | 🟡 | Checkboxes T0–T7 |
| Panel 4 completo | 🟠 | Tabla por modelo (η, J_train, J_test, acc, épocas) |
| Regresión seno | 🟠 | Visualización 1D en Panel 1. Selector deshabilitado. |

---

## PRÓXIMA SESIÓN: Módulo de Activación

Implementar el módulo de activación según §6.3 de la especificación:
checkboxes para ReLU / Sigmoid / Tanh / Lineal / LeakyReLU,
generación de un modelo por función activa seleccionada (η=0.05 fijo,
semilla fija), colores por función (ver PALETAS.activacion en config.js).

Dependencias listas: `crearModelo()` acepta `activacion` como parámetro;
`aplicarActivacion()` y `derivadaActivacion()` implementan las 5 funciones.
Solo falta el UI del Panel 3 (caso `'activacion'`) y `generarEnjambreActivacion()`.
