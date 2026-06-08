// ============================================================
//  supabase.js  —  Configuración y operaciones de base de datos
// ============================================================

const SUPABASE_URL      = 'https://TU_PROYECTO.supabase.co';  // ← Cambia por tu URL real
const SUPABASE_ANON_KEY = 'TU_ANON_KEY_AQUI';                 // ← Cambia por tu clave ANON real

// Inicialización correcta para el navegador usando la CDN del index.html
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── TOOLS ─────────────────────────────────────────────────────

/** Obtiene todas las herramientas ordenadas por fecha de creación */
async function dbLoadTools() {
  const { data, error } = await db
    .from('tools')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) { 
    console.error('dbLoadTools:', error); 
    return []; 
  }
  
  return (data || []).map(row => ({
    id:         row.id,
    icon:       row.icon,
    color:      row.color,
    img:        row.img,
    name:       row.tool_name,  // Mapeo correcto a tu tabla SQL
    desc:       row.tool_desc,  // Mapeo correcto a tu tabla SQL
    entry:      row.entry,
    exit:       row.exit_date,  // Mapeo correcto a tu tabla SQL
    pieces:     row.pieces,
    created_at: row.created_at
  }));
}

/** Inserta una nueva herramienta */
async function dbAddTool(tool) {
  const { data, error } = await db
    .from('tools')
    .insert([{
      icon:      tool.icon,
      color:     tool.color,
      img:       tool.img,
      tool_name: tool.name,      // Columna SQL real
      tool_desc: tool.desc,      // Columna SQL real
      entry:     tool.entry || null,
      exit_date: tool.exit || null, // Columna SQL real
      pieces:    tool.pieces
    }])
    .select()
    .single();
    
  if (error) { console.error('dbAddTool:', error); return null; }
  return data;
}

/** Actualiza una herramienta existente */
async function dbUpdateTool(id, tool) {
  const { data, error } = await db
    .from('tools')
    .update({
      icon:      tool.icon,
      color:     tool.color,
      img:       tool.img,
      tool_name: tool.name,
      tool_desc: tool.desc,
      entry:     tool.entry || null,
      exit_date: tool.exit || null,
      pieces:    tool.pieces
    })
    .eq('id', id)
    .select()
    .single();
    
  if (error) { console.error('dbUpdateTool:', error); return null; }
  return data;
}

/** Elimina una herramienta por id */
async function dbDeleteTool(id) {
  const { error } = await db
    .from('tools')
    .delete()
    .eq('id', id);
    
  if (error) { console.error('dbDeleteTool:', error); return false; }
  return true;
}

// ── WA CONFIG ─────────────────────────────────────────────────

async function dbLoadWaConfig() {
  const { data, error } = await db
    .from('wa_config')
    .select('*')
    .eq('id', 1)
    .maybeSingle(); // Usamos maybeSingle para evitar excepciones si está vacío
    
  if (error || !data) return null;
  return {
    country: data.country,
    phone:   data.phone,
    name:    data.contact_name, 
    auto:    data.auto,
    btn:     data.btn
  };
}

async function dbSaveWaConfig(config) {
  const { error } = await db
    .from('wa_config')
    .upsert({
      id:           1,
      country:      config.country,
      phone:        config.phone,
      contact_name: config.name, 
      auto:         config.auto,
      btn:          config.btn,
      updated_at:   new Date()
    });
    
  if (error) { console.error('dbSaveWaConfig:', error); return false; }
  return true;
}
