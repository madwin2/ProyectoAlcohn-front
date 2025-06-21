import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sacwoixhoedrxjwvxftl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhY3dvaXhob2Vkcnhqd3Z4ZnRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMjE4NjUsImV4cCI6MjA2NDg5Nzg2NX0.E6I9j-WHOiUiu6DY73OLoNo8ZiqxDvD_dUtJNEV-WkE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 