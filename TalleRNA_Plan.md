# PLAN DE TRABAJO: TalleRNA
## Visualizador de Enjambre de Redes Neuronales Artificiales
**Versión 1.1** — p5.js, navegador, sin dependencias externas

---

## Estructura general

El desarrollo se organiza en **6 etapas** con **4 milestones de verificación**. Cada etapa produce código funcional e integrable. Las etapas 0–2 construyen la infraestructura; las etapas 3–5 construyen la experiencia visible.

```
Etapa 0 → Etapa 1 → [M1] → Etapa 2 → [M2] → Etapa 3 → Etapa 4 → [M3] → Etapa 5 → [M4]
```

La regla de oro: **no avanzar a la siguiente etapa sin verificar el milestone anterior**. Los bugs de infraestructura que pasan desapercibidos en M1 se multiplican en cada etapa posterior.

---

## Etapa 0 — Infraestructura base

**Objetivo**: el esqueleto completo de la aplicación. Sin visualización funcional aún, pero con la arquitectura correcta desde el inicio. Todo lo que se construya después se apoya en esta etapa.

### 0.1 Canvas y layout de paneles

- Crear canvas con barra global, pestañas y cuatro paneles en proporciones correctas (65/35 vertical, 50/50 horizontal)
- Función `panelRect(id)` → `{x, y, w, h}` que devuelve las coordenadas de cada panel en píxeles
- Función `panelCoords(id, xNorm, yNorm)` → `{px, py}` que mapea coordenadas normalizadas a píxeles dentro de un panel
- Dibujar bordes, fondos y títulos de panel
- Verificar proporciones en distintos tamaños de ventana

### 0.2 Máquina de estados

- Variable global `estado: 'IDLE'|'RUNNING'|'PAUSED'|'CONVERGED'`
- Función `transicionar(nuevoEstado)` con logging en consola
- Todas las transiciones de §12.2 implementadas como funciones nombradas:
  `iniciarEntrenamiento()`, `detener()`, `continuar()`, `converger()`, `reiniciar()`, `resetear()`
- Función `enEstado(...estados)` → boolean, para consultas limpias en renderizado y controles

### 0.3 Barra global y pestañas

- Selector de problema, sliders de ruido y train, display de semilla, botón ⚄, display de red base
- Cinco pestañas: cambio de pestaña llama a `resetear()` y registra `moduloActivo`
- Habilitación/deshabilitación de controles según estado (§9.3)
- Los controles llaman a las funciones de transición — sin lógica propia

### 0.4 Sistema de notificaciones

- Estructura `notificacion: {texto, frameInicio, duracion}`
- Función `notificar(texto)` — registra texto y `frameCount` actual
- Renderizado en zona inferior del Panel 3: fondo `rgba(255,248,225,0.9)`, borde redondeado 4px, fuente 11px `#555555`
- Desaparece tras 120 frames sin desvanecimiento

### 0.5 Estructura de datos global

- Declarar todas las variables globales de §15
- Funciones de inicialización vacías: `initDatos()`, `initEnjambre()`, `initHistorial()`
- Todas las paletas de color definidas como constantes (§11)

---

## Milestone 1 — Infraestructura verificada

**Criterios de aceptación**:

- [ ] Cuatro paneles visibles con proporciones correctas; barra global y pestañas funcionales
- [ ] Cambio de pestaña llama a `resetear()` — verificar en consola
- [ ] Transiciones de estado correctas al presionar botones (aunque no hagan nada visible aún)
- [ ] Etiqueta del botón cambia: "Entrenar enjambre" / "Detener" / "Continuar" / "Reiniciar"
- [ ] Controles se habilitan/deshabilitan correctamente según estado
- [ ] Botón ⚄ genera nuevo número de semilla visible en barra
- [ ] Notificaciones aparecen y desaparecen en ~2s en situaciones definidas
- [ ] Consola muestra todas las transiciones de estado correctamente
- [ ] `panelCoords()` verificada con casos concretos: (0,0) → esquina superior izquierda del panel, (1,1) → esquina inferior derecha

---

## Etapa 1 — Motor matemático

**Objetivo**: toda la matemática de la red neuronal implementada, verificada en consola antes de añadir visualización. Esta etapa no produce nada visible — produce funciones correctas.

### 1.1 Generación de datos

- `generarDatos(problema, nivelRuido, trainRatio, semilla)` → `{datosTrain, datosTest}`
- Implementar los cinco datasets (§3.1) con generadores deterministas usando la semilla
- `normalizarDatos(datosTrain, datosTest)` → datos normalizados + parámetros de normalización guardados
- Verificar con semilla fija: mismo resultado en cada ejecución

### 1.2 Red neuronal — estructura

- `crearModelo(capas, activacion, eta, dropout, semillaPesos, distribucion)` → objeto modelo
- `inicializarPesos(modelo, distribucion, semillaPesos)` — inicialización según §4.4
- Representación interna: `Float32Array` por capa para pesos, sesgos y velocidades de momentum

### 1.3 Red neuronal — forward pass

- `forward(modelo, X, conDropout)` → `{activaciones, preActivaciones, mascarasDropout}`
- Guardar todas las activaciones y pre-activaciones intermedias (necesarias para backprop)
- Verificar: red 2→4→1 con pesos conocidos produce la salida esperada

### 1.4 Red neuronal — pérdida y métricas

- `calcularLoss(yPred, yReal, tipo)` → número (BCE o MSE)
- `calcularAccuracy(yPred, yReal)` → número [0,1] (solo clasificación)
- Verificar BCE con casos límite: ŷ=0.99 y y=1 → pérdida pequeña; ŷ=0.01 y y=1 → pérdida grande

### 1.5 Red neuronal — backpropagation

- `backprop(modelo, activaciones, preActivaciones, yReal, tipo)` → gradientes `{dW, db}` por capa
- Verificar con diferencias finitas: `∂L/∂w ≈ (L(w+ε) − L(w−ε)) / 2ε` para varios pesos
- Esta verificación es obligatoria antes de avanzar — un backprop incorrecto es el peor bug de depurar después

### 1.6 Red neuronal — actualización de pesos

- `actualizarPesos(modelo, gradientes)` — SGD + momentum β=0.9 (§4.5)
- `entrenarEpoca(modelo, datosTrain)` → `{J_train}` — una época completa: forward + loss + backprop + update
- `evaluarTest(modelo, datosTest)` → `{J_test, accuracy_test}` — sin dropout

### 1.7 Criterios de terminación

- `verificarConvergencia(modelo)` → boolean — 5 épocas consecutivas (§12.4)
- `verificarDivergencia(modelo, J_anterior)` → `{diverge, tipo}` — explosión o NaN

---

## Milestone 2 — Motor matemático verificado

**Criterios de aceptación** (todo en consola, sin visualización):

- [ ] `generarDatos('espiral', 15, 0.8, 42)` produce siempre los mismos 200 puntos
- [ ] `forward()` con red 2→4→1 y pesos Xavier produce salidas en (0,1) para clasificación
- [ ] Verificación de gradientes por diferencias finitas: error relativo < 1e-5 en al menos 10 pesos distintos
- [ ] Una época de entrenamiento en espiral reduce J_train respecto a la época 0
- [ ] 50 épocas en XOR con η=0.1 convergen visiblemente (J_train baja de 0.5 a < 0.2)
- [ ] BCE con ε=1e-7 no produce NaN ni -Infinity en ningún caso de prueba
- [ ] `verificarConvergencia()` no dispara antes de 5 épocas consecutivas
- [ ] `verificarDivergencia()` detecta correctamente NaN y explosión de pérdida

---

## Etapa 2 — Panel 1 y visualización de datos

**Objetivo**: visualización funcional del espacio de salida. Esta etapa conecta el motor matemático con p5.js por primera vez.

### 2.1 Renderizado de datos

- Dibujar `datosTrain` y `datosTest` en Panel 1 con los estilos de §7.2 (capas 2 y 3)
- Ejes x₁, x₂ con escala normalizada, ticks cada 0.5, margen 10%
- Función `dataToPanel1(x1, x2)` → `{px, py}` — coordenadas de dato a píxeles del panel

### 2.2 Mapa de predicción de fondo

- `calcularGridPrediccion(modelo, resolucion)` → Array 50×50 de valores ŷ
- Renderizar en `createGraphics()`: azul tenue para clase 0 / valor bajo, naranja tenue para clase 1 / valor alto
- Verificar que el mapa de un modelo perfectamente entrenado (pesos a mano) muestra colores coherentes

### 2.3 Fronteras de decisión

- `calcularFrontera(gridPrediccion)` → puntos del contorno p(y=1)=0.5
- Dibujar una frontera por modelo con el color y opacidad de §7.2 (capa 4)
- Mostrar fronteras de la época 0 en IDLE (estado inicial visible)

### 2.4 Interacción básica en Panel 1

- Click en frontera → `modeloSeleccionado` actualizado, mapa de fondo cambia
- Hover sobre frontera → `modeloHover` actualizado
- `dataToPanel1()` inversa: `panel1ToData(px, py)` para detectar hover sobre fronteras

---

## Etapa 3 — Animación del enjambre

**Objetivo**: el enjambre entrena en tiempo real. Esta es la etapa central del proyecto.

### 3.1 Generación del enjambre

- `generarEnjambre(moduloActivo, configuracionModulo)` → array de modelos
- Para cada módulo: aplicar el esquema de color de §11 al crear cada modelo
- Calcular y mostrar fronteras de época 0 de todos los modelos antes de entrenar
- `modeloReferencia` = modelo con menor J_test en época 0

### 3.2 Loop de animación

- En `draw()` cuando `estado === 'RUNNING'`: ejecutar `pasos_por_frame` épocas (§13.1)
- Por cada época: `entrenarEpoca()` + `evaluarTest()` + `verificarConvergencia/Divergencia()` para cada modelo activo
- Actualizar `modelo.historial` con cada época
- Si todos los modelos terminaron: `converger()`

### 3.3 Actualización de Panel 1 durante animación

- Recalcular `gridPrediccion` del `modeloReferencia` según frecuencia de velocidad (§7.2)
- Redibujar todas las fronteras en cada frame
- Círculo ✕ para modelos divergentes o no-convergidos

### 3.4 Velocidad y control

- Tres botones Lenta/Normal/Rápida con resaltado del activo
- Cambio de velocidad en cualquier momento sin interrumpir animación
- Frecuencia de actualización del mapa de fondo vinculada a la velocidad

---

## Milestone 3 — Enjambre animado verificado

**Criterios de aceptación**:

- [ ] Módulo de tasa de aprendizaje: 10 modelos con η=0.01..0.30 entrenan simultáneamente en espiral
- [ ] Fronteras de decisión de época 0 visibles antes de presionar "Entrenar"
- [ ] Las fronteras se actualizan progresivamente durante el entrenamiento
- [ ] Velocidad Rápida es visiblemente más rápida que Lenta
- [ ] Modelo divergente (η grande en espiral): aparece ✕, su frontera desaparece
- [ ] Detener con "Detener" y reanudar con "Continuar": continúa desde donde se quedó
- [ ] Cambiar velocidad durante animación no interrumpe el entrenamiento
- [ ] Mapa de fondo no parpadea entre frames
- [ ] CONVERGED se activa solo cuando todos los modelos terminaron
- [ ] "Reiniciar" en CONVERGED reinicia desde época 0 con los mismos pesos iniciales

---

## Etapa 4 — Panel 2, Panel 4 y módulos completos

**Objetivo**: los dos paneles restantes funcionando y todos los módulos implementados.

### 4.1 Panel 2 — historial de pérdida

- Dibujar curvas de J_train por modelo, extendidas en cada frame
- Curvas de J_test (más tenues) con toggle "Mostrar test"
- Toggle lineal/log: piso en 1e-8 en modo log
- Toggle Pérdida/Accuracy (solo clasificación)
- Hover cruzado: `modeloHover` resalta curva en Panel 2 y frontera en Panel 1 simultáneamente
- Click sobre curva → `modeloSeleccionado`
- Línea punteada J* al finalizar (CONVERGED)
- Eje Y fijado al inicio de la animación: `[0, J_max_época0 × 1.05]`

### 4.2 Panel 4 — estadísticas

- Cuatro tarjetas de métricas actualizadas progresivamente (§10.1)
- Tres etiquetas de "mejor modelo" (§10.2): menor J_test, convergió antes, más estable
- Histograma de J_test final (§10.3): barras por modelo, divergentes en rojo al extremo derecho
- Tabla de ranking (§10.4): visible solo en CONVERGED, construida progresivamente

### 4.3 Módulo de inicialización

- Generación de 4 distribuciones × N semillas (§6.2)
- Esquema de color por distribución + opacidad por semilla (§11.2)
- Checkboxes y selector de semillas funcionales

### 4.4 Módulo de activación

- Generación de hasta 5 modelos, uno por función activa (§6.3)
- Verificar que la activación Lineal produce fronteras siempre rectas en Panel 1

### 4.5 Módulo de dropout

- Implementar inverted dropout con máscara diferente en cada época (§4.6)
- Verificar que J_test se calcula siempre sin dropout
- Esquema de color por tasa (§11.4)

### 4.6 Módulo de topología

- Generación de hasta 8 arquitecturas distintas (§6.5)
- Verificar que T0 (2→1 sin capas ocultas) produce frontera lineal en Panel 1
- Checkboxes T0–T7 funcionales
- Etiqueta "Activación: ReLU (fija en este módulo)" visible

---

## Milestone 4 — Sistema completo verificado

**Criterios de aceptación**:

- [ ] Panel 2: curvas de pérdida se dibujan y extienden correctamente para todos los módulos
- [ ] Toggle Pérdida/Accuracy funciona en clasificación; no aparece en regresión seno
- [ ] Toggle Mostrar test muestra/oculta curvas tenues sin reiniciar animación
- [ ] Hover en Panel 2 resalta frontera correspondiente en Panel 1 (y viceversa)
- [ ] J* aparece como línea punteada al terminar la animación
- [ ] Panel 4: tarjetas de métricas excluyen divergentes del promedio — verificar con η alto
- [ ] Panel 4: las tres etiquetas de "mejor modelo" muestran valores distintos cuando corresponde
- [ ] Panel 4: histograma tiene barras rojas separadas para divergentes
- [ ] Panel 4: tabla de ranking visible solo en CONVERGED
- [ ] Módulo inicialización: 12 modelos con colores y opacidades correctas
- [ ] Módulo activación: frontera Lineal siempre recta en espiral (no puede separar)
- [ ] Módulo dropout: brecha train/test visible en Panel 2 al aumentar p
- [ ] Módulo topología: T0 produce frontera lineal; T6 produce frontera compleja
- [ ] Cambiar dataset en barra global: todos los paneles se regeneran correctamente
- [ ] Botón ⚄: nueva semilla produce datos distintos, misma semilla reproduce el mismo experimento

---

## Etapa 5 — Pulido, robustez y regresión seno

**Objetivo**: casos borde, coherencia visual, dataset de regresión, y verificación cruzada entre módulos.

### 5.1 Regresión seno — adaptaciones

- Verificar que Panel 1 muestra curva ŷ(x) en lugar de frontera de decisión
- Toggle Pérdida/Accuracy desactivado (no aplica en regresión)
- Accuracy excluida de Panel 4
- Mapa de fondo adaptado: gradiente de color en lugar de clases binarias

### 5.2 Casos borde y robustez

- Módulo topología con solo T0 seleccionado: funciona correctamente
- Módulo inicialización con solo 1 distribución activa: funciona
- η_min = η_max en módulo de tasa de aprendizaje: 1 modelo, sin error
- Todas las trayectorias divergentes: Panel 4 muestra "Todos divergentes", sin division-by-zero en estadísticas
- Cambio de pestaña desde PAUSED: enjambre reiniciado correctamente, historial limpio
- NaN en pesos: detectado en el frame donde ocurre, no causa crash

### 5.3 Coherencia visual entre paneles

- Verificar que el color de cada modelo es idéntico en los cuatro paneles
- Verificar que el modelo seleccionado está resaltado consistentemente en Panel 1, 2 y 3
- Verificar que las fronteras de Panel 1 corresponden a las curvas de Panel 2 (misma época)

### 5.4 Performance

- Medir frameRate en el peor caso: 12 modelos (módulo inicialización, 3 semillas) + red 2→4→4→1 + espiral + velocidad Rápida
- Si frameRate < 30fps: reducir resolución del grid de predicción a 40×40 o calcular menos épocas por frame
- Los ajustes de performance no deben requerir cambios en la spec — son parámetros internos

---

## Resumen de etapas y dependencias

```
Etapa 0: Layout, máquina de estados, barra global, notificaciones, paletas
   ↓
   [M1: verificar infraestructura]
   ↓
Etapa 1: Motor matemático completo (forward, backprop, métricas, criterios)
   ↓
   [M2: verificar motor — diferencias finitas obligatorias]
   ↓
Etapa 2: Panel 1 (datos, mapa de fondo, fronteras de época 0)
   ↓
Etapa 3: Animación del enjambre (loop, actualización, velocidad)
   ↓
   [M3: verificar animación con módulo de tasa de aprendizaje]
   ↓
Etapa 4: Panel 2, Panel 4, módulos de inicialización/activación/dropout/topología
   ↓
   [M4: verificar sistema completo]
   ↓
Etapa 5: Regresión seno, casos borde, coherencia visual, performance
```

---

## Orden recomendado dentro de cada sesión de Claude Code

1. **Describir la tarea** en términos de la spec (número de sección) antes de pedir código
2. **Una subtarea a la vez**: no combinar, por ejemplo, backprop y renderizado en la misma sesión
3. **Verificar en consola** antes de pasar a la siguiente subtarea
4. **M1 y M2 son puertas duras**: no avanzar sin verificar sus criterios completos
5. **El motor matemático de Etapa 1 es la inversión más importante**: un backprop incorrecto que llega a Etapa 3 es casi imposible de depurar visualmente

---

## Decisiones de implementación que afectan el desarrollo

Registradas aquí para referencia al escribir prompts de Claude Code:

- **`Float32Array` para pesos**: operaciones vectoriales más rápidas que arrays normales de JS
- **`createGraphics()` para el mapa de fondo**: no recalcular en cada `draw()` — solo en las épocas definidas por velocidad
- **Grilla 50×50 compartida**: el mismo grid sirve para el mapa de fondo y para calcular todas las fronteras de decisión
- **`modeloHover` en `mouseMoved()`**: actualizar en cada movimiento del mouse, consultar en `draw()`; no calcular hover dentro de `draw()`
- **Paletas como constantes**: definidas en `setup()`, consultadas en `draw()` — nunca recalculadas
- **`contadorConv` por modelo**: incrementar cuando se cumple el criterio, resetear cuando no; convergencia = contador ≥ 5

---

## Notas para versión futura (v1.2)

- Momentum como sexto módulo (β variable: 0.0, 0.3, 0.6, 0.9)
- Semilla de pesos editable por el usuario
- Curva de sensibilidad en Panel 4 (hiperparámetro vs. J_test_final)
- Exportar configuración + historial en JSON
- Datasets adicionales: función escalón, iris reducido a 2D
