import { createClient } from '@supabase/supabase-js'

// Obtén la URL y la clave anónima de tu proyecto en Supabase
const supabaseUrl = 'https://sacwoixhoedrxjwvxftl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhY3dvaXhob2Vkcnhqd3Z4ZnRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMjE4NjUsImV4cCI6MjA2NDg5Nzg2NX0.E6I9j-WHOiUiu6DY73OLoNo8ZiqxDvD_dUtJNEV-WkE'

// Crea y exporta el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseKey) 