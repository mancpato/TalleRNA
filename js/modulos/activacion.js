// ══════════════════════════════════════════════════════════════════════════════
// MÓDULO: FUNCIÓN DE ACTIVACIÓN
// Variable : función de activación en capas ocultas (hasta 5 modelos)
// Fijo     : η=0.05, Xavier (semilla=1), sin dropout, red 2→4→1
// ══════════════════════════════════════════════════════════════════════════════

// ── 1. CONFIGURACIÓN ──────────────────────────────────────────────────────────

const ACTIVACIONES_DISPONIBLES = ['relu', 'sigmoid', 'tanh', 'lineal', 'leaky_relu', 'elu', 'escalon'];

const NOMBRES_ACT = {
  relu:       'ReLU',
  sigmoid:    'Sigmoid',
  tanh:       'Tanh',
  lineal:     'Lineal',
  leaky_relu: 'Leaky ReLU',
  elu:        'ELU',
  escalon:    'Escalón'
};

let activacionesActivas  = ['sigmoid', 'relu', 'lineal', 'tanh', 'leaky_relu', 'escalon', 'elu'];
let _debounceActivacion  = null;

// ── 2. GENERACIÓN DEL ENJAMBRE ────────────────────────────────────────────────

function generarEnjambreActivacion() {
  modelos            = [];
  modeloSeleccionado = null;
  modeloHover        = null;
  modeloReferencia   = null;
  J_max_epoca0       = 1.0;
  modoLogPanel2      = false;
  modoAccPanel2      = false;

  for (const act of activacionesActivas) {
    const m    = crearModelo([2, 4, 1], act, 0.05, 0, 1, 'xavier');
    m.etiqueta = NOMBRES_ACT[act];
    m.color    = PALETAS.activacion[act];

    const grid = calcularGridPrediccion(m, 50);
    m.frontera = calcularFrontera(grid, 50);
    modelos.push(m);
  }

  if (modelos.length > 0) {
    modeloReferencia = 0;
    modeloMapa       = modelos[0];
    renderizarMapa(modelos[0]);
  }

  console.log('[Enjambre Activación] modelos:', modelos.map(m => m.etiqueta));
}

// ── 3. CONTROLES PANEL 3 (DOM) ────────────────────────────────────────────────

function crearSeccionOverlayActivacion() {
  const overlay = document.getElementById('panel3-overlay');
  if (!overlay) return;

  const div = document.createElement('div');
  div.id = 'controles-activacion';
  div.style.display = 'none';
  div.innerHTML = `
    <div class="p3-row">
      <label>Épocas máx.:&nbsp;<input type="number" id="input-epocas-act"
        min="50" max="5000" step="50" value="500" style="width:56px"></label>
      <label style="margin-left:10px">Velocidad:&nbsp;
        <select id="select-velocidad-act">
          <option value="lenta">Lenta</option>
          <option value="normal" selected>Normal</option>
          <option value="rapida">Rápida</option>
        </select>
      </label>
      <button id="btn-paso-act" style="margin-left:10px">+100</button>
    </div>
    <hr class="p3-sep">
    <div style="font-size:11px;color:#888;margin-bottom:6px">
      Selecciona las funciones a comparar:
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,auto);grid-auto-flow:column;gap:4px 8px;margin:6px 0;font-size:12px">
      <label><input type="checkbox" id="cb-act-sigmoid"    checked>&nbsp;Sigmoid</label>
      <label><input type="checkbox" id="cb-act-tanh"       checked>&nbsp;Tanh</label>
      <div></div>
      <label><input type="checkbox" id="cb-act-relu"       checked>&nbsp;ReLU</label>
      <label><input type="checkbox" id="cb-act-leaky_relu" checked>&nbsp;Leaky ReLU</label>
      <label><input type="checkbox" id="cb-act-elu"        checked>&nbsp;ELU</label>
      <label><input type="checkbox" id="cb-act-lineal"     checked>&nbsp;Lineal</label>
      <div>
        <label><input type="checkbox" id="cb-act-escalon" checked>&nbsp;Escalón</label>
        <div style="font-size:10px;color:#aaa;margin-left:18px">∇=0</div>
      </div>
    </div>
    <div style="font-size:11px;color:#888;margin-top:6px">
      Total: <span id="span-total-act">7</span> modelos
    </div>
  `;
  overlay.appendChild(div);

  // Épocas y velocidad
  document.getElementById('input-epocas-act').addEventListener('change', e => {
    const v = parseInt(e.target.value);
    if (!isNaN(v)) maximoEpocas = Math.max(50, Math.min(5000, v));
  });
  document.getElementById('select-velocidad-act').addEventListener('change', e => {
    velocidad = e.target.value;
  });
  document.getElementById('btn-paso-act').addEventListener('click', avanzar100);

  // Checkboxes de activación
  const CB_IDS = [
    ['cb-act-sigmoid',    'sigmoid'],
    ['cb-act-relu',       'relu'],
    ['cb-act-lineal',     'lineal'],
    ['cb-act-tanh',       'tanh'],
    ['cb-act-leaky_relu', 'leaky_relu'],
    ['cb-act-escalon',    'escalon'],
    ['cb-act-elu',        'elu']
  ];

  CB_IDS.forEach(([id]) => {
    document.getElementById(id).addEventListener('change', () => {
      const activas = CB_IDS
        .filter(([cbId]) => document.getElementById(cbId).checked)
        .map(([, act]) => act);

      if (activas.length === 0) {
        document.getElementById(id).checked = true;
        return;
      }

      activacionesActivas = activas;
      const span = document.getElementById('span-total-act');
      if (span) span.textContent = activas.length;

      clearTimeout(_debounceActivacion);
      _debounceActivacion = setTimeout(() => resetear(), 300);
    });
  });
}

function actualizarUIEstadoActivacion() {
  const bloqueado     = enEstado('RUNNING', 'PAUSED');
  const bloqueadoPaso = enEstado('RUNNING', 'CONVERGED');

  ['input-epocas-act',
   'cb-act-relu', 'cb-act-sigmoid', 'cb-act-tanh',
   'cb-act-lineal', 'cb-act-leaky_relu',
   'cb-act-elu', 'cb-act-escalon'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = bloqueado;
  });

  const btnPaso = document.getElementById('btn-paso-act');
  if (btnPaso) btnPaso.disabled = bloqueadoPaso;
}

// ── 4. VISUALIZACIÓN PANEL 3 (p5.js) ─────────────────────────────────────────

function dibujarCirculosActivacion(r3) {
  if (!modelos || modelos.length === 0) return;

  const DIAM   = 10;
  const SEP    = 48;
  const totalW = modelos.length * SEP - (SEP - DIAM);
  const cirX0  = r3.x + (r3.w - totalW) / 2;
  const cirY   = r3.y + r3.h - 40;

  for (let i = 0; i < modelos.length; i++) {
    const m  = modelos[i];
    const cx = cirX0 + i * SEP;
    const c  = m.color;

    // Círculo principal
    fill(red(c), green(c), blue(c)); noStroke();
    ellipse(cx, cirY, DIAM);

    // Anillo de estado
    noFill();
    if (m.estado === 'convergido') {
      stroke(46, 204, 113); strokeWeight(2);
      ellipse(cx, cirY, DIAM + 6);
    } else if (m.estado === 'divergente') {
      stroke(226, 75, 74); strokeWeight(2);
      ellipse(cx, cirY, DIAM + 6);
      const d = DIAM * 0.38; strokeWeight(1.5);
      line(cx - d, cirY - d, cx + d, cirY + d);
      line(cx + d, cirY - d, cx - d, cirY + d);
    } else if (m.estado === 'no_convergido') {
      stroke(150); strokeWeight(1.5);
      ellipse(cx, cirY, DIAM + 6);
    }

    // Selección y hover
    if (modeloSeleccionado === i) {
      noFill(); stroke(30); strokeWeight(2.5);
      ellipse(cx, cirY, DIAM + 11);
    } else if (modeloHover === i) {
      noFill(); stroke(100); strokeWeight(1);
      ellipse(cx, cirY, DIAM + 9);
    }

    // Métrica encima
    if (m.historial && m.historial.length > 0) {
      const ult = m.historial[m.historial.length - 1];
      noStroke(); textSize(10); textAlign(CENTER, BOTTOM);
      if (esTipoClasif && ult.accuracy_test !== undefined && ult.accuracy_test !== null) {
        const acc = ult.accuracy_test;
        fill(acc > 0.75 ? color(46, 180, 90)
           : acc > 0.50 ? color(200, 160, 0)
           : color(160));
        text((acc * 100).toFixed(0) + '%', cx, cirY - DIAM / 2 - 3);
      } else if (ult.J_test !== undefined) {
        fill(120);
        text('J=' + ult.J_test.toFixed(3), cx, cirY - DIAM / 2 - 3);
      }
    }

    // Etiqueta debajo
    noStroke(); fill(70); textSize(10); textAlign(CENTER, TOP);
    text(m.etiqueta, cx, cirY + DIAM / 2 + 5);
  }
}
