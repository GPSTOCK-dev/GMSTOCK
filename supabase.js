// ============================================================
//  supabase.js — Corregido para Navegador / GitHub Pages
// ============================================================

const SUPABASE_URL      = 'https://qsdxxofjgodegypayaoz.supabase.co/rest/v1/'; 
const SUPABASE_ANON_KEY = 'sb_publishable_uF_-5NsqRJJFEv3MElzkpg_qFHhmXhT'; 

// Inicialización desde la CDN global
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
    name:       row.tool_name,  
    desc:       row.tool_desc,  
    entry:      row.entry,
    exit:       row.exit_date,  
    pieces:     row.pieces,
    created_at: row.created_at
  }));
}

/** Inserta una nueva herramienta y retorna el objeto mapeado */
async function dbAddTool(tool) {
  const { data, error } = await db
    .from('tools')
    .insert([{
      icon:      tool.icon,
      color:     tool.color,
      img:       tool.img,
      tool_name: tool.name,      
      tool_desc: tool.desc,      
      entry:     tool.entry || null,
      exit_date: tool.exit || null, 
      pieces:    tool.pieces
    }])
    .select()
    .single();
    
  if (error) { 
    console.error('dbAddTool:', error); 
    return null; 
  }
  
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

/** Actualiza una herramienta existente y retorna el objeto mapeado */
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
    
  if (error) { 
    console.error('dbUpdateTool:', error); 
    return null; 
  }
  
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
    .maybeSingle(); 
    
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
