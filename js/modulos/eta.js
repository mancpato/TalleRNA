// ══════════════════════════════════════════════════════════════════════════════
// MÓDULO: TASA DE APRENDIZAJE (η)
// Variable : η ∈ [etaMinVal, etaMaxVal], N modelos equidistantes
// Fijo     : Xavier (semilla=1), ReLU, sin dropout, red 2→4→1
// ══════════════════════════════════════════════════════════════════════════════

// ── 2. GENERACIÓN DEL ENJAMBRE ────────────────────────────────────────────────

function generarEnjambreEta(etaMin, etaMax, N) {
  modelos = [];
  modeloReferencia   = null;
  modeloSeleccionado = null;
  modeloHover        = null;
  J_max_epoca0  = 1.0;
  modoLogPanel2 = false;
  modoAccPanel2 = false;

  const etas = [];
  if (N === 1) etas.push(etaMin);
  else for (let i = 0; i < N; i++)
    etas.push(etaMin + (etaMax - etaMin) * i / (N - 1));

  for (let i = 0; i < etas.length; i++) {
    const eta_i = etas[i];
    const m = crearModelo([2, 4, 1], 'relu', eta_i, 0, 1, 'xavier');
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

// ── 3. CONTROLES PANEL 3 (DOM) ────────────────────────────────────────────────

function crearSeccionOverlayEta() {
  const overlay = document.getElementById('panel3-overlay');
  if (!overlay) return;

  const div = document.createElement('div');
  div.id = 'controles-eta';
  div.innerHTML = `
    <div class="p3-row">
      <label>Épocas máx.:&nbsp;<input type="number" id="input-epocas"
        min="50" max="5000" step="50" value="500" style="width:56px"></label>
      <label style="margin-left:10px">Velocidad:&nbsp;<select id="select-velocidad">
        <option value="lenta">Lenta</option>
        <option value="normal" selected>Normal</option>
        <option value="rapida">Rápida</option>
      </select></label>
      <button id="btn-paso-eta" style="margin-left:10px">+100</button>
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
  overlay.appendChild(div);

  const SL_MIN = Math.log10(0.001);
  const SL_MAX = Math.log10(0.5);
  const slMin  = document.getElementById('slider-eta-min');
  const slMax  = document.getElementById('slider-eta-max');
  slMin.min = SL_MIN; slMin.max = SL_MAX; slMin.step = 'any';
  slMax.min = SL_MIN; slMax.max = SL_MAX; slMax.step = 'any';
  slMin.value = Math.log10(etaMinVal);
  slMax.value = Math.log10(etaMaxVal);

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
    r.addEventListener('change', () => { nModelosEta = parseInt(r.value); resetear(); });
  });
  document.getElementById('btn-paso-eta').addEventListener('click', avanzar100);
}

function actualizarUIEstadoEta() {
  const bloqueado     = enEstado('RUNNING', 'PAUSED');
  const bloqueadoPaso = enEstado('RUNNING', 'CONVERGED');
  ['slider-eta-min', 'slider-eta-max', 'input-epocas'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = bloqueado;
  });
  document.querySelectorAll('input[name="nmodelos"]').forEach(r => {
    r.disabled = bloqueado;
  });
  const btnPaso = document.getElementById('btn-paso-eta');
  if (btnPaso) btnPaso.disabled = bloqueadoPaso;
}

// ── 4. VISUALIZACIÓN PANEL 3 (p5.js) ─────────────────────────────────────────

function dibujarCirculosEta(r3) {
  const DIAM   = 10;
  const SEP    = 48;
  const totalW = modelos.length * SEP - (SEP - DIAM);
  const cirX0  = r3.x + (r3.w - totalW) / 2;
  const cirY   = r3.y + r3.h - 40;

  for (let i = 0; i < modelos.length; i++) {
    const m  = modelos[i];
    const cx = cirX0 + i * SEP;
    const c  = m.color;

    fill(red(c), green(c), blue(c)); noStroke();
    ellipse(cx, cirY, DIAM);

    noFill();
    if (m.estado === 'convergido') {
      stroke(46, 204, 113); strokeWeight(2); ellipse(cx, cirY, DIAM + 5);
    } else if (m.estado === 'divergente') {
      stroke(226, 75, 74); strokeWeight(2); ellipse(cx, cirY, DIAM + 5);
      const d = DIAM * 0.38; strokeWeight(1.5);
      line(cx - d, cirY - d, cx + d, cirY + d);
      line(cx + d, cirY - d, cx - d, cirY + d);
    } else if (m.estado === 'no_convergido') {
      stroke(150); strokeWeight(1.5); ellipse(cx, cirY, DIAM + 5);
    }

    if (modeloSeleccionado === i) {
      noFill(); stroke(30); strokeWeight(2); ellipse(cx, cirY, DIAM + 9);
    } else if (modeloHover === i) {
      noFill(); stroke(100); strokeWeight(1); ellipse(cx, cirY, DIAM + 7);
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
        metrica = 'J=' + ultimo.J_test.toFixed(3); fill(120);
      } else { metrica = ''; fill(120); }
      if (metrica) text(metrica, cx, cirY - DIAM / 2 - 8);
    }

    noStroke(); fill(80); textSize(12); textAlign(CENTER, TOP);
    if (i === 0) {
      noStroke(); fill(80); textSize(14); textAlign(RIGHT, TOP);
      text('η = ', cirX0 - 20, cirY + DIAM / 2 + 5);
      textAlign(CENTER, TOP);
    }
    text(m.eta.toFixed(3), cx, cirY + DIAM / 2 + 6);
  }
}
