# PROGRESO: TalleRNA

**Última actualización**: 2026-05-08
**Etapa actual**: Módulo de Inicialización de pesos
**Estado general**: Etapas 0–3 completas. Panel 2, Panel 4 básico y
módulo Tasa de aprendizaje operativos. Barra global DOM terminada.

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

### Barra global DOM interactiva ✅
Selector de problema (XOR por defecto), sliders ruido/train con
evento change (regenera al soltar), botón semilla (⚄). Problema
seno deshabilitado en el selector con notificación. Logo TalleRNA
eliminado (pendiente de solución simple).

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
  Evita falsos positivos con η pequeño y exige generalización.
- **Círculos Panel 3**: SEP dinámico, DIAM=14. Métricas de accuracy
  encima del círculo, η debajo. Color propio siempre; estado como anillo
  superpuesto (verde/rojo/gris). Identidad visual consistente entre paneles.
- **Modelo seleccionado en Panel 1**: polilínea ordenada por ángulo
  (beginShape) en lugar de points, solo para el modelo activo.
- **Normalización de datos**: min-max calculado sobre train+test completo
  antes del split, aplicado a ambos conjuntos. Elimina desplazamiento
  visual al cambiar trainRatio.
- **Escala de ruido ajustada por problema**: espiral usa σ/4 para mantener
  separabilidad visual con el mismo slider global.
- **Checkbox "Mostrar curvas de test"**: movido al Panel 2 como botón
  toggle [Test] junto a [Lin] y [J].
- **Info en Panel 1**: n= y train= visibles en esquina superior derecha.
- **Problema inicial**: cambiado a XOR (más pedagógico que espiral como punto de partida).
- **initDatos() e initHistorial()**: vaciadas, sin console.log de depuración.
- **Estructura de archivos**: proyecto separado en index.html + css/style.css + js/{config, motor_ml, 
  ui, interaccion, main}.js para facilitar edición y prompts quirúrgicos.

---

## PENDIENTE

| Componente | Prioridad | Notas |
|------------|-----------|-------|
| **Módulo Inicialización** | 🔴 Inmediato | Panel 3 con checkboxes dist. + semillas. Etapa actual. |
| Módulo Activación | 🟡 Siguiente | Checkboxes ReLU/Sigmoid/Tanh/Lineal/LeakyReLU |
| Módulo Dropout | 🟡 | 6 modelos fijos p=0.0–0.5 |
| Módulo Topología | 🟡 | Checkboxes T0–T7 |
| Panel 4 completo | 🟠 | Tabla por modelo (η, J_train, J_test, acc, épocas) |
| Regresión seno | 🟠 | Visualización 1D en Panel 1. Selector deshabilitado por ahora. |

---

## PRÓXIMA SESIÓN: Módulo de Inicialización de pesos

Implementar el módulo de inicialización según §6.2 de la especificación:
checkboxes para Uniforme/Normal/Xavier/He, selector de semillas por
distribución (1–3), generación de hasta 12 modelos, esquema de color
por distribución + opacidad por semilla (§11.2).

Dependencias listas: `crearModelo()` ya acepta `distribucion` y
`semillaPesos`; la función `inicializarPesos()` está implementada.
Solo falta el UI del Panel 3 y la lógica de `generarEnjambre()` para
el módulo `init`.
