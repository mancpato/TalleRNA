# PROGRESO: TalleRNA

**Última actualización**: 2026-05-06
**Etapa actual**: Barra global interactiva
**Estado general**: Etapas 0–3 completas. Panel 2, Panel 4 básico y
módulo Tasa de aprendizaje operativos.

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
velocidad, sliders η log-scale, radio N modelos, checkbox test.
Círculos del enjambre con color propio + indicador de estado
(anillo verde/rojo/gris), etiquetas η, selección por click.

### Panel 4 — Resumen básico ✅
Conteo de modelos por estado (aprendizaje exitoso / divergentes /
no convergidos / entrenando), mejor J_test y modelo ganador.

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

---

## DECISIONES DE IMPLEMENTACIÓN (adicionales)

- **Convergencia**: contadorConv ≥ 30 épocas de |ΔJ| < 1e-4 AND
  mejora ≥ 15% sobre J_inicial. Evita falsos positivos con η pequeño.
- **Círculos Panel 3**: color propio siempre; estado como anillo
  superpuesto (verde/rojo/gris). Identidad visual consistente entre paneles.
- **Modelo seleccionado en Panel 1**: polilínea ordenada por ángulo
  (beginShape) en lugar de points, solo para el modelo activo.

---

## PENDIENTE

| Componente | Prioridad | Notas |
|------------|-----------|-------|
| **Barra global DOM** | 🔴 Inmediato | Selector problema, sliders ruido/train, botón ⚄ |
| Módulo Inicialización | 🟡 Siguiente | Panel 3 con checkboxes dist. + semillas |
| Módulo Activación | 🟡 | Checkboxes ReLU/Sigmoid/Tanh/Lineal/LeakyReLU |
| Módulo Dropout | 🟡 | 6 modelos fijos p=0.0–0.5 |
| Módulo Topología | 🟡 | Checkboxes T0–T7 |
| Panel 4 completo | 🟠 | Tabla por modelo (η, J_train, J_test, acc, épocas) |
| Regresión seno | 🟠 | Visualización 1D en Panel 1 |

---

## PRÓXIMA SESIÓN: Barra global DOM

Variables globales ya declaradas y usadas: `problema`, `nivelRuido`,
`trainRatio`, `semillaDatos`. La función `generarDatos()` ya acepta
los 4 problemas de clasificación + seno. Solo falta hacer la barra
interactiva con elementos DOM.
