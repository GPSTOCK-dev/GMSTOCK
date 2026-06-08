// ============================================================
//  app.js  —  CatálogoTools · versión corregida para GitHub Pages + Supabase
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

/* ── TOAST ── */
function showToast(msg, duration = 2500) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), duration);
}

/* ── STATS ── */
function updateStats() {
  const total = tools.length;
  const empty = tools.filter(t => t.pieces === 0).length;
  const low   = tools.filter(t => t.pieces > 0 && t.pieces <= STOCK_LIMIT).length;
  const ok    = total - empty - low;
  document.getElementById('st-total').textContent = total;
  document.getElementById('st-ok').textContent    = ok;
  document.getElementById('st-low').textContent   = low;
  document.getElementById('st-empty').textContent = empty;
}

/* ── WA STATUS CHIP ── */
function updateWaChip() {
  const chip  = document.getElementById('wa-status-chip');
  const label = document.getElementById('ws-label');
  if (!chip || !label) return;
  if (wa.phone) {
    chip.classList.remove('unconfigured');
    label.textContent = `Alertas → +${wa.country}${wa.phone}`;
  } else {
    chip.classList.add('unconfigured');
    label.textContent = 'WhatsApp no configurado';
  }
}

/* ── RENDER CARDS ── */
// Esta función es llamada por el input de búsqueda (oninput="renderCards()")
function renderCards() {
  const query     = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
  const container = document.getElementById('cards-container');
  const empty     = document.getElementById('empty-state');
  const label     = document.getElementById('section-label');
  if (!container) return;

  const filtered = query
    ? tools.filter(t =>
        (t.name || '').toLowerCase().includes(query) ||
        (t.desc || '').toLowerCase().includes(query))
    : tools;

  if (label) label.textContent = query ? `Resultados para "${query}"` : 'Todas las herramientas';

  container.innerHTML = '';

  if (filtered.length === 0) {
    if (empty) empty.classList.add('show');
    return;
  }
  if (empty) empty.classList.remove('show');

  filtered.forEach(t => buildCard(t, container));
}

function buildCard(t, container) {
  const isLow    = t.pieces > 0 && t.pieces <= STOCK_LIMIT;
  const isEmpty  = t.pieces === 0;
  const showWaBtn = wa.btn && (isLow || isEmpty);
  const alerted  = alertedIds.includes(t.id);

  // Badge class
  let badgeClass = '';
  if (isEmpty) badgeClass = 'empty';
  else if (isLow) badgeClass = 'alert';

  // Icon / Image
  let iconHTML = '';
  if (t.img) {
    iconHTML = `<div class="tool-icon"><img src="${t.img}" alt="${escHtml(t.name)}"></div>`;
  } else {
    iconHTML = `<div class="tool-icon" style="background:${t.color}22;color:${t.color}">${t.icon || '🔧'}</div>`;
  }

  // Dates
  let datesHTML = '';
  if (t.entry || t.exit) {
    datesHTML = `<div class="card-dates">
      ${t.entry ? `<div class="date-chip"><span class="label">Ingreso</span><span class="value">${formatDate(t.entry)}</span></div>` : ''}
      ${t.exit  ? `<div class="date-chip"><span class="label">Salida</span><span class="value">${formatDate(t.exit)}</span></div>`  : ''}
    </div>`;
  }

  // Stock alert row
  let alertRow = '';
  if ((isLow || isEmpty) && wa.btn) {
    const waConfigured = !!wa.phone;
    if (waConfigured) {
      alertRow = `
        <div class="stock-alert-row">
          <span class="sa-text">⚠️ ${isEmpty ? 'Sin stock' : `Stock bajo (${t.pieces} pzs)`}</span>
          <button class="wa-send-btn ${alerted ? 'sent' : ''}" onclick="sendWaAlert('${t.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
              <path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.979-1.304A9.963 9.963 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 11.999 2zm.001 18a7.946 7.946 0 01-4.291-1.254l-.308-.183-3.172.831.845-3.083-.2-.317A7.945 7.945 0 014 12c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8z"/>
            </svg>
            ${alerted ? 'Enviado ✓' : 'Avisar'}
          </button>
        </div>`;
    } else {
      alertRow = `
        <div class="wa-not-set" onclick="openWaModal()">
          <span>⚠️ ${isEmpty ? 'Sin stock' : 'Stock bajo'} — configura WhatsApp</span>
          <span class="setup-link">Configurar ›</span>
        </div>`;
    }
  }

  const card = document.createElement('div');
  card.className = `tool-card${(isLow || isEmpty) ? ' alert-stock' : ''}`;
  card.dataset.id = t.id;
  card.innerHTML = `
    <div class="card-header">
      ${iconHTML}
      <div class="card-title-wrap">
        <div class="tool-name">${escHtml(t.name)}</div>
        <div class="tool-desc">${escHtml(t.desc || 'Sin descripción')}</div>
      </div>
      <div class="pieces-badge ${badgeClass}">
        ${t.pieces}<br><span style="font-size:9px;font-weight:400">pzs</span>
      </div>
    </div>
    ${datesHTML}
    ${alertRow}
    <div class="card-actions">
      <button class="action-btn edit" onclick="openEditModal('${t.id}')">✏️ Editar</button>
      <button class="action-btn delete" onclick="openDeleteModal('${t.id}')">🗑️ Eliminar</button>
    </div>`;
  container.appendChild(card);
}

/* ── HELPERS ── */
function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(d) {
  if (!d) return '';
  const [y,m,day] = d.split('-');
  return `${day}/${m}/${y}`;
}

/* ── WA ALERT ── */
function buildWaMsg(tool) {
  const resp = wa.name ? `Hola ${wa.name},\n` : '';
  const status = tool.pieces === 0 ? '❌ *SIN STOCK*' : `⚠️ Solo quedan *${tool.pieces} piezas*`;
  return `${resp}🔧 *Alerta de stock — CatálogoTools*\n\n📦 Herramienta: *${tool.name}*\n${status}\n\n👉 Por favor repone el inventario a la brevedad.\n\n_Mensaje automático de CatálogoTools_`;
}

function waUrl(tool) {
  const number = `${wa.country}${wa.phone}`.replace(/\D/g,'');
  const msg    = encodeURIComponent(buildWaMsg(tool));
  return `https://wa.me/${number}?text=${msg}`;
}

function sendWaAlert(id) {
  const tool = tools.find(t => t.id === id);
  if (!tool) return;
  if (!wa.phone) { openWaModal(); return; }
  window.open(waUrl(tool), '_blank');
  if (!alertedIds.includes(id)) {
    alertedIds.push(id);
    localStorage.setItem('ct-alerted', JSON.stringify(alertedIds));
  }
  renderCards();
}

/* ── WA MODAL ── */
function openWaModal() {
  document.getElementById('wa-country').value = wa.country;
  document.getElementById('wa-phone').value   = wa.phone;
  document.getElementById('wa-name').value    = wa.name;
  document.getElementById('tog-auto').checked = wa.auto;
  document.getElementById('tog-btn').checked  = wa.btn;
  updateMsgPreview();
  document.getElementById('wa-modal').classList.add('open');
}

function closeWaModal() {
  document.getElementById('wa-modal').classList.remove('open');
}

function closeWaOnOverlay(e) {
  if (e.target === document.getElementById('wa-modal')) closeWaModal();
}

function updateMsgPreview() {
  const country = document.getElementById('wa-country').value;
  const phone   = document.getElementById('wa-phone').value.trim();
  const name    = document.getElementById('wa-name').value.trim();
  const preview = document.getElementById('msg-preview-text');
  if (!preview) return;
  if (!phone) { preview.textContent = 'Ingresa un número para ver la vista previa.'; return; }
  const fakeTool = { name:'Taladro Percutor', pieces:5 };
  const resp = name ? `Hola ${name},\n` : '';
  preview.textContent = `${resp}🔧 Alerta de stock — CatálogoTools\n\n📦 Herramienta: ${fakeTool.name}\n⚠️ Solo quedan ${fakeTool.pieces} piezas\n\n👉 Por favor repone el inventario a la brevedad.\n\n_Mensaje automático de CatálogoTools_`;
}

async function saveWaConfig() {
  const config = {
    country: document.getElementById('wa-country').value,
    phone:   document.getElementById('wa-phone').value.trim().replace(/\D/g,''),
    name:    document.getElementById('wa-name').value.trim(),
    auto:    document.getElementById('tog-auto').checked,
    btn:     document.getElementById('tog-btn').checked,
  };
  if (!config.phone) { showToast('⚠️ Ingresa un número válido'); return; }
  const ok = await dbSaveWaConfig(config);
  if (ok) {
    wa = config;
    updateWaChip();
    renderCards();
    closeWaModal();
    showToast('✅ Configuración de WhatsApp guardada');
  } else {
    showToast('❌ Error al guardar. Revisa la consola.');
  }
}

function sendWaTest() {
  const phone = document.getElementById('wa-phone').value.trim().replace(/\D/g,'');
  const country = document.getElementById('wa-country').value;
  if (!phone) { showToast('⚠️ Ingresa un número primero'); return; }
  const fakeTool = { name:'[PRUEBA] Taladro Percutor', pieces:3 };
  const number   = `${country}${phone}`;
  const msg      = encodeURIComponent(buildWaMsg(fakeTool));
  window.open(`https://wa.me/${number}?text=${msg}`, '_blank');
}

/* ── ICON PICKER ── */
function buildIconPicker() {
  const container = document.getElementById('icon-selector');
  if (!container) return;
  container.innerHTML = '';
  ICONS.forEach((icon, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'icon-opt' + (icon === selIcon ? ' selected' : '');
    btn.textContent = icon;
    btn.onclick = () => {
      selIcon = icon;
      container.querySelectorAll('.icon-opt').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    };
    container.appendChild(btn);
  });
}

function switchTab(tab) {
  pickerMode = tab;
  document.getElementById('tab-icon').classList.toggle('active', tab === 'icon');
  document.getElementById('tab-img').classList.toggle('active', tab === 'img');
  document.getElementById('panel-icon').style.display = tab === 'icon' ? '' : 'none';
  document.getElementById('panel-img').style.display  = tab === 'img'  ? '' : 'none';
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) readImageFile(file);
}

function handleDrop(e) {
  e.preventDefault();
  document.getElementById('upload-area').classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) readImageFile(file);
}

function readImageFile(file) {
  const reader = new FileReader();
  reader.onload = ev => {
    selImgB64 = ev.target.result;
    document.getElementById('img-placeholder').style.display = 'none';
    document.getElementById('img-preview-wrap').style.display = '';
    document.getElementById('img-preview').src = selImgB64;
  };
  reader.readAsDataURL(file);
}

function removeImage(e) {
  e.stopPropagation();
  selImgB64 = null;
  document.getElementById('img-placeholder').style.display = '';
  document.getElementById('img-preview-wrap').style.display = 'none';
  document.getElementById('img-preview').src = '';
  document.getElementById('img-file-input').value = '';
}

/* ── FORM MODAL ── */
function openAddModal() {
  editingId = null;
  selIcon   = ICONS[0];
  selImgB64 = null;
  document.getElementById('modal-title').innerHTML = 'Nueva <span>Herramienta</span>';
  document.getElementById('f-name').value  = '';
  document.getElementById('f-desc').value  = '';
  document.getElementById('f-entry').value = '';
  document.getElementById('f-exit').value  = '';
  document.getElementById('f-pieces').value = '';
  // Reset image picker
  document.getElementById('img-placeholder').style.display = '';
  document.getElementById('img-preview-wrap').style.display = 'none';
  document.getElementById('img-preview').src = '';
  document.getElementById('img-file-input').value = '';
  switchTab('icon');
  buildIconPicker();
  document.getElementById('form-modal').classList.add('open');
}

function openEditModal(id) {
  const tool = tools.find(t => t.id === id);
  if (!tool) return;
  editingId = id;
  selIcon   = tool.icon || ICONS[0];
  selImgB64 = tool.img  || null;

  document.getElementById('modal-title').innerHTML = 'Editar <span>Herramienta</span>';
  document.getElementById('f-name').value   = tool.name  || '';
  document.getElementById('f-desc').value   = tool.desc  || '';
  document.getElementById('f-entry').value  = tool.entry || '';
  document.getElementById('f-exit').value   = tool.exit  || '';
  document.getElementById('f-pieces').value = tool.pieces ?? '';

  // Image picker
  if (tool.img) {
    document.getElementById('img-placeholder').style.display = 'none';
    document.getElementById('img-preview-wrap').style.display = '';
    document.getElementById('img-preview').src = tool.img;
    switchTab('img');
  } else {
    document.getElementById('img-placeholder').style.display = '';
    document.getElementById('img-preview-wrap').style.display = 'none';
    document.getElementById('img-preview').src = '';
    switchTab('icon');
  }
  buildIconPicker();
  document.getElementById('form-modal').classList.add('open');
}

function closeFormModal() {
  document.getElementById('form-modal').classList.remove('open');
}

function closeFormOnOverlay(e) {
  if (e.target === document.getElementById('form-modal')) closeFormModal();
}

async function saveTool() {
  const name   = document.getElementById('f-name').value.trim();
  const desc   = document.getElementById('f-desc').value.trim();
  const entry  = document.getElementById('f-entry').value;
  const exit   = document.getElementById('f-exit').value;
  const pieces = parseInt(document.getElementById('f-pieces').value, 10);

  if (!name) { showToast('⚠️ El nombre es obligatorio'); return; }
  if (isNaN(pieces) || pieces < 0) { showToast('⚠️ Ingresa una cantidad válida'); return; }

  // Pick a random color for new tools
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];

  const toolData = {
    icon:   pickerMode === 'icon' ? selIcon : null,
    color:  pickerMode === 'icon' ? color   : null,
    img:    pickerMode === 'img'  ? selImgB64 : null,
    name, desc, entry, exit, pieces
  };

  if (editingId) {
    // Keep original color/icon if not changing
    const orig = tools.find(t => t.id === editingId);
    if (orig) {
      toolData.color = pickerMode === 'icon' ? (orig.color || color) : null;
    }
  }

  showLoading(editingId ? 'Actualizando…' : 'Guardando…');
  let result = null;

  if (editingId) {
    result = await dbUpdateTool(editingId, toolData);
    if (result) {
      const idx = tools.findIndex(t => t.id === editingId);
      if (idx !== -1) {
        tools[idx] = mapRow(result);
      }
      showToast('✅ Herramienta actualizada');
    } else {
      showToast('❌ Error al actualizar');
    }
  } else {
    result = await dbAddTool(toolData);
    if (result) {
      tools.unshift(mapRow(result));
      showToast('✅ Herramienta agregada');
      // Auto-alert on save if configured
      if (wa.auto && wa.phone && pieces <= STOCK_LIMIT) {
        setTimeout(() => sendWaAlert(result.id), 400);
      }
    } else {
      showToast('❌ Error al guardar');
    }
  }

  hideLoading();
  if (result) {
    updateStats();
    renderCards();
    closeFormModal();
  }
}

// Mapea una fila de Supabase al objeto local
function mapRow(row) {
  return {
    id:    row.id,
    icon:  row.icon,
    color: row.color,
    img:   row.img,
    name:  row.tool_name,
    desc:  row.tool_desc,
    entry: row.entry,
    exit:  row.exit_date,
    pieces: row.pieces,
    created_at: row.created_at
  };
}

/* ── DELETE MODAL ── */
function openDeleteModal(id) {
  deleteId = id;
  document.getElementById('confirm-modal').classList.add('open');
}

function closeConfirmModal() {
  deleteId = null;
  document.getElementById('confirm-modal').classList.remove('open');
}

async function confirmDelete() {
  if (!deleteId) return;
  showLoading('Eliminando…');
  const ok = await dbDeleteTool(deleteId);
  hideLoading();
  if (ok) {
    tools = tools.filter(t => t.id !== deleteId);
    alertedIds = alertedIds.filter(id => id !== deleteId);
    localStorage.setItem('ct-alerted', JSON.stringify(alertedIds));
    updateStats();
    renderCards();
    showToast('🗑️ Herramienta eliminada');
  } else {
    showToast('❌ Error al eliminar');
  }
  closeConfirmModal();
}

/* ── INIT ── */
async function init() {
  showLoading('Cargando herramientas…');
  try {
    // Cargar configuración de WA y herramientas en paralelo
    const [waConfig, toolList] = await Promise.all([
      dbLoadWaConfig(),
      dbLoadTools()
    ]);

    if (waConfig) {
      wa = { ...wa, ...waConfig };
    }
    tools = toolList;

    updateWaChip();
    updateStats();
    renderCards();
  } catch (err) {
    console.error('Error al iniciar la app:', err);
    showToast('❌ Error de conexión. Revisa tu configuración de Supabase.');
  } finally {
    hideLoading();
  }
}

// Arrancar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);
