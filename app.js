// ============================================================
//  app.js  —  Lógica principal de CatálogoTools con Supabase
// ============================================================

/* ── CONSTANTS ── */
const ICONS = ['🔧','🔨','⚙️','🪛','🔩','🪚','🔌','💡','🧰','🪜','🔑','🪤','🔬','⚡','🛠️','📐','🗜️','📏','🔭','🧲'];
const COLORS = ['#f0c040','#e05c3a','#4ecdc4','#a78bfa','#34d399','#f472b6','#60a5fa','#fbbf24'];
const STOCK_LIMIT = 20;

/* ── STATE ── */
let tools      = [];
let wa         = { country:'52', phone:'', name:'', auto:true, btn:true };
let alertedIds = JSON.parse(localStorage.getItem('ct-alerted') || '[]');
let editingId  = null;
let deleteId   = null;
let selIcon    = ICONS[0];
let selImgB64  = null;
let pickerMode = 'icon';

/* ── LOADING OVERLAY ── */
function showLoading(msg = 'Cargando…') {
  let el = document.getElementById('loading-overlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'loading-overlay';
    el.className = 'loading-overlay';
    document.body.appendChild(el);
  }
  el.innerHTML = `<div class="spinner"></div><div class="loading-text">${msg}</div>`;
  el.style.display = 'flex';
}

function hideLoading() {
  const el = document.getElementById('loading-overlay');
  if (el) el.style.display = 'none';
}

/* ── RENDER TOOLS ── */
function renderTools() {
  const container = document.getElementById('tools-container');
  if (!container) return;
  container.innerHTML = '';

  if (tools.length === 0) {
    container.innerHTML = `<div class="empty-state">No hay herramientas registradas.</div>`;
    return;
  }

  tools.forEach(t => {
    const isAlerted = alertedIds.includes(t.id);
    const card = document.createElement('div');
    card.className = `tool-card ${t.pieces <= STOCK_LIMIT ? 'low-stock' : ''}`;
    
    let imgHTML = '';
    if (t.img) {
      imgHTML = `<div class="tool-img-box"><img src="${t.img}" alt="${t.name}"></div>`;
    } else {
      imgHTML = `<div class="tool-icon-box" style="background:${t.color}20; color:${t.color}">${t.icon}</div>`;
    }

    card.innerHTML = `
      <div class="tool-main">
        ${imgHTML}
        <div class="tool-info">
          <h3 class="tool-name">${t.name}</h3>
          <p class="tool-desc">${t.desc || 'Sin descripción'}</p>
          <div class="tool-meta">
            ${t.entry ? `<span>📅 In: ${t.entry}</span>` : ''}
            ${t.exit ? `<span>📅 Out: ${t.exit}</span>` : ''}
          </div>
        </div>
        <div class="tool-qty" style="color: ${t.pieces <= STOCK_LIMIT ? 'var(--danger)' : 'var(--available)'}">
          <span class="qty-num">${t.pieces}</span>
          <span class="qty-lbl">pzs</span>
        </div>
      </div>
      <div class="tool-actions">
        <button class="action-btn btn-edit" onclick="openEditModal('${t.id}')">✏️ Editar</button>
        <button class="action-btn btn-delete" onclick="openDeleteModal('${t.id}')">🗑️ Eliminar</button>
      </div>
    `;
    container.appendChild(card);
  });
}

/* ── FORM ACTIONS (SAVE / UPDATE) ── */
async function saveTool() {
  const nameInput = document.getElementById('f-name');
  const descInput = document.getElementById('f-desc');
  const entryInput = document.getElementById('f-entry');
  const exitInput = document.getElementById('f
