import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://crganrhcujasxmmywtkb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZ2FucmhjdWphc3htbXl3dGtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MzMwMzQsImV4cCI6MjA2MDQwOTAzNH0.o_R2zSvEQQ7pZMlF2W8_6UX_Z-094QXAzDOeeEj16MM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 