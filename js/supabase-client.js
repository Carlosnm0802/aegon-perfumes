// ============================================================
// CLIENTE DE SUPABASE
// ============================================================
// Punto único de conexión a Supabase. Cualquier archivo que
// necesite consultar la base de datos importa `supabaseClient`
// desde aquí — nunca se crea un segundo cliente en otro lugar.
//
// La publishable key es segura de exponer en el frontend: está
// protegida por las políticas RLS configuradas en Supabase,
// no por estar oculta.
// ============================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://eltgbuxccrpyjlbhzmut.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_tg-YNl68r5gjMeRHs49J4A_7zg5Ubm-';

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);