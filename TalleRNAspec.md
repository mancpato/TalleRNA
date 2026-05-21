# ESPECIFICACIÓN: TalleRNA
## Visualizador de Enjambre de Redes Neuronales Artificiales
**Versión 1.1** — tecnología: p5.js, navegador, sin dependencias externas

---

## 1. VISIÓN GENERAL

TalleRNA entrena simultáneamente un enjambre de redes neuronales artificiales que difieren en un solo hiperparámetro o aspecto de su arquitectura. El alumno observa en tiempo real cómo el mismo problema es atacado por múltiples modelos en paralelo, revelando la sensibilidad del entrenamiento a cada variable de diseño: tasa de aprendizaje, inicialización de pesos, función de activación, regularización por dropout, y topología de la red.

El principio de diseño central es el **experimento controlado**: en cada módulo varía exactamente una cosa; todo lo demás permanece fijo. Esto hace que las diferencias observadas sean atribuibles al hiperparámetro que se estudia.

La herramienta no reemplaza el estudio formal del aprendizaje automático — lo hace visible.

---

## 2. ESTRUCTURA GENERAL DE LA INTERFAZ

### 2.1 Barra global (siempre visible)

Barra horizontal en la parte superior. Persiste independientemente del módulo activo. Todo cambio aquí detiene la animación, regenera los datos y transiciona a IDLE.

```
[Problema ▾]  [Ruido ──●──]  [Train ──●──]  |  [⚄ semilla: 4721]  |  2→4→1 · ReLU · SGD+mom
```

| Control | Tipo | Valores | Notas |
|---|---|---|---|
| Problema | Selector | Espiral, Círculos, XOR, Media luna, Regresión seno | |
| Ruido | Slider | 0–50, paso 5 | σ = nivel × 0.01 (ver §3.2) |
| Train | Slider | 60%–90%, paso 10% | el resto es test |
| Semilla | Display + botón ⚄ | Entero visible, no editable | Botón genera nueva semilla aleatoria |
| Red base | Display fijo | Arquitectura · Activación · Optimizador | No editable en la barra |

**Red base por defecto**: 2→4→1, ReLU, Xavier.

**Optimizador global fijo**: SGD con momentum = 0.9 y batch completo. No es un parámetro variable — es el entorno experimental. Se muestra en la barra para que el alumno lo tenga presente en todo momento.

### 2.2 Pestañas de módulos

Cinco pestañas debajo de la barra global. Solo un módulo activo a la vez.

```
[ Tasa de aprendizaje ]  [ Inicialización ]  [ Activación ]  [ Momentum ]  [ Topología ]
```

Al cambiar de pestaña con animación activa: detener animación, mantener datos y semilla, reiniciar enjambre con la configuración del nuevo módulo, transicionar a IDLE.

### 2.3 Cuatro paneles principales

```
┌─────────────────────────┬─────────────────────────┐
│  PANEL 1                │  PANEL 2                │
│  Espacio de salida      │  Historial de pérdida   │
│                         │                         │
├─────────────────────────┼─────────────────────────┤
│  PANEL 3                │  PANEL 4                │
│  Controles del módulo   │  Estadísticas           │
└─────────────────────────┴─────────────────────────┘
```

- Fila superior: 65% del alto disponible
- Fila inferior: 35% del alto disponible
- Columnas: 50/50
- Fondo general: blanco `#ffffff`
- Bordes entre paneles: `#cccccc`, 1px

---

## 3. DATOS Y GENERACIÓN DE PROBLEMAS

### 3.1 Datasets disponibles

Todos generados sintéticamente en el navegador con semilla controlada.

| Nombre | Entradas | Salida | Descripción |
|---|---|---|---|
| Espiral | x₁, x₂ | Binaria (BCE) | Dos espiras entrelazadas, 100 puntos por clase. No separable linealmente. |
| Círculos | x₁, x₂ | Binaria (BCE) | 100 puntos clase interna, 100 clase exterior concéntrica. |
| XOR | x₁, x₂ | Binaria (BCE) | 200 puntos en cuatro cuadrantes, clases alternadas. |
| Media luna | x₁, x₂ | Binaria (BCE) | Dos semilunares, separación ajustable por ruido. |
| Regresión seno | x₁ | Escalar (MSE) | y = sin(2πx) + ε, x ∈ [0,1], 200 puntos uniformes. |

### 3.2 Ruido

Desplazamiento gaussiano independiente aplicado a cada coordenada de entrada:

```
x₁_ruidosa = x₁ + N(0, σ)
x₂_ruidosa = x₂ + N(0, σ)
σ = nivel_ruido × 0.01
```

Con nivel=0: datos limpios. Con nivel=50: σ=0.5.

En Regresión seno el ruido se aplica también a la salida: `y_ruidosa = y + N(0, σ)`.

### 3.3 Split train/test

El porcentaje seleccionado (por defecto 80%) se usa para entrenamiento. El resto es test. No hay conjunto de validación separado. Los datos de test no participan en el entrenamiento; se usan para calcular J_test y para la visualización en Panel 1.

### 3.4 Semilla de datos

Un entero controla toda la aleatoriedad de generación de datos (posiciones, clases, partición). Se muestra en la barra global. El botón ⚄ genera una nueva semilla aleatoria y regenera los datos. La semilla de datos es independiente de la semilla de inicialización de pesos (ver §5).

### 3.5 Normalización

**Entradas**: normalizadas a [−1, 1] usando mínimo y máximo del conjunto de entrenamiento. La misma transformación se aplica al test.

**Salida en regresión**: normalizada a [−1, 1] usando mínimo y máximo de y en entrenamiento. La misma transformación se aplica al test.

**Salida en clasificación**: ya es binaria {0, 1}, sin normalización.

---

## 4. MODELO DE RED NEURONAL

### 4.1 Arquitectura general

```
Entradas → [Capa oculta 1] → [Capa oculta 2] → Salida
```

- **Entradas**: 2 en clasificación, 1 en regresión seno
- **Capas ocultas**: 0, 1 o 2 (según red base o módulo de topología)
- **Neuronas por capa oculta**: 2, 3 o 4
- **Salida**: 1 neurona
  - Clasificación binaria: sigmoid en capa de salida, pérdida BCE
  - Regresión: activación lineal en capa de salida, pérdida MSE

### 4.2 Funciones de activación (capas ocultas)

| Nombre | Fórmula |
|---|---|
| ReLU | max(0, z) |
| Sigmoid | 1 / (1 + e^−z) |
| Tanh | (e^z − e^−z) / (e^z + e^−z) |
| Lineal | z |
| Leaky ReLU | z si z > 0, 0.01·z si z ≤ 0 |

### 4.3 Funciones de pérdida

```
Clasificación (BCE):
  L = −(1/n) · Σ [ yᵢ·log(ŷᵢ + ε) + (1−yᵢ)·log(1−ŷᵢ + ε) ]
  ε = 1e-7  (estabilidad numérica)

Regresión (MSE):
  L = (1/n) · Σ (yᵢ − ŷᵢ)²
```

### 4.4 Inicializaciones de pesos

| Nombre | Distribución | Recomendada para |
|---|---|---|
| Uniforme | U[−0.5, 0.5] | referencia naïve |
| Normal | N(0, 0.1) | referencia naïve |
| Xavier | N(0, sqrt(2 / (nᵢₙ + nₒᵤₜ))) | Tanh, Sigmoid |
| He | N(0, sqrt(2 / nᵢₙ)) | ReLU, Leaky ReLU |

Sesgos inicializados en 0 en todos los casos.

### 4.5 Optimizador

**SGD con momentum**, fijo en toda la aplicación:

```
v[t] = β · v[t−1] + η · ∇L(w[t])
w[t+1] = w[t] − v[t]

β = 0.9   (momentum, fijo, no variable)
η = tasa de aprendizaje del modelo
```

`v` se inicializa en 0 al crear cada modelo. El batch es siempre completo (todos los datos de entrenamiento por época). SGD puro sin momentum es demasiado lento para los rangos de η pedagógicamente relevantes; momentum=0.9 produce convergencia visible en ≤200 épocas para todas las arquitecturas de la spec.

### 4.6 Dropout (solo módulo Dropout)

```
Durante entrenamiento (p > 0):
  máscara[j] ~ Bernoulli(1 − p)
  a[l][j] = a[l][j] · máscara[j] / (1 − p)   // inverted dropout

Durante inferencia (cálculo de J_test, accuracy_test):
  sin máscara, sin escala
```

---

## 5. INICIALIZACIÓN DEL ENJAMBRE Y SEMILLAS

### 5.1 Principio de comparabilidad

Para aislar el efecto del hiperparámetro que varía, la inicialización de pesos es controlada por módulo:

**Módulo de tasa de aprendizaje**: todos los modelos usan la misma semilla de pesos (semilla_pesos = 1) con distribución Xavier. Los pesos iniciales son idénticos en todos los modelos; solo difiere η.

**Módulo de inicialización**: la variación es precisamente la distribución y la semilla. Cada distribución se instancia con 3 semillas conocidas (1, 2, 3), produciendo hasta 12 modelos.

**Módulos de activación, dropout y topología**: todos los modelos usan semilla_pesos = 1 con distribución Xavier.

La semilla_pesos es interna y fija, independiente de la semilla de datos que muestra la barra global.

### 5.2 Estado inicial visible (época 0)

Al generar el enjambre en IDLE (antes de entrenar), se calculan las fronteras de decisión iniciales de todos los modelos y se muestran en Panel 1. El alumno observa el caos del estado aleatorio antes de que comience el entrenamiento. Esto requiere un forward pass inicial sobre la grilla 50×50 para cada modelo — costo aceptable en IDLE.

---

## 6. MÓDULOS

Cada módulo define un enjambre de modelos que difieren en exactamente un hiperparámetro. Todos los demás parámetros están fijos en los valores de la red base global.

### 6.1 Módulo — Tasa de aprendizaje

| Parámetro | Valor |
|---|---|
| Variable | η (tasa de aprendizaje) |
| Rango por defecto | 0.01 a 0.30 |
| Paso por defecto | 0.03 → 10 modelos |
| Ajustable | η_min, η_max y paso en Panel 3 |
| Fijo | Xavier (semilla=1), ReLU, sin dropout, red base 2→4→1 |

Fenómenos observables: convergencia lenta (η pequeño), convergencia rápida, oscilación, divergencia (η grande).

### 6.2 Módulo — Inicialización de pesos

| Parámetro | Valor |
|---|---|
| Variable | Distribución de pesos iniciales |
| Opciones | Uniforme, Normal, Xavier, He (checkboxes) |
| Semillas por distribución | 1, 2 o 3 (selector en Panel 3) |
| Modelos total | distribuciones activas × semillas |
| Fijo | η = 0.05, ReLU, sin dropout, red base 2→4→1 |

Las semillas múltiples por distribución permiten observar la varianza interna de cada estrategia además de la varianza entre estrategias. El color identifica la distribución; la opacidad distingue la semilla (100% / 65% / 40%).

Fenómenos observables: sensibilidad a la inicialización, varianza dentro de una distribución, ventajas de Xavier/He sobre naïve.

### 6.3 Módulo — Función de activación

| Parámetro | Valor |
|---|---|
| Variable | Función de activación en capas ocultas |
| Opciones | ReLU, Sigmoid, Tanh, Lineal, Leaky ReLU (checkboxes) |
| Modelos | Funciones activas seleccionadas |
| Fijo | η = 0.05, Xavier (semilla=1), sin dropout, red base 2→4→1 |

La activación de la capa de salida permanece fija (sigmoid para clasificación, lineal para regresión) independientemente del módulo.

Fenómenos observables: por qué Lineal falla en problemas no lineales (su frontera siempre es un hiperplano), saturación de Sigmoid/Tanh, ventaja de velocidad de ReLU.

### 6.4 Módulo — Momentum

| Parámetro | Valor |
|---|---|
| Variable | β (coeficiente de momentum) |
| Valores | 0.0 · 0.3 · 0.6 · 0.9 (4 modelos fijos) |
| Fijo | η = 0.05, Xavier (semilla=1), ReLU, red base 2→4→1 |

Fenómenos observables: SGD puro (β=0) vs SGD con momentum creciente. Convergencia más lenta y ruidosa para β=0; aceleración y suavizado progresivos al aumentar β; posible overshooting visible en Panel 2 cuando η=0.05 y β=0.9 en problemas no lineales.

### 6.5 Módulo — Topología

| Parámetro | Valor |
|---|---|
| Variable | Arquitectura de la red |
| Opciones | T0–T7 (checkboxes, hasta 8 simultáneas) |
| Fijo | η = 0.05, Xavier (semilla=1), ReLU (mostrada explícitamente), sin dropout |

| ID | Notación | Capas ocultas | Neuronas |
|---|---|---|---|
| T0 | 2→1 | 0 | — |
| T1 | 2→2→1 | 1 | 2 |
| T2 | 2→3→1 | 1 | 3 |
| T3 | 2→4→1 | 1 | 4 (= red base) |
| T4 | 2→2→2→1 | 2 | 2+2 |
| T5 | 2→3→3→1 | 2 | 3+3 |
| T6 | 2→4→4→1 | 2 | 4+4 |
| T7 | 2→4→2→1 | 2 | 4+2 |

La función de activación fija se muestra explícitamente en Panel 3 para evitar confusión con el módulo de activación.

Fenómenos observables: capacidad vs. sobreajuste, por qué T0 no puede resolver la espiral, diferencia entre profundidad y anchura.

---

## 7. PANEL 1 — ESPACIO DE SALIDA

### 7.1 Descripción

Muestra las fronteras de decisión (clasificación) o curvas de ajuste (regresión) de todos los modelos del enjambre, superpuestas sobre los datos, actualizadas en tiempo real.

### 7.2 Capas (orden de renderizado, de atrás a adelante)

**Capa 1 — Mapa de predicción del modelo de referencia**

Calculado sobre grilla 50×50 que cubre el espacio de entrada. Renderizado en `createGraphics()`. Colores muy tenues: azul suave = clase 0 / valor bajo; naranja suave = clase 1 / valor alto. Intensidad proporcional a la confianza del modelo (|ŷ − 0.5| para clasificación).

Frecuencia de actualización:

| Velocidad | Cada N épocas |
|---|---|
| Lenta | 5 |
| Normal | 10 |
| Rápida | 25 |

**El modelo de referencia se fija al presionar "Entrenar"** y corresponde al modelo con menor J_test inicial (época 0). No cambia automáticamente durante la animación para evitar parpadeo. El usuario puede cambiarlo haciendo click en cualquier modelo.

**Capa 2 — Datos de test**

Círculos r=4px con borde blanco 1.5px. Color por clase.

**Capa 3 — Datos de entrenamiento**

Círculos r=4px sin borde. Color por clase.

**Capa 4 — Fronteras de decisión de todos los modelos**

Contorno p(y=1)=0.5 para clasificación; curva ŷ(x) para regresión.

| Condición del modelo | Opacidad | Grosor |
|---|---|---|
| Seleccionado | 100% | 2.5px |
| En hover | 80% | 1.5px |
| Resto | 35% | 1px |
| Divergente o no-convergido | No se dibuja frontera — símbolo ✕ en el centroide, color del modelo |

**Capa 5 — Ejes y etiquetas**

Ejes x₁ y x₂ con rango determinado por los datos más 10% de margen. Ticks cada 0.5 unidades (espacio normalizado).

### 7.3 Interacción

- Click sobre frontera o círculo del enjambre → seleccionar ese modelo (actualiza mapa de fondo y resaltado)
- Hover sobre frontera → resaltar en Panel 1 y curva correspondiente en Panel 2 (correlación cruzada)

---

## 8. PANEL 2 — HISTORIAL DE PÉRDIDA

### 8.1 Contenido

- **Eje x**: época (0 al máximo observado)
- **Eje y**: pérdida J. Fijado al inicio de la animación en `[0, J_max_época0 × 1.05]`. No se re-escala durante la animación.
- **Curva de entrenamiento**: una línea por modelo, color del esquema del módulo, grosor 1.5px
- **Curva de test**: misma por modelo, más tenue (opacidad 40%, grosor 1px, mismo color). Visible en todos los módulos cuando el toggle "Mostrar test" está activado.
- **Modelo seleccionado**: curva train grosor 2.5px opacidad 100%; curva test grosor 1.5px opacidad 100%
- **Modelo en hover**: ambas curvas opacidad 80%
- **Resto de modelos**: train opacidad 50%, test opacidad 20%
- **Modelo divergente**: curva se corta al salir del rango visible del eje Y; no se extiende fuera del panel
- **Línea punteada horizontal**: J* = menor J_test observado entre todos los modelos al finalizar. Color `#cc0000`, grosor 1px, etiqueta "J*". Aparece al terminar la animación.
- **Toggle lineal/log** (botón pequeño): en modo log, piso en 1e-8 para evitar log(0)
- **Toggle Pérdida/Accuracy** (solo clasificación): conmuta eje Y entre J y porcentaje de aciertos sobre test. En modo Accuracy el eje Y se invierte (arriba = mejor).

### 8.2 Interacción

- Hover sobre curva → resaltar en Panel 2 y frontera correspondiente en Panel 1 (correlación cruzada)
- Click sobre curva → seleccionar ese modelo

### 8.3 Reinicio

Al transicionar a IDLE: limpiar completamente el gráfico.

---

## 9. PANEL 3 — CONTROLES DEL MÓDULO

### 9.1 Estructura general (común a todos los módulos)

```
[ Entrenar enjambre ]     ← etiqueta varía por estado (§12.3)

Épocas máx.:  [slider 50–1000, paso 50, default 200]
Velocidad:    [ Lenta ]  [ Normal ]  [ Rápida ]   ← botones, activo resaltado

[ ☑ Mostrar curvas de test ]

── Enjambre ────────────────────────────────────────
●  ●  ●  ●  ●  ●  ●  ●  ●  ●
  hover → tooltip: etiqueta del modelo y J_train actual
  click → seleccionar modelo
  si divergente/no-convergido → ✕ en el mismo color

── Controles específicos del módulo ────────────────
  [varía según módulo activo — ver §9.2]

── Notificaciones ──────────────────────────────────
  [área de mensajes temporales — ver §9.4]
```

### 9.2 Controles específicos por módulo

**Tasa de aprendizaje**:
Sliders de η_min y η_max (rango [0.01, 0.30], paso 0.01). Selector de paso (0.01, 0.02, 0.03, 0.05). Display: "N modelos en el enjambre".

**Inicialización**:
Checkboxes [☑ Uniforme] [☑ Normal] [☑ Xavier] [☑ He]. Selector "Semillas por distribución": 1, 2 o 3. Display: "N modelos total".

**Activación**:
Checkboxes [☑ ReLU] [☑ Sigmoid] [☑ Tanh] [☑ Lineal] [☑ Leaky ReLU]. Display: "N modelos total".

**Momentum**:
Display informativo del rango β ∈ {0.0, 0.3, 0.6, 0.9}. Nota: "4 modelos fijos". Sin controles adicionales.

**Topología**:
Checkboxes [☑ T0] [☑ T1] ... [☑ T7] con etiqueta de notación a la derecha. Etiqueta fija visible: "Activación: ReLU (fija en este módulo)". Display: "N modelos seleccionados (máx. 8)".

### 9.3 Estado de controles según máquina de estados

| Control | IDLE | RUNNING | PAUSED | CONVERGED |
|---|---|---|---|---|
| Botón principal | Entrenar ✓ | Detener ✓ | Continuar ✓ | Reiniciar ✓ |
| Épocas máx. | ✓ | ✗ | ✗ | ✓* |
| Velocidad | ✓ | ✓ | ✓ | — |
| Mostrar test | ✓ | ✓ | ✓ | ✓ |
| Config. módulo | ✓ | ✗ | ✗ | ✓* |
| Barra global | ✓ | ✓** | ✓** | ✓** |

*Cambiar en CONVERGED transiciona a IDLE y reinicia el enjambre.
**Cambio en barra global → detiene animación → IDLE.

### 9.4 Sistema de notificaciones

Área fija en la zona inferior del Panel 3. Mensajes que duran 120 frames (~2s a 60fps) y desaparecen sin desvanecimiento. Estilo: fondo `rgba(255,248,225,0.9)`, borde redondeado 4px, fuente 11px color `#555555`.

| Situación | Mensaje |
|---|---|
| Cambio de parámetro en RUNNING | "Cambio ignorado durante entrenamiento" |
| Cambio en barra global con animación | "Animación detenida — datos regenerados" |
| Cambio de módulo con animación | "Módulo cambiado — enjambre reiniciado" |
| Épocas máximas alcanzadas sin converger | "Épocas máximas alcanzadas sin convergencia" |
| Todos los modelos divergieron | "Todas las trayectorias divergieron" |

---

## 10. PANEL 4 — ESTADÍSTICAS DEL ENJAMBRE

### 10.1 Tarjetas de métricas

Actualizadas progresivamente a medida que los modelos van terminando. Los modelos divergentes y no-convergidos se excluyen del cálculo del promedio y la desviación; se indica cuántos se excluyeron.

```
┌─────────────────┐  ┌─────────────────┐
│  convergidos    │  │  J_test final   │
│    7 / 10       │  │    0.142        │
│  (3 excluidos)  │  │   σ = 0.031     │
└─────────────────┘  └─────────────────┘
┌─────────────────┐  ┌─────────────────┐
│ épocas mediana  │  │ accuracy media  │ ← solo clasificación
│      67         │  │    83.4%        │
│  rango: 44–100  │  │   σ = 4.1%      │
└─────────────────┘  └─────────────────┘
```

La mediana de épocas excluye modelos divergentes y no-convergidos.

### 10.2 Tres etiquetas de "mejor modelo"

```
Menor J_test:      η = 0.05  (J_test = 0.118)
Convergió antes:   η = 0.10  (época 31)
Más estable:       η = 0.04  (σ_J_train últimas 10 épocas = 0.0008)
```

"Más estable" = menor desviación estándar de J_train en las últimas 10 épocas (convergencia suave vs. oscilante).

### 10.3 Histograma de J_test final

Barras verticales, una por modelo, ordenadas por J_test ascendente. Color según esquema del módulo. Los modelos divergentes y no-convergidos aparecen como barras rojas `#E24B4A` al extremo derecho, separadas por espacio visual. Eje x: etiqueta del modelo (ej. "η=0.05"). Eje y: J_test final.

### 10.4 Tabla de ranking

Solo visible en estado CONVERGED. Ordenada por J_test ascendente. Se construye progresivamente a medida que los modelos terminan.

```
#  │ Modelo    │ J_train │ J_test  │ Accuracy │ Épocas │ Estado
───┼───────────┼─────────┼─────────┼──────────┼────────┼───────────────
1  │ η = 0.05  │  0.103  │  0.118  │  86.5%   │   44   │ convergido
2  │ η = 0.04  │  0.115  │  0.131  │  84.2%   │   51   │ convergido
…
9  │ η = 0.25  │   —     │   —     │   —      │   —    │ divergente
10 │ η = 0.30  │   —     │   —     │   —      │   —    │ no convergido
```

La columna Accuracy solo aparece en clasificación.

---

## 11. ESQUEMAS DE COLOR DEL ENJAMBRE

El color de cada modelo es fijo desde que se genera el enjambre. Es el mismo en Panel 1 (fronteras), Panel 2 (curvas), Panel 3 (círculos) y Panel 4 (barras del histograma).

### 11.1 Tasa de aprendizaje — gradiente continuo

```
t = (η − η_min) / (η_max − η_min)
color = lerpColor(azul_violeta, naranja, t)
azul_violeta = hsl(250, 70%, 55%)
naranja      = hsl(30, 100%, 55%)
```

### 11.2 Inicialización — color fijo por distribución, opacidad por semilla

| Distribución | Color |
|---|---|
| Uniforme | azul `#378ADD` |
| Normal | verde `#1D9E75` |
| Xavier | naranja `#BA7517` |
| He | violeta `#534AB7` |

Semilla 1: opacidad 100%. Semilla 2: 65%. Semilla 3: 40%.

### 11.3 Activación — color fijo por función

| Función | Color |
|---|---|
| ReLU | azul `#185FA5` |
| Sigmoid | coral `#D85A30` |
| Tanh | verde `#1D9E75` |
| Lineal | gris `#888780` |
| Leaky ReLU | violeta `#534AB7` |

### 11.4 Momentum — gradiente por coeficiente β

```
t = β / 0.9
color = lerpColor(azul_claro, naranja_oscuro, t)
azul_claro     = hsl(200, 65%, 60%)
naranja_oscuro = hsl(25, 85%, 42%)
```

Etiqueta de cada modelo: "β=0.0", "β=0.3", "β=0.6", "β=0.9".

### 11.5 Dropout — gradiente por tasa (módulo experimental)

```
t = p / 0.5
color = lerpColor(naranja_oscuro, azul, t)
naranja_oscuro = hsl(20, 80%, 40%)
azul           = hsl(210, 70%, 45%)
```

### 11.6 Topología — color por complejidad creciente

| ID | Color |
|---|---|
| T0 | gris `#888780` |
| T1 | azul muy claro `#B5D4F4` |
| T2 | azul claro `#85B7EB` |
| T3 | azul `#378ADD` |
| T4 | verde claro `#97C459` |
| T5 | verde `#639922` |
| T6 | verde oscuro `#3B6D11` |
| T7 | teal `#1D9E75` |

---

## 12. MÁQUINA DE ESTADOS

### 12.1 Estados

```
IDLE       Sin animación. Enjambre generado, fronteras de época 0 visibles en Panel 1.
           Configuración completamente editable.

RUNNING    Entrenando época a época. Configuración de módulo bloqueada.
           Paneles 1, 2 y 4 se actualizan en tiempo real.

PAUSED     Detenido por usuario. Enjambre a mitad del entrenamiento.
           Configuración bloqueada. Fronteras muestran el estado actual.

CONVERGED  Todos los modelos en estado terminal. Tabla de ranking visible.
           Configuración editable (con reinicio del enjambre).
```

### 12.2 Transiciones

```
IDLE       → RUNNING:   presionar "Entrenar enjambre"
RUNNING    → PAUSED:    presionar "Detener"
RUNNING    → CONVERGED: todos los modelos terminaron
PAUSED     → RUNNING:   presionar "Continuar" (reanuda desde época actual)
PAUSED     → IDLE:      cambiar config. del módulo o cualquier control de barra global
CONVERGED  → RUNNING:   presionar "Reiniciar" (reinicia enjambre completo desde época 0)
CONVERGED  → IDLE:      cambiar config. del módulo o cualquier control de barra global
cualquier  → IDLE:      cambiar problema, ruido, split o semilla en barra global
```

### 12.3 Etiqueta del botón principal

| Estado | Etiqueta |
|---|---|
| IDLE | "Entrenar enjambre" |
| RUNNING | "Detener" |
| PAUSED | "Continuar" |
| CONVERGED | "Reiniciar" |

### 12.4 Criterios de terminación por modelo

**Convergido**: ambas condiciones se cumplen durante **5 épocas consecutivas**:
```
|J_train[t] − J_train[t−1]| < 1e-4
||∇L||_promedio < 1e-3        // norma media de todos los gradientes
```

**Divergente por explosión**:
```
J_train[t] > J_train[t−1] × 10  AND  J_train[t] > 1e-6
```

**Divergente por colapso numérico**:
```
isNaN(cualquier peso o sesgo)  OR  |cualquier peso| > 1e6
```

**No convergido**: épocas máximas alcanzadas sin cumplir criterio de convergencia ni de divergencia. Se reporta como "no convergido" (distinto de divergente — el modelo simplemente no terminó en el tiempo dado).

El enjambre termina cuando todos los modelos están en alguno de estos tres estados terminales.

---

## 13. LÓGICA DE ANIMACIÓN

### 13.1 Paso de simulación

Por cada llamada a `draw()` se ejecutan `pasos_por_frame` épocas completas:

| Velocidad | pasos_por_frame |
|---|---|
| Lenta | 1 |
| Normal | 5 |
| Rápida | 25 |

La velocidad puede cambiar en cualquier momento durante RUNNING sin interrumpir la animación.

Por cada época, para cada modelo en estado 'activo':

```
1. Forward pass completo sobre datosTrain
   (con dropout si módulo Dropout y p > 0)
2. Calcular J_train
3. Backpropagation — gradientes ∂L/∂W y ∂L/∂b para todas las capas
4. Actualizar velocidades y pesos (SGD + momentum β=0.9):
     v_W ← β·v_W + η·∂L/∂W
     W   ← W − v_W
     v_b ← β·v_b + η·∂L/∂b
     b   ← b − v_b
5. Calcular J_test (sin dropout) y accuracy_test sobre datosTest
6. Guardar {epoca, J_train, J_test, accuracy_test} en historial
7. Verificar criterios de convergencia, divergencia y límite de épocas
   Si terminal: actualizar estado del modelo
```

### 13.2 Actualización de paneles por frame

Tras cada bloque de `pasos_por_frame`:
- **Panel 1**: redibujar fronteras de todos los modelos. Recalcular mapa de predicción del modelo de referencia según frecuencia de velocidad (§7.2).
- **Panel 2**: extender todas las curvas hasta la época actual.
- **Panel 3**: actualizar círculos del enjambre (estado y J_train en tooltip).
- **Panel 4**: actualizar tarjetas de métricas con modelos ya terminados.

---

## 14. CÁLCULOS MATEMÁTICOS

### 14.1 Forward pass

```
a[0] = x  (entrada normalizada)

Para l = 1, ..., L−1 (capas ocultas):
  z[l] = W[l] · a[l−1] + b[l]
  a[l] = f_act(z[l])
  Si dropout activo: a[l] = a[l] ⊙ máscara / (1−p)

Capa de salida:
  z[L] = W[L] · a[L−1] + b[L]
  ŷ = sigmoid(z[L])   // clasificación
  ŷ = z[L]            // regresión
```

### 14.2 Backpropagation

**Capa de salida** (gradiente idéntico para BCE y MSE con esta formulación):
```
δ[L] = ŷ − y
∂L/∂W[L] = (1/n) · δ[L] · a[L−1]ᵀ
∂L/∂b[L] = (1/n) · Σ δ[L]
```

**Capas ocultas** (l = L−1, ..., 1):
```
δ[l] = (W[l+1]ᵀ · δ[l+1]) ⊙ f'_act(z[l])
∂L/∂W[l] = (1/n) · δ[l] · a[l−1]ᵀ
∂L/∂b[l] = (1/n) · Σ δ[l]
```

### 14.3 Derivadas de activaciones

```
ReLU':       1 si z > 0, 0 si z ≤ 0
Sigmoid':    σ(z)·(1 − σ(z))
Tanh':       1 − tanh²(z)
Lineal':     1
LeakyReLU':  1 si z > 0, 0.01 si z ≤ 0
```

### 14.4 Accuracy (solo clasificación)

```
ŷ_clase = 1 si ŷ ≥ 0.5, 0 si ŷ < 0.5
accuracy_test = (1/n_test) · Σ 1[ŷ_clase[i] = y_test[i]]
```

---

## 15. ESTRUCTURA DE DATOS GLOBAL

```javascript
// Configuración global
problema:          'espiral'|'circulos'|'xor'|'medialuna'|'seno'
nivelRuido:        number            // 0..50
trainRatio:        number            // 0.6..0.9
semillaDatos:      number            // entero, visible en barra global
esTipoClasif:      boolean           // true = BCE, false = MSE

// Datos (generados con semillaDatos)
datosTrain:        Array<{x: number[], y: number}>
datosTest:         Array<{x: number[], y: number}>

// Módulo activo
moduloActivo:      'eta'|'init'|'activacion'|'momentum'|'topologia'

// Estado
estado:            'IDLE'|'RUNNING'|'PAUSED'|'CONVERGED'
epoca:             number            // épocas completadas
velocidad:         'lenta'|'normal'|'rapida'
maximoEpocas:      number            // 50..1000
mostrarCurvasTest: boolean

// Enjambre
modelos: Array<{
  id:              number,
  etiqueta:        string,           // ej. "η=0.05", "Xavier·s1", "ReLU"
  color:           p5.Color,
  capas:           number[],         // ej. [2,4,1]
  activacion:      string,
  eta:             number,
  dropout:         number,           // 0 si no aplica
  pesos:           Float32Array[],   // W aplanado por capa
  sesgos:          Float32Array[],   // b por capa
  velPesos:        Float32Array[],   // v_W para momentum
  velSesgos:       Float32Array[],   // v_b para momentum
  historial:       Array<{epoca, J_train, J_test, accuracy_test}>,
  estado:          'activo'|'convergido'|'divergente'|'no_convergido',
  epocaFinal:      number|null,
  contadorConv:    number            // épocas consecutivas con criterio cumplido
}>

modeloReferencia:    number          // índice en modelos[], fondo del Panel 1
modeloSeleccionado:  number|null
modeloHover:         number|null

// Notificación
notificacion: { texto: string, frameInicio: number, duracion: number }
```

---

## 16. NOTAS TÉCNICAS

- **p5.js**: `setup()`, `draw()`, `mousePressed()`, `mouseMoved()`
- **Red neuronal**: implementada en JavaScript puro con `Float32Array`. Sin librerías de ML — el código es legible y auditable.
- **Mapa de predicción**: renderizar en `createGraphics()` de 50×50 celdas. Solo del `modeloReferencia`. Solo en las épocas indicadas por la frecuencia de velocidad. Nunca en cada frame de `draw()`.
- **Fronteras de decisión**: calcular sobre la misma grilla 50×50 para todos los modelos. Reutilizar la grilla del mapa de predicción.
- **Hover cruzado**: `mouseMoved()` detecta qué curva o frontera está bajo el cursor y actualiza `modeloHover`. Ambos paneles consultan esta variable en `draw()`.
- **Separación de responsabilidades**: funciones de cálculo matemático sin efectos secundarios; funciones de renderizado que no modifican el estado; máquina de estados como única fuente de verdad.
- **Colores**: todas las paletas definidas como constantes al inicio. Ningún color se calcula en `draw()`.

---

## 17. NOTAS DE OPTIMIZACIÓN (versión futura)

Registradas para referencia, no activas en v1.1:

- **Momentum como módulo**: sexta pestaña, η y arquitectura fijos, β variable en {0.0, 0.3, 0.6, 0.9}
- **Semilla de pesos editable**: input numérico para reproducir experimentos exactos
- **Curva de sensibilidad en Panel 4**: gráfica de puntos (hiperparámetro, J_test_final) como complemento del histograma
- **Más datasets**: función escalón, datos reales simples (iris reducido a 2D)
- **Exportar experimento**: configuración + historial en JSON descargable
- **Backend Python/PyTorch**: para redes más grandes o métricas costosas (FIM, RLCT)
