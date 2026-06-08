// ============================================================
//  supabase.js — Inicialización y acceso a datos con Supabase
//  Para GitHub Pages: reemplaza SUPABASE_ANON_KEY con tu clave real
// ============================================================

const SUPABASE_URL      = 'https://lfidvwtvbxvobvhyndbh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzZHh4b2ZqZ29kZWd5cGF5YW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NzMzMjAsImV4cCI6MjA5NjQ0OTMyMH0.1a9ZQFo9Vvw-ODGjUKpfMkh_Mgdp4byRajpdMZziDF4'; // 👈 Pega aquí tu clave completa desde Supabase → Settings → API

// Inicialización usando la CDN de Supabase cargada en index.html
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── TOOLS ──────────────────────────────────────────────────────

/** Carga todas las herramientas ordenadas por fecha de creación */
async function dbLoadTools() {
  try {
    const { data, error } = await db
      .from('tools')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) { console.error('dbLoadTools:', error); return []; }

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
  } catch (e) {
    console.error('dbLoadTools exception:', e);
    return [];
  }
}

/** Inserta una nueva herramienta y retorna la fila creada */
async function dbAddTool(tool) {
  try {
    const { data, error } = await db
      .from('tools')
      .insert([{
        icon:      tool.icon      || null,
        color:     tool.color     || null,
        img:       tool.img       || null,
        tool_name: tool.name,
        tool_desc: tool.desc      || null,
        entry:     tool.entry     || null,
        exit_date: tool.exit      || null,
        pieces:    tool.pieces    ?? 0
      }])
      .select()
      .single();

    if (error) { console.error('dbAddTool:', error); return null; }
    return data;
  } catch (e) {
    console.error('dbAddTool exception:', e);
    return null;
  }
}

/** Actualiza una herramienta existente y retorna la fila actualizada */
async function dbUpdateTool(id, tool) {
  try {
    const { data, error } = await db
      .from('tools')
      .update({
        icon:      tool.icon      || null,
        color:     tool.color     || null,
        img:       tool.img       || null,
        tool_name: tool.name,
        tool_desc: tool.desc      || null,
        entry:     tool.entry     || null,
        exit_date: tool.exit      || null,
        pieces:    tool.pieces    ?? 0
      })
      .eq('id', id)
      .select()
      .single();

    if (error) { console.error('dbUpdateTool:', error); return null; }
    return data;
  } catch (e) {
    console.error('dbUpdateTool exception:', e);
    return null;
  }
}

/** Elimina una herramienta por id */
async function dbDeleteTool(id) {
  try {
    const { error } = await db
      .from('tools')
      .delete()
      .eq('id', id);

    if (error) { console.error('dbDeleteTool:', error); return false; }
    return true;
  } catch (e) {
    console.error('dbDeleteTool exception:', e);
    return false;
  }
}

// ── WA CONFIG ──────────────────────────────────────────────────

/** Carga la configuración de WhatsApp (fila id=1) */
async function dbLoadWaConfig() {
  try {
    const { data, error } = await db
      .from('wa_config')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error || !data) return null;
    return {
      country: data.country      || '52',
      phone:   data.phone        || '',
      name:    data.contact_name || '',
      auto:    data.auto         ?? true,
      btn:     data.btn          ?? true
    };
  } catch (e) {
    console.error('dbLoadWaConfig exception:', e);
    return null;
  }
}

/** Guarda (upsert) la configuración de WhatsApp */
async function dbSaveWaConfig(config) {
  try {
    const { error } = await db
      .from('wa_config')
      .upsert({
        id:           1,
        country:      config.country,
        phone:        config.phone,
        contact_name: config.name,
        auto:         config.auto,
        btn:          config.btn,
        updated_at:   new Date().toISOString()
      });

    if (error) { console.error('dbSaveWaConfig:', error); return false; }
    return true;
  } catch (e) {
    console.error('dbSaveWaConfig exception:', e);
    return false;
  }
}
