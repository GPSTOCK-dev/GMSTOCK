// ============================================================
//  supabase.js  —  Configuración y operaciones de base de datos
//  INSTRUCCIONES: Reemplaza SUPABASE_URL y SUPABASE_ANON_KEY
//  con los valores de tu proyecto en https://supabase.com
// ============================================================

const SUPABASE_URL      = 'https://TU_PROYECTO.supabase.co';  // ← cambia esto
const SUPABASE_ANON_KEY = 'TU_ANON_KEY_AQUI';                 // ← cambia esto

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── TOOLS ─────────────────────────────────────────────────────

/** Obtiene todas las herramientas ordenadas por fecha de creación */
async function dbLoadTools() {
  const { data, error } = await db
    .from('tools')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('dbLoadTools:', error); return []; }
  // Mapear columnas de BD → nombres internos de la app
  return (data || []).map(row => ({
    id:     row.id,
    icon:   row.icon,
    color:  row.color,
    img:    row.img,
    name:   row.tool_name,
    desc:   row.tool_desc,
    entry:  row.entry,
    exit:   row.exit_date,
    pieces: row.pieces,
    created_at: row.created_at
  }));
}

/** Inserta una nueva herramienta */
async function dbInsertTool(tool) {
  const { data, error } = await db
    .from('tools')
    .insert([{
      icon:      tool.icon,
      color:     tool.color,
      img:       tool.img,
      tool_name: tool.name,
      tool_desc: tool.desc,
      entry:     tool.entry || null,
      exit_date: tool.exit  || null,
      pieces:    tool.pieces
    }])
    .select()
    .single();
  if (error) { console.error('dbInsertTool:', error); return null; }
  // Devolver con nombres internos
  return {
    id:     data.id,
    icon:   data.icon,
    color:  data.color,
    img:    data.img,
    name:   data.tool_name,
    desc:   data.tool_desc,
    entry:  data.entry,
    exit:   data.exit_date,
    pieces: data.pieces,
    created_at: data.created_at
  };
}

/** Actualiza una herramienta existente por id */
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
      exit_date: tool.exit  || null,
      pieces:    tool.pieces
    })
    .eq('id', id)
    .select()
    .single();
  if (error) { console.error('dbUpdateTool:', error); return null; }
  return {
    id:     data.id,
    icon:   data.icon,
    color:  data.color,
    img:    data.img,
    name:   data.tool_name,
    desc:   data.tool_desc,
    entry:  data.entry,
    exit:   data.exit_date,
    pieces: data.pieces
  };
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
    .single();
  if (error) return null;
  return {
    country: data.country,
    phone:   data.phone,
    name:    data.contact_name,  // mapeamos contact_name → name interno
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
      contact_name: config.name,  // name interno → contact_name en BD
      auto:         config.auto,
      btn:          config.btn,
      updated_at:   new Date().toISOString()
    });
  if (error) { console.error('dbSaveWaConfig:', error); }
}
