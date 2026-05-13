/**
 * TalleRNA: Taller de Redes Neuronales Artificiales
 * 
 * @file: interaccion.js
 * @description: Maneja la interacción del usuario, la máquina de estados y el control del enjambre de modelos.
 * @author: Manuel Cáceres
 * @since: abril de 2026
 * 
 * Lógica para la interacción del usuario con la interfaz, incluyendo 
 * la selección de modelos, visualización de fronteras y curvas de 
 * aprendizaje. Se define la máquina de estados para controlar el flujo del 
 * entrenamiento y las funciones para generar y actualizar los modelos. 
 * La función notificar() se utiliza para mostrar mensajes al usuario sobre 
 * eventos importantes como el inicio del entrenamiento, la convergencia de 
 * un modelo o errores.
 * 
 * Contiene:
 *  - Máquina de estados, (IDLE, RUNNING, PAUSED, CONVERGED)
 *  - Interacción del mouse para selección y hover
 *  - Generación y control del enjambre de modelos, incluyendo la función
 *    generarEnjambreEta() para crear modelos con distintas tasas de aprendizaje.
 * 
 */

// ============================================================================
// MÁQUINA DE ESTADOS
// ============================================================================

function transicionar(nuevoEstado) 
{
  if (nuevoEstado !== estado) {
    console.log(`[Estado] ${estado} → ${nuevoEstado}`);
    estado = nuevoEstado;
  }
}

function enEstado(...estados) 
{
  return estados.includes(estado);
}

function iniciarEntrenamiento() 
{
  console.log('[Transición] iniciarEntrenamiento()');
  if (modelos && modelos.length > 0) {
    const vals = modelos.map(m => {
      if (m.historial && m.historial.length > 0) 
        return m.historial[0].J_train;
      return 1.0;
    });
    J_max_epoca0 = Math.max(...vals, 0.01);
  } else 
    J_max_epoca0 = 1.0;

  let mejorJ = Infinity, mejorRef = 0;
  for (let i = 0; i < modelos.length; i++) {
    const h0 = modelos[i].historial;
    if (h0 && h0.length > 0 && h0[0].J_test < mejorJ) {
      mejorJ = h0[0].J_test;
      mejorRef = i;
    }
  }
  modeloReferencia = mejorRef;
  transicionar('RUNNING');
  actualizarUIEstado();
}

function detener() 
{
  console.log('[Transición] detener()');
  transicionar('PAUSED');
  actualizarUIEstado();
}

function continuar() 
{
  console.log('[Transición] continuar()');
  transicionar('RUNNING');
  actualizarUIEstado();
}

function converger() 
{
  console.log('[Transición] converger()');
  transicionar('CONVERGED');
  actualizarUIEstado();
}

function reiniciar()
{
  console.log('[Transición] reiniciar()');
  transicionar('IDLE');
  actualizarUIEstado();
  modeloReferencia = null;
  distribucionSeleccionada = null;
  initEnjambre();
}

function resetear()
{
  console.log('[Transición] resetear()');
  transicionar('IDLE');
  actualizarUIEstado();
  modeloReferencia = null;
  distribucionSeleccionada = null;
  initEnjambre();
}

function notificar(texto) 
{
  notificacion = {
    texto: texto,
    frameInicio: frameCount,
    duracion: 120
  };
  console.log(`[Notificación] ${texto}`);
}

// ============================================================================
// INTERACCIÓN DEL MOUSE
// ============================================================================

function _distMinFrontera(puntos) 
{
  let minDist = Infinity;
  for (const pt of puntos) {
    const { px, py } = dataToPanel1(pt.x1, pt.x2);
    const d = Math.hypot(mouseX - px, mouseY - py);
    if (d < minDist) 
      minDist = d;
  }
  return minDist;
}

function mousePressed(event) 
{
  const y = 0;
  const h = TAB_HEIGHT;
  const pestanas = ['eta', 'init', 'activacion', 'dropout', 'topologia'];
  const ancho_pestaña = 140;
  let x = 8;

  for (let i = 0; i < pestanas.length; i++) {
    if (mouseX > x && mouseX < x + ancho_pestaña && mouseY > y && mouseY < y + h) {
      moduloActivo = pestanas[i];
      actualizarModuloOverlay();
      resetear();
      break;
    }
    x += ancho_pestaña + 2;
  }

  if (modelos && modelos.length > 0) {
    const r3c = panelRect(3);

    if (moduloActivo === 'init') {
      // Click en nombre de distribución → selección grupal
      for (const zona of (_gruposHitAreas || [])) {
        if (mouseX >= zona.x && mouseX <= zona.x + zona.w &&
            mouseY >= zona.y && mouseY <= zona.y + zona.h) {
          distribucionSeleccionada =
            distribucionSeleccionada === zona.dist ? null : zona.dist;
          modeloSeleccionado = null;
          return;
        }
      }

      const DISTS = ['uniforme', 'normal', 'xavier', 'he'];
      const gruposAct = DISTS.filter(d =>
        modelos.some(m => m.etiqueta.startsWith(d)));
      const S = semillasPorDist;
      const anchoGrupo = 34 * (S - 1) + 14;
      const anchoTotal = gruposAct.length * anchoGrupo + (gruposAct.length - 1) * 48;
      let gx = r3c.x + (r3c.w - anchoTotal) / 2;
      const cirY_i = r3c.y + r3c.h - 36;

      let clickado = false;
      for (const dist of gruposAct) {
        if (clickado) break;
        const mdist = modelos.filter(m => m.etiqueta.startsWith(dist));
        for (let s = 0; s < mdist.length; s++) {
          const cx = gx + s * 34;
          if (Math.hypot(mouseX - cx, mouseY - cirY_i) <= 14) {
            distribucionSeleccionada = null;
            const idx = modelos.indexOf(mdist[s]);
            modeloSeleccionado = (modeloSeleccionado === idx) ? null : idx;
            if (modeloSeleccionado !== null) {
              modeloMapa = modelos[idx];
              renderizarMapa(modeloMapa);
            }
            clickado = true;
            break;
          }
        }
        gx += anchoGrupo + 48;
      }
    } else {
      const DIAM_C = 10, SEP_C = 48;
      const totalW_C = modelos.length * SEP_C - (SEP_C - DIAM_C);
      const cirX0_C  = r3c.x + (r3c.w - totalW_C) / 2;
      const cirY_C   = r3c.y + r3c.h - 40;
      const HIT_R    = 14;

      for (let i = 0; i < modelos.length; i++) {
        const cx = cirX0_C + i * SEP_C;
        if (Math.hypot(mouseX - cx, mouseY - cirY_C) <= HIT_R) {
          modeloSeleccionado = (modeloSeleccionado === i) ? null : i;
          if (modeloSeleccionado !== null) {
            modeloMapa = modelos[modeloSeleccionado];
            renderizarMapa(modeloMapa);
          }
          break;
        }
      }
    }
  }

  const r1 = panelRect(1);
  if (mouseX >= r1.x && mouseX <= r1.x + r1.w && mouseY >= r1.y && mouseY <= r1.y + r1.h) {
    let mejorIdx = null;
    let mejorDist = Infinity;
    for (let i = 0; i < modelos.length; i++) {
      if (!modelos[i].frontera || modelos[i].frontera.length === 0) 
        continue;
      const d = _distMinFrontera(modelos[i].frontera);
      if (d < 8 && d < mejorDist) { 
        mejorDist = d; 
        mejorIdx = i; 
      }
    }

    if (mejorIdx !== null) {
      modeloSeleccionado = mejorIdx;
      modeloMapa = modelos[mejorIdx];
      renderizarMapa(modeloMapa);
    } else {
      modeloSeleccionado = null;
      distribucionSeleccionada = null;
    }
  }

  {
    const r2 = panelRect(2);
    const BTN_W = 44, BTN_H = 18, GAP = 6;
    const bY2      = r2.y + 5;
    const bX_J2    = r2.x + r2.w - 10 - BTN_W;
    const bX_Test2 = bX_J2 - GAP - BTN_W;
    const bX_Lin2  = bX_Test2 - GAP - BTN_W;
    if (mouseY >= bY2 && mouseY <= bY2 + BTN_H) {
      if (mouseX >= bX_Lin2 && mouseX <= bX_Lin2 + BTN_W) 
        modoLogPanel2 = !modoLogPanel2;
      if (mouseX >= bX_Test2 && mouseX <= bX_Test2 + BTN_W) 
        mostrarCurvasTest = !mostrarCurvasTest;
      if (esTipoClasif && mouseX >= bX_J2 && mouseX <= bX_J2 + BTN_W) 
        modoAccPanel2 = !modoAccPanel2;
    }
  }

  {
    const r2 = panelRect(2);
    if (mouseX >= r2.x && mouseX <= r2.x + r2.w && mouseY >= r2.y && mouseY <= r2.y + r2.h) {
      const plot = _panel2PlotArea();
      if (modelos && modelos.length > 0) {
        const campo = modoAccPanel2 ? 'accuracy_test' : 'J_train';
        const { yMin: ym2, yMax: yx2 } = _calcularRangoY();
        let mejorIdx = null, mejorDist = 10;
        for (let i = 0; i < modelos.length; i++) {
          const m = modelos[i];
          if (!m.historial || m.historial.length < 2) 
            continue;
          for (let ep = 0; ep < m.historial.length; ep++) {
            const val = m.historial[ep][campo];
            if (val === undefined || val === null) 
              continue;
            const cx = _epToX(ep, maximoEpocas, plot);
            const cy = _valToY(val, plot, ym2, yx2);
            const d = Math.hypot(mouseX - cx, mouseY - cy);
            if (d < mejorDist) { 
                mejorDist = d; 
                mejorIdx = i; 
            }
          }
        }
        if (mejorIdx !== null) {
          modeloSeleccionado = mejorIdx;
          modeloMapa = modelos[mejorIdx];
          renderizarMapa(modeloMapa);
        }
      }
    }
  }

  if (event && event.target && event.target.tagName === 'CANVAS') 
    return false; // Evita interpretar el clic como un evento de dibujo
}

function mouseMoved() 
{
  const r1 = panelRect(1);
  if (mouseX >= r1.x && mouseX <= r1.x + r1.w && mouseY >= r1.y && mouseY <= r1.y + r1.h) {
    let mejorIdx = null;
    let mejorDist = Infinity;
    for (let i = 0; i < modelos.length; i++) {
      if (!modelos[i].frontera || modelos[i].frontera.length === 0) 
        continue;
      const d = _distMinFrontera(modelos[i].frontera);
      if (d < 8 && d < mejorDist) { 
        mejorDist = d; 
        mejorIdx = i; 
    }
    }
    modeloHover = mejorIdx;
  } else {
    const r2 = panelRect(2);
    if (mouseX >= r2.x && mouseX <= r2.x + r2.w && mouseY >= r2.y && mouseY <= r2.y + r2.h) {
      const plot = _panel2PlotArea();
      const campo = modoAccPanel2 ? 'accuracy_test' : 'J_train';
      const { yMin: ym3, yMax: yx3 } = _calcularRangoY();
      let mejorIdx = null, mejorDist = 12;
      if (modelos) {
        for (let i = 0; i < modelos.length; i++) {
          const m = modelos[i];
          if (!m.historial || m.historial.length < 2) 
            continue;
          for (let ep = 0; ep < m.historial.length; ep++) {
            const val = m.historial[ep][campo];
            if (val === undefined || val === null) 
              continue;
            const cx = _epToX(ep, maximoEpocas, plot);
            const cy = _valToY(val, plot, ym3, yx3);
            const d = Math.hypot(mouseX - cx, mouseY - cy);
            if (d < mejorDist) { 
                mejorDist = d; 
                mejorIdx = i; 
            }
          }
        }
      }
      modeloHover = mejorIdx;
    } else 
      modeloHover = null;
  }
}

// ============================================================================
// GENERACIÓN Y CONTROL DEL ENJAMBRE
// ============================================================================

function generarEnjambreEta(etaMin, etaMax, N) 
{
  modelos = [];
  modeloReferencia  = null;
  modeloSeleccionado = null;
  modeloHover       = null;
  
  J_max_epoca0  = 1.0;
  modoLogPanel2 = false;
  modoAccPanel2 = false;

  const etas = [];
  if (N === 1) 
    etas.push(etaMin);
  else 
    for (let i = 0; i < N; i++)
      etas.push(etaMin + (etaMax - etaMin) * i / (N - 1));

  for (let i = 0; i < etas.length; i++) {
    const eta_i = etas[i];
    const m = crearModelo([2, 4, 1], 'relu', eta_i, 0, semillaDatos + i, 'xavier');
    m.id      = i;
    m.etiqueta = `η=${eta_i.toFixed(3)}`;

    const t = N === 1 ? 0 : i / (N - 1);
    m.color = lerpColor(PALETAS.eta.azulVioleta, PALETAS.eta.naranja, t);

    const grid = calcularGridPrediccion(m, 50);
    m.frontera = calcularFrontera(grid, 50);

    modelos.push(m);
  }

  modeloReferencia = 0;
  modeloMapa = modelos[0];
  renderizarMapa(modelos[0]);
}

function generarEnjambreInit() {
  modelos = [];
  modeloSeleccionado = null;
  modeloHover        = null;
  modeloReferencia   = null;
  J_max_epoca0  = 1.0;
  modoLogPanel2 = false;
  modoAccPanel2 = false;

  for (const dist of distActivas) {
    for (let s = 1; s <= semillasPorDist; s++) {
      const m = crearModelo([2, 4, 1], 'relu', 0.05, 0, s, dist);
      const hex  = COLORES_INIT[dist];
      const alfa = OPACIDADES_INIT[s - 1];
      m.color    = color(
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16),
        alfa
      );
      m.etiqueta = `${dist}·s${s}`;
      const grid = calcularGridPrediccion(m, 50);
      m.frontera = calcularFrontera(grid, 50);
      modelos.push(m);
    }
  }

  if (modelos.length > 0) {
    modeloReferencia = 0;
    modeloMapa = modelos[0];
    renderizarMapa(modelos[0]);
  }
  console.log('[Enjambre Init] modelos:', modelos.length,
    modelos.map(m => m.etiqueta));
}

function initEnjambre()
{
  if (moduloActivo === 'eta')
    generarEnjambreEta(etaMinVal, etaMaxVal, nModelosEta);
  else if (moduloActivo === 'init')
    generarEnjambreInit();
}

function pasosPorFrame() 
{
  if (velocidad === 'lenta')  
    return 1;
  if (velocidad === 'rapida') 
    return 25;
  return 5; 
}

function stepModelo(m) 
{
  if (m.estado !== 'activo') 
    return;

  const J_ant = m.historial.length > 0
    ? m.historial[m.historial.length - 1].J_train
    : Infinity;

  entrenarEpoca(m, datosTrain);

  const { diverge } = verificarDivergencia(m, J_ant);
  if (diverge) {
    const grid = calcularGridPrediccion(m, 50);
    m.frontera = calcularFrontera(grid, 50);
    m.estado = 'divergente';
    return;
  }

  if (m.historial.length >= maximoEpocas) {
    const grid = calcularGridPrediccion(m, 50);
    m.frontera = calcularFrontera(grid, 50);
    m.estado = 'no_convergido';
    return;
  }

  if (verificarConvergencia(m)) {
    const grid = calcularGridPrediccion(m, 50);
    m.frontera = calcularFrontera(grid, 50);
    m.estado = 'convergido';
    m.epocaFinal = m.historial.length;
  }
}