// ============================================================================
// FUNCIONES DE LAYOUT
// ============================================================================

function panelRect(id) {
  const areaX = 0;
  const areaY = TOOLBAR_HEIGHT + TAB_HEIGHT;
  const areaW = windowWidth;
  const areaH = windowHeight - TOOLBAR_HEIGHT - TAB_HEIGHT;

  const filaAlturaSuper = areaH * VERTICAL_RATIO;
  const filaAlturaInf = areaH * (1 - VERTICAL_RATIO);
  const colAncho = areaW * HORIZONTAL_RATIO;

  switch (id) {
    case 1: return { x: areaX, y: areaY, w: colAncho, h: filaAlturaSuper };
    case 2: return { x: areaX + colAncho, y: areaY, w: areaW - colAncho, h: filaAlturaSuper };
    case 3: return { x: areaX, y: areaY + filaAlturaSuper, w: colAncho, h: filaAlturaInf };
    case 4: return { x: areaX + colAncho, y: areaY + filaAlturaSuper, w: areaW - colAncho, h: filaAlturaInf };
  }
  return null;
}

function panelCoords(id, xNorm, yNorm) {
  const r = panelRect(id);
  return {
    px: r.x + xNorm * r.w,
    py: r.y + yNorm * r.h
  };
}

// ============================================================================
// DIBUJO DE INTERFAZ BÁSICA
// ============================================================================

function dibujarBarraGlobal() {
  const h = TOOLBAR_HEIGHT;
  fill(245, 245, 245);
  stroke(200);
  strokeWeight(1);
  rect(0, 0, windowWidth, h);

  /* textAlign(CENTER, CENTER);
  textSize(22);
  fill(60);    text('Taller', windowWidth/2 - textWidth('RNA')/2 - textWidth('Taller')/2, TOOLBAR_HEIGHT/2);
  fill(123, 82, 212);  text('RNA', windowWidth/2 + textWidth('Taller')/2 - textWidth('RNA')/2, TOOLBAR_HEIGHT/2); */

  fill(100); textSize(12); textAlign(RIGHT, CENTER);
  text('2→4→1 · ReLU · SGD+mom', windowWidth - 12, h / 2);
}

function dibujarPestanas() {
  const y = TOOLBAR_HEIGHT;
  const h = TAB_HEIGHT;
  const pestanas = [
    { label: 'Tasa de aprendizaje', id: 'eta' },
    { label: 'Inicialización', id: 'init' },
    { label: 'Activación', id: 'activacion' },
    { label: 'Dropout', id: 'dropout' },
    { label: 'Topología', id: 'topologia' }
  ];

  let x = 8;
  const ancho_pestaña = 140;

  for (let i = 0; i < pestanas.length; i++) {
    const p = pestanas[i];
    const esActiva = p.id === moduloActivo;

    if (esActiva) fill(200, 200, 255);
    else fill(230, 230, 230);

    stroke(150); strokeWeight(1);
    rect(x, y, ancho_pestaña, h);

    fill(0); textSize(12); textAlign(CENTER, CENTER);
    text(p.label, x + ancho_pestaña / 2, y + h / 2);
    x += ancho_pestaña + 2;
  }
}

function dibujarPaneles() {
  dibujarPanel(1, 'PANEL 1: Espacio de salida', panelRect(1));
  dibujarPanel(2, 'PANEL 2: Historial de pérdida', panelRect(2));
  dibujarPanel(3, 'PANEL 3: Controles del módulo', panelRect(3));
  dibujarPanel(4, 'PANEL 4: Estadísticas', panelRect(4));
}

function dibujarPanel(id, titulo, r) {
  fill(PANEL_BG);
  stroke(BORDER_COLOR);
  strokeWeight(BORDER_WIDTH);
  rectMode(CORNER);
  rect(r.x, r.y, r.w, r.h);

  fill(100); textSize(11); textAlign(LEFT, TOP);
  text(titulo, r.x + 8, r.y + 6);

  if (id === 1 && datosTrain && datosTest) {
    const total = datosTrain.length + datosTest.length;
    const train = datosTrain.length;
    textSize(12); fill(120); textAlign(RIGHT, TOP);
    text(`n=${total}  train=${train}`,
         r.x + r.w - 80,
         r.y + 7);
  }

  stroke(BORDER_COLOR); strokeWeight(BORDER_WIDTH);
  line(r.x, r.y + 24, r.x + r.w, r.y + 24);
}

function dibujarControlesPanel3() {
  if (!modelos || modelos.length === 0) return;

  const r3 = panelRect(3);
  const DIAM   = 10;
  const SEP    = 48;   
  const totalW = modelos.length * SEP - (SEP - DIAM);
  const cirX0  = r3.x + (r3.w - totalW) / 2;
  const cirY   = r3.y + r3.h - 40; 

  for (let i = 0; i < modelos.length; i++) {
    const m  = modelos[i];
    const cx = cirX0 + i * SEP;
    const c  = m.color;

    fill(red(c), green(c), blue(c));
    noStroke();
    ellipse(cx, cirY, DIAM);

    noFill();
    if (m.estado === 'convergido') {
      stroke(46, 204, 113); strokeWeight(2);
      ellipse(cx, cirY, DIAM + 5);
    } else if (m.estado === 'divergente') {
      stroke(226, 75, 74); strokeWeight(2);
      ellipse(cx, cirY, DIAM + 5);
      const d = DIAM * 0.38;
      stroke(226, 75, 74); strokeWeight(1.5);
      line(cx - d, cirY - d, cx + d, cirY + d);
      line(cx + d, cirY - d, cx - d, cirY + d);
    } else if (m.estado === 'no_convergido') {
      stroke(150); strokeWeight(1.5);
      ellipse(cx, cirY, DIAM + 5);
    }

    if (modeloSeleccionado === i) {
      noFill(); stroke(30); strokeWeight(2);
      ellipse(cx, cirY, DIAM + 9);
    } else if (modeloHover === i) {
      noFill(); stroke(100); strokeWeight(1);
      ellipse(cx, cirY, DIAM + 7);
    }

    noStroke(); textSize(12); textAlign(CENTER, BOTTOM);
    if (m.historial && m.historial.length > 0) {
      const ultimo = m.historial[m.historial.length - 1];
      let metrica;
      if (esTipoClasif && ultimo.accuracy_test !== null && ultimo.accuracy_test !== undefined) {
        metrica = (ultimo.accuracy_test * 100).toFixed(0) + '%';
        const acc = ultimo.accuracy_test;
        fill(acc > 0.75 ? color(46, 180, 90) : acc > 0.50 ? color(200, 160, 0) : color(160));
      } else if (ultimo.J_test !== undefined) {
        metrica = 'J=' + ultimo.J_test.toFixed(3);
        fill(120);
      } else {
        metrica = ''; fill(120);
      }
      if (metrica) 
        text(metrica, cx, cirY - DIAM/2 - 8);
    }

    noStroke(); fill(80); textSize(12); textAlign(CENTER, TOP);
    text(m.eta.toFixed(3), cx, cirY + DIAM/2 + 6);
  }
}

function obtenerEtiquetaBotón() {
  switch (estado) {
    case 'IDLE': return '[ Entrenar enjambre ]';
    case 'RUNNING': return '[ Detener ]';
    case 'PAUSED': return '[ Continuar ]';
    case 'CONVERGED': return '[ Reiniciar ]';
    default: return '[ Entrenar enjambre ]';
  }
}

function dibujarNotificacion() {
  const estaActiva = frameCount - notificacion.frameInicio < notificacion.duracion;
  if (!estaActiva) 
    return;

  const r3 = panelRect(3); 
  const margen = 8;
  const x = r3.x + margen; 
  const y = r3.y + r3.h - 105; 
  const w = r3.w - 2 * margen;
  const h = 24;

  fill(255, 248, 225, 0.9 * 255);
  stroke(200, 200, 200);
  strokeWeight(1);
  rectMode(CORNER);
  rect(x, y, w, h, 4);

  fill(85, 85, 85);
  textAlign(LEFT, CENTER);
  textSize(11);
  text(notificacion.texto, x + 8, y + h / 2);
}

// ============================================================================
// PANEL 1: MAPA Y DATOS
// ============================================================================

function calcularGridPrediccion(modelo, resolucion) {
  const n = resolucion;
  const grid = new Float32Array(n * n);
  const batch = [];
  for (let i = 0; i < n; i++) {
    const x2 = 1 - (i / (n - 1)) * 2; 
    for (let j = 0; j < n; j++) {
      const x1 = -1 + (j / (n - 1)) * 2; 
      batch.push([x1, x2]);
    }
  }

  const fwd = forward(modelo, batch, false);
  const salidaCapa = fwd.activaciones[fwd.activaciones.length - 1];
  for (let k = 0; k < n * n; k++) {
    grid[k] = salidaCapa[k][0];
  }
  return grid;
}

function renderizarMapaPrediccion(grid, resolucion) {
  const p = _panel1PlotArea();
  const gfx = createGraphics(Math.floor(p.w), Math.floor(p.h));
  gfx.clear();
  gfx.noStroke();

  const n = resolucion;
  const cellW = p.w / n;
  const cellH = p.h / n;

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const yhat = grid[i * n + j];
      const confianza = Math.abs(yhat - 0.5) * 2;
      const alfa = confianza * 180; 

      if (yhat < 0.5) gfx.fill(75, 139, 190, alfa);
      else gfx.fill(232, 130, 90, alfa);

      const px = j * cellW;
      const py = i * cellH;
      gfx.rect(px, py, cellW + 1, cellH + 1); 
    }
  }
  return gfx;
}

function renderizarMapa(modelo) {
  const grid = calcularGridPrediccion(modelo, 50);
  gfxMapa = renderizarMapaPrediccion(grid, 50);
  fronteraPrueba = calcularFrontera(grid, 50);
}

function dibujarMapaPanel1() {
  if (!gfxMapa) return;
  const p = _panel1PlotArea();
  image(gfxMapa, p.x, p.y, p.w, p.h);
}

function calcularFrontera(gridPrediccion, resolucion) {
  const n = resolucion;
  const puntos = [];
  const idx = (i, j) => i * n + j;
  const toData = (i, j) => ({
    x1: -1 + (j / (n - 1)) * 2,
    x2:  1 - (i / (n - 1)) * 2
  });

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const v = gridPrediccion[idx(i, j)];
      if (j + 1 < n) {
        const vr = gridPrediccion[idx(i, j + 1)];
        if ((v - 0.5) * (vr - 0.5) < 0) {
          const t = (0.5 - v) / (vr - v);
          const a = toData(i, j);
          const b = toData(i, j + 1);
          puntos.push({ x1: a.x1 + t * (b.x1 - a.x1), x2: a.x2 + t * (b.x2 - a.x2) });
        }
      }
      if (i + 1 < n) {
        const vd = gridPrediccion[idx(i + 1, j)];
        if ((v - 0.5) * (vd - 0.5) < 0) {
          const t = (0.5 - v) / (vd - v);
          const a = toData(i, j);
          const b = toData(i + 1, j);
          puntos.push({ x1: a.x1 + t * (b.x1 - a.x1), x2: a.x2 + t * (b.x2 - a.x2) });
        }
      }
    }
  }
  return puntos;
}

function _ordenarFrontera(puntos) {
  if (puntos.length === 0) return puntos;
  let cx = 0, cy = 0;
  for (const p of puntos) { cx += p.x1; cy += p.x2; }
  cx /= puntos.length; cy /= puntos.length;
  return [...puntos].sort((a, b) => {
    const angA = Math.atan2(a.x2 - cy, a.x1 - cx);
    const angB = Math.atan2(b.x2 - cy, b.x1 - cx);
    return angA - angB;
  });
}

function dibujarFronterasPanel1() {
  if (!modelos || modelos.length === 0) return;
  noFill();
  for (let i = 0; i < modelos.length; i++) {
    const m = modelos[i];
    if (!m.frontera || m.frontera.length === 0) continue;

    let grosor, alfa;
    if (modeloSeleccionado === i) { grosor = 3; alfa = 255; }
    else if (modeloHover === i) { grosor = 2.5; alfa = 230; }
    else { grosor = 2; alfa = 180; }

    const c = m.color;
    stroke(red(c), green(c), blue(c), alfa);
    strokeWeight(grosor);

    if (modeloSeleccionado === i) {
      const ordenados = _ordenarFrontera(m.frontera);
      beginShape();
      for (const pt of ordenados) {
        const { px, py } = dataToPanel1(pt.x1, pt.x2);
        vertex(px, py);
      }
      endShape(CLOSE);
    } else {
      for (const pt of m.frontera) {
        const { px, py } = dataToPanel1(pt.x1, pt.x2);
        point(px, py);
      }
    }
  }
}

function _panel1PlotArea() {
  const r = panelRect(1);
  const titleH = 24;
  const innerX = r.x;
  const innerY = r.y + titleH;
  const innerW = r.w;
  const innerH = r.h - titleH;
  const mx = innerW * 0.05;
  const my = innerH * 0.05;
  return {
    x: innerX + mx,
    y: innerY + my,
    w: innerW - 2 * mx,
    h: innerH - 2 * my
  };
}

function dataToPanel1(x1, x2) {
  const p = _panel1PlotArea();
  const px = p.x + (x1 + 1) / 2 * p.w;
  const py = p.y + (1 - (x2 + 1) / 2) * p.h;
  return { px, py };
}

function panel1ToData(px, py) {
  const p = _panel1PlotArea();
  const x1 = (px - p.x) / p.w * 2 - 1;
  const x2 = (1 - (py - p.y) / p.h) * 2 - 1;
  return { x1, x2 };
}

function dibujarDatosPanel1() {
  const COLOR_CLASE = ['#4B8BBE', '#E8825A']; 
  const p = _panel1PlotArea();
  stroke(180);
  strokeWeight(1);

  const { px: ax0 } = dataToPanel1(-1, 0);
  const { px: ax1 } = dataToPanel1(1, 0);
  const { py: ayMid } = dataToPanel1(0, 0);
  line(ax0, ayMid, ax1, ayMid);

  const { py: ay0 } = dataToPanel1(0, -1);
  const { py: ay1 } = dataToPanel1(0, 1);
  const { px: axMid } = dataToPanel1(0, 0);
  line(axMid, ay0, axMid, ay1);

  const TICK_SIZE = 4;
  fill(120); noStroke(); textSize(9); textAlign(CENTER, TOP);

  for (let v = -1; v <= 1.001; v += 0.5) {
    const vr = Math.round(v * 10) / 10; 
    const { px: tx } = dataToPanel1(vr, 0);
    stroke(180); strokeWeight(1);
    line(tx, ayMid - TICK_SIZE, tx, ayMid + TICK_SIZE);
    if (Math.abs(vr) > 0.01) {
      noStroke(); fill(120);
      text(vr.toFixed(1), tx, ayMid + TICK_SIZE + 2);
    }

    const { py: ty } = dataToPanel1(0, vr);
    stroke(180); strokeWeight(1);
    line(axMid - TICK_SIZE, ty, axMid + TICK_SIZE, ty);
    if (Math.abs(vr) > 0.01) {
      noStroke(); fill(120); textAlign(RIGHT, CENTER);
      text(vr.toFixed(1), axMid - TICK_SIZE - 2, ty);
      textAlign(CENTER, TOP);
    }
  }

  fill(80); noStroke(); textSize(10); textAlign(RIGHT, BOTTOM);
  text('x₁', ax1 + 12, ayMid + 4);
  textAlign(LEFT, TOP);
  text('x₂', axMid + 3, ay1 - 14);

  noStroke();
  for (const d of datosTrain) {
    const c = color(COLOR_CLASE[d.y]);
    fill(c);
    const { px, py } = dataToPanel1(d.x[0], d.x[1]);
    circle(px, py, 8); 
  }

  strokeWeight(1.5);
  for (const d of datosTest) {
    const c = color(COLOR_CLASE[d.y]);
    fill(c); stroke(255);
    const { px, py } = dataToPanel1(d.x[0], d.x[1]);
    circle(px, py, 8);
  }

  const pLey = _panel1PlotArea();
  const lx = pLey.x - 6;  
  const ly = pLey.y + pLey.h - 28; 
  const LW = 52, LH = 34;

  fill(20, 20, 20, 150); noStroke();
  rect(lx - 4, ly - 4, LW, LH, 3);

  fill(180); noStroke();
  ellipse(lx + 5, ly + 7, 7);
  fill(255); textSize(9); textAlign(LEFT, CENTER); noStroke();
  text('Train', lx + 13, ly + 7);

  fill(60); stroke(255); strokeWeight(1.5);
  ellipse(lx + 5, ly + 22, 7);
  noStroke(); fill(255); textSize(9); textAlign(LEFT, CENTER);
  text('Test', lx + 13, ly + 22);
}

// ============================================================================
// PANEL 2: HISTORIAL
// ============================================================================

function _panel2PlotArea() {
  const r = panelRect(2);
  const PAD_L = 42, PAD_R = 12, PAD_T = 38, PAD_B = 36;
  return {
    x: r.x + PAD_L,
    y: r.y + PAD_T,
    w: r.w - PAD_L - PAD_R,
    h: r.h - PAD_T - PAD_B
  };
}

function _epToX(ep, totalEpocas, plot) {
  return plot.x + (ep / Math.max(totalEpocas, 1)) * plot.w;
}

function _calcularRangoY() {
  let yMin = Infinity, yMax = -Infinity;
  for (const m of modelos) {
    if (!m.historial || m.historial.length === 0) continue;
    for (const h of m.historial) {
      if (h.J_train !== undefined && isFinite(h.J_train)) {
        if (h.J_train < yMin) yMin = h.J_train;
        if (h.J_train > yMax) yMax = h.J_train;
      }
      if (mostrarCurvasTest && h.J_test !== undefined && isFinite(h.J_test)) {
        if (h.J_test < yMin) yMin = h.J_test;
        if (h.J_test > yMax) yMax = h.J_test;
      }
    }
  }
  if (!isFinite(yMin) || !isFinite(yMax)) {
    return { yMin: 0, yMax: J_max_epoca0 * 1.05 };
  }
  const margen = (yMax - yMin) * 0.05 || 0.01;
  return { yMin: Math.max(0, yMin - margen), yMax: yMax + margen };
}

function _valToY(val, plot, yMin, yMax) {
  if (modoAccPanel2) {
    const v = constrain(val, 0, 1);
    return plot.y + plot.h - v * plot.h;
  }
  if (modoLogPanel2) {
    const vLog   = Math.log10(Math.max(val,  1e-8));
    const minLog = Math.log10(Math.max(yMin, 1e-8));
    const maxLog = Math.log10(Math.max(yMax, 1e-8));
    const rango  = maxLog - minLog || 1;
    const t = (vLog - minLog) / rango;
    return plot.y + plot.h - t * plot.h;
  } else {
    const rango = yMax - yMin || 1;
    return plot.y + plot.h - ((val - yMin) / rango) * plot.h;
  }
}

function dibujarHistorialPanel2() {
  const r = panelRect(2);
  const plot = _panel2PlotArea();

  noStroke(); fill(250);
  rect(plot.x, plot.y, plot.w, plot.h);

  if (!modelos || modelos.length === 0) {
    fill(160); noStroke(); textSize(11); textAlign(CENTER, CENTER);
    text('Sin datos', plot.x + plot.w / 2, plot.y + plot.h / 2);
    _dibujarTogglesPanel2(r, plot);
    return;
  }

  const totalEpocas = maximoEpocas;
  const { yMin, yMax } = _calcularRangoY();

  stroke(220); strokeWeight(0.5);
  const nLineas = 5;
  for (let i = 0; i <= nLineas; i++) {
    const t = i / nLineas;
    const y = plot.y + t * plot.h;
    line(plot.x, y, plot.x + plot.w, y);
  }

  stroke(180); strokeWeight(1);
  line(plot.x, plot.y + plot.h, plot.x + plot.w, plot.y + plot.h);
  line(plot.x, plot.y, plot.x, plot.y + plot.h);

  noStroke(); fill(120); textSize(11); textAlign(RIGHT, CENTER);
  for (let i = 0; i <= nLineas; i++) {
    const val = modoLogPanel2
      ? Math.pow(10, Math.log10(Math.max(yMin, 1e-8)) +
          i * (Math.log10(Math.max(yMax, 1e-8)) - Math.log10(Math.max(yMin, 1e-8))) / nLineas)
      : yMin + (yMax - yMin) * i / nLineas;
    const ty = _valToY(val, plot, yMin, yMax);
    let etiq;
    if (modoAccPanel2) {
      etiq = (val * 100).toFixed(0) + '%';
    } else {
      etiq = val < 0.01 ? val.toExponential(1) : val.toFixed(3);
    }
    text(etiq, plot.x - 3, ty);
  }

  noStroke(); fill(120); textSize(11); textAlign(CENTER, TOP);
  const pasoX = totalEpocas <= 50  ? 10
              : totalEpocas <= 200 ? 25
              : totalEpocas <= 500 ? 50
              : totalEpocas <= 1000 ? 100
              : totalEpocas <= 2000 ? 200
              : 500;
  for (let ep = 0; ep <= totalEpocas; ep += pasoX) {
    const x = _epToX(ep, totalEpocas, plot);
    text(ep, x, plot.y + plot.h + 3);
  }

  if (modeloReferencia !== null) {
    const mRef = modelos[modeloReferencia];
    if (mRef && mRef.historial && mRef.historial.length > 0) {
      const campoRef = modoAccPanel2 ? 'accuracy_test' : 'J_train';
      const ultimoRef = mRef.historial[mRef.historial.length - 1][campoRef];
      if (ultimoRef !== undefined) {
        const yRef = _valToY(ultimoRef, plot, yMin, yMax);
        stroke(200, 200, 200); strokeWeight(1);
        drawingContext.setLineDash([4, 4]);
        line(plot.x, yRef, plot.x + plot.w, yRef);
        drawingContext.setLineDash([]);
        noStroke(); fill(140); textSize(10); textAlign(LEFT, BOTTOM);
        text('J*', plot.x + 2, yRef - 1);
      }
    }
  }

  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(plot.x, plot.y, plot.w, plot.h);
  drawingContext.clip();

  const campo = modoAccPanel2 ? 'accuracy_test' : 'J_train';
  for (let i = 0; i < modelos.length; i++) {
    const m = modelos[i];
    if (!m.historial || m.historial.length < 2) continue;

    const c = m.color;
    let alfa;
    if (modeloSeleccionado === i)   alfa = 255;
    else if (modeloHover === i)     alfa = 200;
    else                            alfa = 60;

    stroke(red(c), green(c), blue(c), alfa);
    strokeWeight(modeloSeleccionado === i ? 2 : 1);
    noFill();

    beginShape();
    for (let ep = 0; ep < m.historial.length; ep++) {
      const val = m.historial[ep][campo];
      if (val === undefined || val === null) continue;
      const x = _epToX(ep, totalEpocas, plot);
      const y = _valToY(val, plot, yMin, yMax);
      vertex(x, y);
    }
    endShape();
  }

  if (mostrarCurvasTest) {
    const campoTest = modoAccPanel2 ? 'accuracy_test' : 'J_test';
    for (let i = 0; i < modelos.length; i++) {
      const m = modelos[i];
      if (!m.historial || m.historial.length < 2) continue;
      const c = m.color;
      let alfa = modeloSeleccionado === i ? 200 : modeloHover === i ? 140 : 40;
      stroke(red(c), green(c), blue(c), alfa);
      strokeWeight(1);
      noFill();
      drawingContext.setLineDash([3, 3]);
      beginShape();
      for (let ep = 0; ep < m.historial.length; ep++) {
        const val = m.historial[ep][campoTest];
        if (val === undefined || val === null) continue;
        const x = _epToX(ep, totalEpocas, plot);
        const y = _valToY(val, plot, yMin, yMax);
        vertex(x, y);
      }
      endShape();
      drawingContext.setLineDash([]);
    }
  }

  drawingContext.restore();
  _dibujarTogglesPanel2(r, plot);
}

function _dibujarTogglesPanel2(r, plot) {
  const BTN_W = 44, BTN_H = 18, GAP = 6;
  const bY      = r.y + 5;
  const bX_J    = r.x + r.w - 10 - BTN_W;
  const bX_Test = bX_J - GAP - BTN_W;
  const bX_Lin  = bX_Test - GAP - BTN_W;

  fill(modoLogPanel2 ? 180 : 230); stroke(150); strokeWeight(1);
  rect(bX_Lin, bY, BTN_W, BTN_H, 2);
  noStroke(); fill(40); textSize(10); textAlign(CENTER, CENTER);
  text(modoLogPanel2 ? 'Log' : 'Lin', bX_Lin + BTN_W / 2, bY + BTN_H / 2);

  fill(mostrarCurvasTest ? 180 : 230); stroke(150); strokeWeight(1);
  rect(bX_Test, bY, BTN_W, BTN_H, 2);
  noStroke(); fill(40); textSize(10); textAlign(CENTER, CENTER);
  text('Test', bX_Test + BTN_W / 2, bY + BTN_H / 2);

  if (esTipoClasif) {
    fill(modoAccPanel2 ? 180 : 230); stroke(150); strokeWeight(1);
    rect(bX_J, bY, BTN_W, BTN_H, 2);
    noStroke(); fill(40); textSize(10); textAlign(CENTER, CENTER);
    text(modoAccPanel2 ? 'Acc' : 'J', bX_J + BTN_W / 2, bY + BTN_H / 2);
  }
}

// ============================================================================
// PANEL 4: RESUMEN Y ESTADÍSTICAS
// ============================================================================

function dibujarResumenPanel4() {
  if (!modelos || modelos.length === 0) return;
  const r = panelRect(4);
  const x = r.x + 14;
  let y = r.y + 36;
  const lineH = 18;

  const conv   = modelos.filter(m => m.estado === 'convergido').length;
  const div    = modelos.filter(m => m.estado === 'divergente').length;
  const noconv = modelos.filter(m => m.estado === 'no_convergido').length;
  const activ  = modelos.filter(m => m.estado === 'activo').length;
  const total  = modelos.length;

  textSize(11); textAlign(LEFT, TOP); noStroke();

  fill(60);
  text(`Enjambre: ${total} modelos`, x, y); y += lineH * 1.4;

  fill(46, 180, 90);
  text(`✓ Aprendizaje exitoso: ${conv}`, x, y); y += lineH;
  fill(200, 60, 60);
  text(`✗ Divergentes:    ${div}`, x, y); y += lineH;
  fill(140);
  text(`— No convergidos: ${noconv}`, x, y); y += lineH;

  if (activ > 0) {
    fill(80, 120, 200);
    text(`… Entrenando:     ${activ}`, x, y); y += lineH;
  }

  if (!enEstado('IDLE') && conv + div + noconv > 0) {
    y += lineH * 0.5;
    let mejorJ = Infinity, mejorEta = null;
    for (const m of modelos) {
      if (m.historial && m.historial.length > 0) {
        const jt = m.historial[m.historial.length - 1].J_test;
        if (jt !== undefined && jt < mejorJ) {
          mejorJ = jt;
          mejorEta = m.etiqueta;
        }
      }
    }
    if (isFinite(mejorJ)) {
      fill(60);
      text(`Mejor J_test: ${mejorJ.toFixed(4)}`, x, y); y += lineH;
      fill(100);
      text(`  → ${mejorEta}`, x, y);
    }
  }
}

// ============================================================================
// CONSTRUCCIÓN DE DOM OVERLAYS
// ============================================================================

function crearOverlayPanel3() {
  let overlay = document.getElementById('panel3-overlay');
  if (overlay) overlay.remove();

  overlay = document.createElement('div');
  overlay.id = 'panel3-overlay';
  overlay.innerHTML = `
    <button id="btn-principal">Entrenar enjambre</button>
    <hr class="p3-sep">
    <div class="p3-row">
      <label>Épocas máx.:&nbsp;<input type="number" id="input-epocas"
        min="50" max="5000" step="50" value="200" style="width:56px"></label>
      <label style="margin-left:10px">Velocidad:&nbsp;<select id="select-velocidad">
        <option value="lenta">Lenta</option>
        <option value="normal" selected>Normal</option>
        <option value="rapida">Rápida</option>
      </select></label>
    </div>
    <hr class="p3-sep">
    <div class="p3-row">
      <label>η mín.:&nbsp;<input type="range" id="slider-eta-min" style="width:110px"></label>
      <span id="val-eta-min" style="margin-left:6px;min-width:38px">0.010</span>
    </div>
    <div class="p3-row" style="margin-top:2px">
      <label>η máx.:&nbsp;<input type="range" id="slider-eta-max" style="width:110px"></label>
      <span id="val-eta-max" style="margin-left:6px;min-width:38px">0.300</span>
    </div>
    <div class="p3-row" style="margin-top:4px">
      Modelos:&nbsp;
      <label><input type="radio" name="nmodelos" value="4">&nbsp;4</label>&nbsp;&nbsp;
      <label><input type="radio" name="nmodelos" value="6" checked>&nbsp;6</label>&nbsp;&nbsp;
      <label><input type="radio" name="nmodelos" value="8">&nbsp;8</label>&nbsp;&nbsp;
      <label><input type="radio" name="nmodelos" value="10">&nbsp;10</label>
    </div>
  `;
  document.body.appendChild(overlay);

  const SL_MIN  = Math.log10(0.001);   
  const SL_MAX  = Math.log10(0.5);     
  const SL_STEP = 'any';

  const slMin = document.getElementById('slider-eta-min');
  const slMax = document.getElementById('slider-eta-max');
  slMin.min = SL_MIN; slMin.max = SL_MAX; slMin.step = SL_STEP;
  slMax.min = SL_MIN; slMax.max = SL_MAX; slMax.step = SL_STEP;
  slMin.value = Math.log10(etaMinVal);
  slMax.value = Math.log10(etaMaxVal);

  document.getElementById('btn-principal').addEventListener('click', () => {
    if      (enEstado('IDLE'))      iniciarEntrenamiento();
    else if (enEstado('RUNNING'))   detener();
    else if (enEstado('PAUSED'))    continuar();
    else if (enEstado('CONVERGED')) reiniciar();
  });

  document.getElementById('input-epocas').addEventListener('change', e => {
    const v = parseInt(e.target.value);
    if (!isNaN(v)) maximoEpocas = Math.max(50, Math.min(5000, v));
  });

  document.getElementById('select-velocidad').addEventListener('change', e => {
    velocidad = e.target.value;
  });

  document.getElementById('slider-eta-min').addEventListener('input', e => {
    let vMin = Math.pow(10, parseFloat(e.target.value));
    if (vMin > 0.498) vMin = 0.500;
    etaMinVal = vMin;
    document.getElementById('val-eta-min').textContent = vMin.toFixed(3);
    clearTimeout(_debounceEta);
    _debounceEta = setTimeout(() => resetear(), 300);
  });

  document.getElementById('slider-eta-max').addEventListener('input', e => {
    let vMax = Math.pow(10, parseFloat(e.target.value));
    if (vMax > 0.498) vMax = 0.500;
    etaMaxVal = vMax;
    document.getElementById('val-eta-max').textContent = vMax.toFixed(3);
    clearTimeout(_debounceEta);
    _debounceEta = setTimeout(() => resetear(), 300);
  });

  document.querySelectorAll('input[name="nmodelos"]').forEach(r => {
    r.addEventListener('change', () => {
      nModelosEta = parseInt(r.value);
      resetear();
    });
  });

  posicionarOverlayPanel3();
}

function crearOverlayBarra() {
  const div = document.createElement('div');
  div.id = 'barra-overlay';
  div.innerHTML = `
    <label>Problema:
      <select id="select-problema">
        <option value="espiral">espiral</option>
        <option value="circulos">círculos</option>
        <option value="xor" selected>XOR</option>
        <option value="medialuna">media luna</option>
        <option value="seno" disabled style="color:#aaa">seno (próximamente)</option>
      </select>
    </label>
    <label>Ruido: <input type="range" id="slider-ruido" min="0" max="50" step="1" value="0">
      <span id="val-ruido">0%</span>
    </label>
    <label>Train: <input type="range" id="slider-train" min="50" max="90" step="5" value="80">
      <span id="val-train">80%</span>
    </label>
    <button id="btn-semilla">⚄ semilla: ${semillaDatos}</button>
  `;
  document.body.appendChild(div);

  document.getElementById('select-problema').addEventListener('change', function() {
    problema = this.value;
    aplicarParametrosBarra();
  });

  document.getElementById('slider-ruido').addEventListener('input', e => {
    nivelRuido = parseInt(e.target.value);
    document.getElementById('val-ruido').textContent = nivelRuido + '%';
  });
  document.getElementById('slider-ruido').addEventListener('change', () => {
    aplicarParametrosBarra();
  });

  document.getElementById('slider-train').addEventListener('input', e => {
    trainRatio = parseInt(e.target.value) / 100;
    document.getElementById('val-train').textContent = e.target.value + '%';
  });
  document.getElementById('slider-train').addEventListener('change', () => {
    aplicarParametrosBarra();
  });

  document.getElementById('btn-semilla').addEventListener('click', function() {
    semillaDatos = Math.floor(Math.random() * 10000);
    this.textContent = '⚄ semilla: ' + semillaDatos;
    aplicarParametrosBarra();
  });
}

function posicionarOverlayBarra() {
  const overlay = document.getElementById('barra-overlay');
  if (overlay) overlay.style.width = windowWidth + 'px';
}

function aplicarParametrosBarra() {
  if (enEstado('RUNNING') || enEstado('PAUSED')) {
    notificar('Detén el entrenamiento antes de cambiar el problema');
    return;
  }
  const resultado = generarDatos(problema, nivelRuido / 100, trainRatio, semillaDatos);
  const norm = normalizarDatos(resultado.datosTrain, resultado.datosTest);
  datosTrain = norm.datosTrain;
  datosTest  = norm.datosTest;
  resetear();
  notificar(`Problema: ${problema} | Ruido: ${nivelRuido}% | Train: ${Math.round(trainRatio * 100)}%`);
}

function posicionarOverlayPanel3() {
  const overlay = document.getElementById('panel3-overlay');
  if (!overlay) return;
  const r3 = panelRect(3);
  overlay.style.left   = r3.x + 'px';
  overlay.style.top    = (r3.y + 28) + 'px';   
  overlay.style.width  = r3.w + 'px';
  overlay.style.height = Math.max(20, r3.h - 28 - 55) + 'px'; 
}

function actualizarUIEstado() {
  const btn = document.getElementById('btn-principal');
  if (!btn) return;

  const etiquetas = {
    IDLE: 'Entrenar enjambre', RUNNING: 'Detener',
    PAUSED: 'Continuar',       CONVERGED: 'Reiniciar'
  };
  btn.textContent = etiquetas[estado] || 'Entrenar enjambre';

  const bloqueado = enEstado('RUNNING', 'PAUSED');
  ['slider-eta-min', 'slider-eta-max', 'input-epocas'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = bloqueado;
  });
  document.querySelectorAll('input[name="nmodelos"]').forEach(r => {
    r.disabled = bloqueado;
  });

  const enMovimiento = enEstado('RUNNING', 'PAUSED');
  ['select-problema', 'slider-ruido', 'slider-train', 'btn-semilla'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = enMovimiento;
  });
}