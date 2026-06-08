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
    el.innerHTML = `<div class="spinner"></div><div class="loading-text">${msg}</div>`;
    document.body.appendChild(el);
  } else {
    el.querySelector('.loading-text').textContent = msg;
    el.classList.remove('hidden');
  }
}
function hideLoading() {
  const el = document.getElementById('loading-overlay');
  if (el) el.classList.add('hidden');
}

/* ── HELPERS ── */
function fullPhone()  { return wa.country + wa.phone.replace(/\D/g,''); }
function hasWa()      { return wa.phone.trim().length >= 6; }
function iconColor(i) { const idx=ICONS.indexOf(i); return COLORS[(idx<0?0:idx)%COLORS.length]; }
function formatDate(d){ if(!d) return '—'; const[y,m,day]=d.split('-'); return `${day}/${m}/${y}`; }
function saveAlerted(){ localStorage.setItem('ct-alerted', JSON.stringify(alertedIds)); }

function pClass(n) {
  if(n===0) return 'empty';
  if(n<=5)  return 'low';
  if(n<=STOCK_LIMIT) return 'alert';
  return '';
}
function pLabel(n) {
  if(n===0) return '✗ Sin stock';
  return n+(n===1?' pieza':' piezas');
}

function buildWaMsg(toolName, pieces) {
  const who = wa.name || 'Encargado';
  return `⚠️ *Alerta de Stock Bajo*\n\nHola *${who}*, te informamos que la herramienta:\n\n🔧 *${toolName}*\n\nactualmente tiene solo *${pieces} ${pieces===1?'pieza':'piezas'}* disponibles en el catálogo.\n\nPor favor revisa el inventario y realiza el reabastecimiento necesario. 📦`;
}

/* ── WHATSAPP DISPATCH ── */
function openWa(msg) {
  window.open(`https://wa.me/${fullPhone()}?text=${encodeURIComponent(msg)}`, '_blank');
}

function autoAlert(tool) {
  if (!hasWa() || !wa.auto) return;
  if (tool.pieces <= 0 || tool.pieces > STOCK_LIMIT) return;
  if (alertedIds.includes(tool.id)) return;
  alertedIds.push(tool.id);
  saveAlerted();
  setTimeout(() => {
    openWa(buildWaMsg(tool.name, tool.pieces));
    showToast(`📲 Alerta enviada a WhatsApp por ${tool.name}`);
  }, 600);
}

function sendManualAlert(id) {
  const t = tools.find(x=>x.id===id);
  if (!t) return;
  if (!hasWa()) { openWaModal(); showToast('⚠️ Primero configura el número'); return; }
  openWa(buildWaMsg(t.name, t.pieces));
}

function sendWaTest() {
  if (!hasWa()) { showToast('⚠️ Ingresa un número primero'); return; }
  const who = wa.name || 'Encargado';
  openWa(`✅ *Prueba de Alerta — CatálogoTools*\n\nHola *${who}*, este es un mensaje de prueba. Las alertas de stock bajo (≤ ${STOCK_LIMIT} piezas) llegarán automáticamente a este número. 🔧`);
}

/* ── STATS ── */
function renderStats(list) {
  document.getElementById('st-total').textContent = list.length;
  document.getElementById('st-ok').textContent    = list.filter(t=>t.pieces>STOCK_LIMIT).length;
  document.getElementById('st-low').textContent   = list.filter(t=>t.pieces>0&&t.pieces<=STOCK_LIMIT).length;
  document.getElementById('st-empty').textContent = list.filter(t=>t.pieces===0).length;
}

/* ── WA STATUS CHIP ── */
function renderWaChip() {
  const chip  = document.getElementById('wa-status-chip');
  const label = document.getElementById('ws-label');
  if (hasWa()) {
    chip.classList.remove('unconfigured');
    const who = wa.name || `+${wa.country} ${wa.phone}`;
    label.textContent = `Alertas activas → ${who}`;
  } else {
    chip.classList.add('unconfigured');
    label.textContent = '⚠️ WhatsApp no configurado — toca para activar';
  }
}

/* ── RENDER CARDS ── */
function renderCards() {
  const q = document.getElementById('search-input').value.toLowerCase().trim();
  const filtered = q
    ? tools.filter(t=>t.name.toLowerCase().includes(q)||t.desc.toLowerCase().includes(q))
    : tools;

  renderStats(filtered);
  document.getElementById('section-label').textContent =
    q ? `Resultados (${filtered.length})` : `Todas las herramientas (${tools.length})`;

  const container = document.getElementById('cards-container');
  const empty     = document.getElementById('empty-state');

  if (!filtered.length) { container.innerHTML=''; empty.classList.add('show'); return; }
  empty.classList.remove('show');

  const showBtn = wa.btn;

  container.innerHTML = filtered.map((t,i) => {
    const isAlert = t.pieces > 0 && t.pieces <= STOCK_LIMIT;
    const iconHTML = t.img
      ? `<img src="${t.img}" alt="${t.name}">`
      : t.icon;
    const iconStyle = t.img ? '' : `background:${t.color}22;border:1.5px solid ${t.color}44;`;

    let alertRow = '';
    if (isAlert) {
      if (hasWa() && showBtn) {
        alertRow = `
        <div class="stock-alert-row">
          <span class="sa-text">⚠️ Solo quedan <strong>${t.pieces}</strong> piezas</span>
          <button class="wa-send-btn" onclick="sendManualAlert('${t.id}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
              <path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.979-1.304A9.963 9.963 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 11.999 2zm.001 18a7.946 7.946 0 01-4.291-1.254l-.308-.183-3.172.831.845-3.083-.2-.317A7.945 7.945 0 014 12c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8z"/>
            </svg>
            Avisar WA
          </button>
        </div>`;
      } else if (!hasWa()) {
        alertRow = `
        <div class="wa-not-set" onclick="openWaModal()">
          <span>⚠️ Stock bajo · Configura WhatsApp para recibir alertas</span>
          <span class="setup-link">Configurar ›</span>
        </div>`;
      }
    }

    return `
    <div class="tool-card${isAlert?' alert-stock':''}" style="animation-delay:${i*.06}s">
      <div class="card-header">
        <div class="tool-icon" style="${iconStyle}">${iconHTML}</div>
        <div class="card-title-wrap">
          <div class="tool-name">${t.name}</div>
          <div class="tool-desc">${t.desc || ''}</div>
        </div>
        <div class="pieces-badge ${pClass(t.pieces)}">${pLabel(t.pieces)}</div>
      </div>
      ${alertRow}
      <div class="card-dates">
        <div class="date-chip"><span class="label">Ingreso</span><span class="value">${formatDate(t.entry)}</span></div>
        <div class="date-chip"><span class="label">Salida</span><span class="value">${formatDate(t.exit)}</span></div>
      </div>
      <div class="card-actions">
        <button class="action-btn edit" onclick="openEditModal('${t.id}')">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg> Editar
        </button>
        <button class="action-btn delete" onclick="openDeleteModal('${t.id}')">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg> Eliminar
        </button>
      </div>
    </div>`;
  }).join('');
}

/* ── WA MODAL ── */
function openWaModal() {
  document.getElementById('wa-country').value = wa.country || '52';
  document.getElementById('wa-phone').value   = wa.phone;
  document.getElementById('wa-name').value    = wa.name;
  document.getElementById('tog-auto').checked = wa.auto !== false;
  document.getElementById('tog-btn').checked  = wa.btn  !== false;
  updateMsgPreview();
  document.getElementById('wa-modal').classList.add('open');
}
function closeWaModal()        { document.getElementById('wa-modal').classList.remove('open'); }
function closeWaOnOverlay(e)   { if(e.target===document.getElementById('wa-modal')) closeWaModal(); }

function updateMsgPreview() {
  const name  = document.getElementById('wa-name').value.trim() || 'Encargado';
  const phone = document.getElementById('wa-phone').value.trim();
  const code  = document.getElementById('wa-country').value;
  const prev  = document.getElementById('msg-preview-text');
  if (!phone) { prev.textContent = '— Ingresa un número para ver la vista previa —'; return; }
  prev.innerHTML =
    `<b>Para:</b> +${code} ${phone}<br><br>` +
    `⚠️ <b>Alerta de Stock Bajo</b><br><br>` +
    `Hola <b>${name}</b>, la herramienta <b>[Nombre]</b> tiene solo <b>[N] piezas</b> disponibles. Por favor revisa el inventario y realiza el reabastecimiento. 📦`;
}

async function saveWaConfig() {
  const phone = document.getElementById('wa-phone').value.trim().replace(/\D/g,'');
  if (!phone) { showToast('⚠️ Ingresa un número de WhatsApp'); return; }
  wa.country = document.getElementById('wa-country').value;
  wa.phone   = phone;
  wa.name    = document.getElementById('wa-name').value.trim();
  wa.auto    = document.getElementById('tog-auto').checked;
  wa.btn     = document.getElementById('tog-btn').checked;

  // Guardar en Supabase
  await dbSaveWaConfig(wa);
  // Fallback local
  localStorage.setItem('ct-wa2', JSON.stringify(wa));

  alertedIds = [];
  saveAlerted();
  closeWaModal();
  renderWaChip();
  renderCards();
  showToast('✅ Número de WhatsApp guardado');

  if (wa.auto) {
    tools.filter(t=>t.pieces>0&&t.pieces<=STOCK_LIMIT).forEach((t,i) => {
      setTimeout(() => autoAlert(t), i*800);
    });
  }
}

/* ── TOOL FORM ── */
function openAddModal() {
  editingId=null; selIcon=ICONS[0]; selImgB64=null;
  document.getElementById('modal-title').innerHTML = 'Nueva <span>Herramienta</span>';
  document.getElementById('f-name').value   = '';
  document.getElementById('f-desc').value   = '';
  document.getElementById('f-entry').value  = new Date().toISOString().split('T')[0];
  document.getElementById('f-exit').value   = '';
  document.getElementById('f-pieces').value = '';
  buildIconSelector(selIcon);
  resetImgPanel();
  switchTab('icon');
  document.getElementById('form-modal').classList.add('open');
}

function openEditModal(id) {
  const t = tools.find(x=>x.id===id);
  if(!t) return;
  editingId=id; selIcon=t.icon; selImgB64=t.img||null;
  document.getElementById('modal-title').innerHTML = 'Editar <span>Herramienta</span>';
  document.getElementById('f-name').value   = t.name;
  document.getElementById('f-desc').value   = t.desc;
  document.getElementById('f-entry').value  = t.entry;
  document.getElementById('f-exit').value   = t.exit;
  document.getElementById('f-pieces').value = t.pieces;
  buildIconSelector(selIcon);
  resetImgPanel();
  if (t.img) {
    selImgB64=t.img;
    document.getElementById('img-preview').src=t.img;
    document.getElementById('img-placeholder').style.display='none';
    document.getElementById('img-preview-wrap').style.display='inline-block';
    switchTab('img');
  } else switchTab('icon');
  document.getElementById('form-modal').classList.add('open');
}

function closeFormModal()          { document.getElementById('form-modal').classList.remove('open'); }
function closeFormOnOverlay(e)     { if(e.target===document.getElementById('form-modal')) closeFormModal(); }

async function saveTool() {
  const name   = document.getElementById('f-name').value.trim();
  const desc   = document.getElementById('f-desc').value.trim();
  const entry  = document.getElementById('f-entry').value;
  const exit   = document.getElementById('f-exit').value;
  const pieces = parseInt(document.getElementById('f-pieces').value)||0;
  if (!name) { showToast('⚠️ El nombre es obligatorio'); return; }

  const imgVal = (pickerMode==='img'&&selImgB64) ? selImgB64 : null;
  const data   = { icon:selIcon, color:iconColor(selIcon), img:imgVal, name, desc, entry, exit, pieces };

  showLoading('Guardando…');
  let tool;
  if (editingId) {
    const updated = await dbUpdateTool(editingId, data);
    if (updated) {
      const idx = tools.findIndex(x=>x.id===editingId);
      const prevPieces = tools[idx].pieces;
      tools[idx] = { ...tools[idx], ...data };
      tool = tools[idx];
      if (prevPieces !== pieces) alertedIds = alertedIds.filter(id=>id!==editingId);
      showToast('✏️ Herramienta actualizada');
    } else {
      showToast('❌ Error al actualizar');
    }
  } else {
    const inserted = await dbInsertTool(data);
    if (inserted) {
      tools.unshift(inserted);
      tool = inserted;
      showToast('✅ Herramienta agregada');
    } else {
      showToast('❌ Error al guardar');
    }
  }

  hideLoading();
  saveAlerted();
  closeFormModal();
  renderCards();
  if (tool) autoAlert(tool);
}

/* ── DELETE ── */
function openDeleteModal(id) { deleteId=id; document.getElementById('confirm-modal').classList.add('open'); }
function closeConfirmModal()  { document.getElementById('confirm-modal').classList.remove('open'); deleteId=null; }

async function confirmDelete() {
  showLoading('Eliminando…');
  const ok = await dbDeleteTool(deleteId);
  if (ok) {
    alertedIds = alertedIds.filter(id=>id!==deleteId);
    tools = tools.filter(t=>t.id!==deleteId);
    saveAlerted();
    showToast('🗑️ Herramienta eliminada');
  } else {
    showToast('❌ Error al eliminar');
  }
  hideLoading();
  closeConfirmModal();
  renderCards();
}

/* ── ICON / IMAGE PICKER ── */
function switchTab(mode) {
  pickerMode=mode;
  document.getElementById('tab-icon').classList.toggle('active',mode==='icon');
  document.getElementById('tab-img').classList.toggle('active', mode==='img');
  document.getElementById('panel-icon').style.display = mode==='icon'?'':'none';
  document.getElementById('panel-img').style.display  = mode==='img' ?'':'none';
}
function buildIconSelector(cur) {
  document.getElementById('icon-selector').innerHTML = ICONS.map(ic=>
    `<button class="icon-opt ${ic===cur?'selected':''}" onclick="selectIcon('${ic}',this)">${ic}</button>`
  ).join('');
}
function selectIcon(icon,el) {
  selIcon=icon;
  document.querySelectorAll('.icon-opt').forEach(b=>b.classList.remove('selected'));
  el.classList.add('selected');
}
function handleFileSelect(e) { const f=e.target.files[0]; if(f) loadImg(f); }
function handleDrop(e) {
  e.preventDefault();
  document.getElementById('upload-area').classList.remove('dragover');
  const f=e.dataTransfer.files[0];
  if(f&&f.type.startsWith('image/')) loadImg(f);
}
function loadImg(file) {
  const reader=new FileReader();
  reader.onload=ev=>{
    const img=new Image();
    img.onload=()=>{
      const c=document.createElement('canvas'); c.width=88; c.height=88;
      const ctx=c.getContext('2d');
      const size=Math.min(img.width,img.height);
      ctx.drawImage(img,(img.width-size)/2,(img.height-size)/2,size,size,0,0,88,88);
      selImgB64=c.toDataURL('image/jpeg',.82);
      document.getElementById('img-preview').src=selImgB64;
      document.getElementById('img-placeholder').style.display='none';
      document.getElementById('img-preview-wrap').style.display='inline-block';
    };
    img.src=ev.target.result;
  };
  reader.readAsDataURL(file);
}
function removeImage(e) {
  e.stopPropagation(); selImgB64=null;
  document.getElementById('img-file-input').value='';
  document.getElementById('img-placeholder').style.display='';
  document.getElementById('img-preview-wrap').style.display='none';
}
function resetImgPanel() {
  selImgB64=null;
  document.getElementById('img-file-input').value='';
  document.getElementById('img-placeholder').style.display='';
  document.getElementById('img-preview-wrap').style.display='none';
}

/* ── TOAST ── */
function showToast(msg) {
  const t=document.getElementById('toast');
  t.textContent=msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2800);
}

/* ── INIT ── */
(async () => {
  showLoading('Conectando con base de datos…');

  // Cargar configuración WA desde Supabase (o fallback localStorage)
  try {
    const waDb = await dbLoadWaConfig();
    if (waDb) {
      wa = { country: waDb.country || '52', phone: waDb.phone || '', name: waDb.name || '', auto: waDb.auto !== false, btn: waDb.btn !== false };
    } else {
      wa = JSON.parse(localStorage.getItem('ct-wa2') || '{"country":"52","phone":"","name":"","auto":true,"btn":true}');
    }
  } catch(e) {
    wa = JSON.parse(localStorage.getItem('ct-wa2') || '{"country":"52","phone":"","name":"","auto":true,"btn":true}');
  }

  // Cargar herramientas desde Supabase
  try {
    tools = await dbLoadTools();
  } catch(e) {
    console.error('Error cargando herramientas:', e);
    tools = [];
  }

  hideLoading();
  renderWaChip();
  renderCards();

  // Auto-alertas al cargar
  if (hasWa() && wa.auto) {
    tools.filter(t=>t.pieces>0&&t.pieces<=STOCK_LIMIT).forEach((t,i)=>{
      setTimeout(()=>autoAlert(t), 1500 + i*800);
    });
  }
})();
