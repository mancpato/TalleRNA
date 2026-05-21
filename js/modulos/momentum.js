/**
 * TalleRNA: Taller de Redes Neuronales Artificiales
 * @file: momentum.js
 * @description: Permite evaluar el efecto del momentum. 
 * @author: Miguel Ángel Norzagaray Cosío
 * @since: abril de 2026
 * 
 * En este archivo compara modelos que tienen diversos valores de momentum,
 * el coeficiente que controla cuánto se toma en cuenta la dirección 
 * previa del descenso de gradiente.
 */
  
// ════════════════════════════════════════════════════════════════════════════
// MÓDULO: MOMENTUM
// Variable : β (coeficiente de momentum) ∈ {0.0, 0.2, 0.4, 0.6, 0.8, 0.9} 
// Fijo     : η=0.05, Xavier (semilla=1), ReLU, red 2→4→1
// ════════════════════════════════════════════════════════════════════════════

// ── 1. CONFIGURACIÓN ────────────────────────────────────────────────────────

const BETAS_MOMENTUM = [0.0, 0.2, 0.4, 0.6, 0.8, 0.9];

// ── 2. GENERACIÓN DEL ENJAMBRE ──────────────────────────────────────────────

function generarEnjambreMomentum() 
{
  modelos = BETAS_MOMENTUM.map((b) => {
    let m = crearModelo([2, 4, 1], 'relu', 0.05, 0, 1, 'xavier', b);
    m.etiqueta = `β=${b.toFixed(1)}`;
    const t = b / 0.9;
    m.color = lerpColor(PALETAS.momentum.azulClaro, PALETAS.momentum.naranjaOscuro, t);
    return m;
  });
  modeloReferencia = 0;
  modeloSeleccionado = null;
}

// ── 3. CONTROLES PANEL 3 (DOM) ────────────────────────────────────────────────

function crearSeccionOverlayMomentum() 
{
  const overlay = document.getElementById('panel3-overlay');
  if (!overlay) 
    return;
  const div = document.createElement('div');
  div.id = 'controles-momentum';
  div.style.display = 'none';
  div.innerHTML = `
    <div class="p3-row">
      <label>Épocas máx.:&nbsp;<input type="number" id="input-epocas-mom"
        min="50" max="5000" step="50" value="500" style="width:56px"></label>
      <label style="margin-left:10px">Velocidad:&nbsp;
        <select id="select-velocidad-mom">
          <option value="lenta">Lenta</option>
          <option value="normal" selected>Normal</option>
          <option value="rapida">Rápida</option>
        </select>
      </label>
      <button id="btn-paso-mom" style="margin-left:10px">+100</button>
    </div>
    <hr class="p3-sep">
    <div style="font-size:11px;color:#555;margin-bottom:2px">6 modelos · β ∈ {0.0, 0.2, 0.4, 0.6, 0.8, 0.9}</div>
    <div style="font-size:10px;color:#888">η = 0.05 · Xavier · ReLU · 2→4→1</div>
  `;
  overlay.appendChild(div);

  document.getElementById('input-epocas-mom').addEventListener('change', e => {
    const v = parseInt(e.target.value);
    if (!isNaN(v)) 
      maximoEpocas = Math.max(50, Math.min(5000, v));
  });
  document.getElementById('select-velocidad-mom').addEventListener('change', e => {
    velocidad = e.target.value;
  });
  document.getElementById('btn-paso-mom').addEventListener('click', avanzar100);
}

function actualizarUIEstadoMomentum() {
  const bloqueado     = enEstado('RUNNING', 'PAUSED');
  const bloqueadoPaso = enEstado('RUNNING', 'CONVERGED');

  ['input-epocas-mom', 'select-velocidad-mom'].forEach(id => {
    const el = document.getElementById(id);
    if (el) 
      el.disabled = bloqueado;
  });

  const btnPaso = document.getElementById('btn-paso-mom');
  if (btnPaso) 
    btnPaso.disabled = bloqueadoPaso;
}

// ── 4. VISUALIZACIÓN PANEL 3 (p5.js) ─────────────────────────────────────────

function dibujarCirculosMomentum(r3) 
{
  if (!modelos || modelos.length === 0) 
    return;

  const DIAM   = 18;
  const SEP    = 52;
  const totalW = modelos.length * SEP - (SEP - DIAM);
  const cirX0  = r3.x + (r3.w - totalW) / 2;
  const cirY   = r3.y + r3.h * 0.78;

  for (let i = 0; i < modelos.length; i++) {
    const m  = modelos[i];
    const cx = cirX0 + i * SEP;
    const c  = m.color || color(150);

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
      noStroke(); textSize(11); textAlign(CENTER, BOTTOM);
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
    noStroke(); fill(70); textSize(11); textAlign(CENTER, TOP);
    text(m.etiqueta || `β=${i}`, cx, cirY + DIAM / 2 + 5);
  }
}
