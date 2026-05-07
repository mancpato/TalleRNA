# TalleRNA

Visualizador interactivo de enjambres de redes neuronales para uso educativo.
Desarrollado en el Departamento Académico de Sistemas Computacionales (DASC),
Universidad Autónoma de Baja California Sur (UABCS).

## Descripción

TalleRNA permite explorar cómo los hiperparámetros afectan el entrenamiento
de múltiples redes neuronales simultáneamente. El usuario configura un rango
de valores para un hiperparámetro, lanza un enjambre de modelos y observa
en tiempo real cómo evolucionan las fronteras de decisión, la pérdida y el
rendimiento de cada modelo.

## Uso

Abrir `TalleRNA.html` directamente en el navegador. No requiere instalación
ni servidor. Solo depende de p5.js (cargado vía CDN).

## Interfaz

| Panel | Contenido |
|-------|-----------|
| 1 — Espacio de salida | Mapa de predicción y fronteras de decisión del enjambre |
| 2 — Historial de pérdida | Curvas J_train y J_test por modelo en tiempo real |
| 3 — Controles del módulo | Hiperparámetros del módulo activo y estado del enjambre |
| 4 — Estadísticas | Resumen de convergencia y mejor modelo al terminar |

## Módulos (pestañas)

- **Tasa de aprendizaje**: compara N modelos con η distribuido en [η_min, η_max]
- **Inicialización**: *(próximamente)*
- **Activación**: *(próximamente)*
- **Dropout**: *(próximamente)*
- **Topología**: *(próximamente)*

## Problemas disponibles

Espiral · Círculos · XOR · Media luna · Seno (regresión)

## Arquitectura base

Red 2→4→1, activación ReLU, optimizador SGD con momento.
Toda la aleatoriedad usa un generador LCG con semilla explícita
para garantizar reproducibilidad entre sesiones.

## Autor

M.A. Norzagaray Cosío — DASC/UABCS