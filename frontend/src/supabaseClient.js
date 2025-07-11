import { createClient } from '@supabase/supabase-js'

// Obtén la URL y la clave anónima de tu proyecto en Supabase desde variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Crea y exporta el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseKey) 