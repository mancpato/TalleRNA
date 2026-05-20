// ══════════════════════════════════════════════════════════════════════════════
// MÓDULO: TOPOLOGÍA
// Variable : arquitectura de la red (T0–T7, hasta 8 simultáneas)
// Fijo     : η=0.05, Xavier (semilla=1), ReLU (fija), sin dropout
// ══════════════════════════════════════════════════════════════════════════════

// ── 1. CONFIGURACIÓN ──────────────────────────────────────────────────────────

const TOPOLOGIAS = [
  { id: 'T0', capas: [2, 1],          etiqueta: '2→1'       },
  { id: 'T1', capas: [2, 2, 1],       etiqueta: '2→2→1'     },
  { id: 'T2', capas: [2, 3, 1],       etiqueta: '2→3→1'     },
  { id: 'T3', capas: [2, 4, 1],       etiqueta: '2→4→1'     },
  { id: 'T4', capas: [2, 2, 2, 1],    etiqueta: '2→2→2→1'   },
  { id: 'T5', capas: [2, 3, 3, 1],    etiqueta: '2→3→3→1'   },
  { id: 'T6', capas: [2, 4, 4, 1],    etiqueta: '2→4→4→1'   },
  { id: 'T7', capas: [2, 4, 2, 1],    etiqueta: '2→4→2→1'   }
];

let topologiasActivas = ['T0', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

// ── 2. GENERACIÓN DEL ENJAMBRE ────────────────────────────────────────────────

function generarEnjambreTopologia() {
  // TODO: implementar en la siguiente sesión
  console.warn('[Topología] módulo pendiente de implementar');
  modelos = [];
}

// ── 3. CONTROLES PANEL 3 (DOM) ────────────────────────────────────────────────

function crearSeccionOverlayTopologia() {
  const overlay = document.getElementById('panel3-overlay');
  if (!overlay) return;
  const div = document.createElement('div');
  div.id = 'controles-topologia';
  div.style.display = 'none';
  div.innerHTML = `<div style="font-size:11px;color:#888;padding:8px">Módulo próximamente</div>`;
  overlay.appendChild(div);
}

function actualizarUIEstadoTopologia() {
  // TODO: implementar cuando se desarrolle el módulo
}

// ── 4. VISUALIZACIÓN PANEL 3 (p5.js) ─────────────────────────────────────────

function dibujarCirculosTopologia(r3) {
  // TODO: implementar
}
